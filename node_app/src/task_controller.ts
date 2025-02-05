import mqtt from 'mqtt'
import { z } from 'zod'

const baseTopic = process.env.TOPIC || 'test/'

export const AirfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    led: z.enum(['on', 'off']),
    fan: z.enum(['on', 'off']),
    pump: z.enum(['on', 'off']),
    timestamp: z.string().datetime(),
})

type AirfarmData = z.infer<typeof AirfarmDataSchema>
type DeviceAction = 'on' | 'off'

const parseMessage = (message: Buffer) => {
    try {
        return JSON.parse(message.toString())
    } catch (err) {
        console.error('Parse error:', err)
        return null
    }
}

const validateData = (data: unknown) => {
    const result = AirfarmDataSchema.safeParse(data)
    if (result.success) {
        console.log('Data:', result.data)
        return result.data
    }
    console.error('Validation error:', result.error)
    return null
}

// 이 함수 뭔지 알고 싶다. 각 airfarm의 데이터를 받아서, 그 데이터를 기반으로 각 airfarm의 장치들을 제어하는 함수인 것 같다.
const controlDevice =
    (client: mqtt.MqttClient) => (airfarmId: string, device: string, action: DeviceAction) => {
        const topic = `${baseTopic}/control/${airfarmId}/${device}`
        client.publish(topic, JSON.stringify({ action }))
        console.log(`[${airfarmId}] Setting ${device} to ${action}`)
    }

const processRules =
    (control: ReturnType<typeof controlDevice>) => (airfarmId: string, data: AirfarmData) => {
        if (data.temperature > 25 || data.co2Level > 800) {
            control(airfarmId, 'fan', 'on')
        } else {
            control(airfarmId, 'fan', 'off')
        }

        if (data.humidity < 40) {
            control(airfarmId, 'pump', 'on')
            setTimeout(() => control(airfarmId, 'pump', 'off'), 5000)
        }

        if (data.co2Level > 1000) {
            control(airfarmId, 'led', 'on')
        } else {
            control(airfarmId, 'led', 'off')
        }
    }

export const TaskController = (client: mqtt.MqttClient) => {
    const control = controlDevice(client)
    const process = processRules(control)

    return {
        handleMessage: (topic: string, message: Buffer) => {
            const parsed = parseMessage(message)
            if (!parsed) return

            const data = validateData(parsed)
            if (!data) return

            const airfarmId = topic.split('/').pop()
            if (!airfarmId) return

            process(airfarmId, data)
        },
    }
}
