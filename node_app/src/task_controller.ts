import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

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

export class TaskController {
    private client: mqtt.MqttClient
    private airfarms: Map<string, z.infer<typeof AirfarmDataSchema>>

    constructor(client: mqtt.MqttClient) {
        this.client = client
        this.airfarms = new Map()
    }

    public handleMessage(topic: string, message: Buffer) {
        try {
            const parsedMessage = JSON.parse(message.toString())
            const result = AirfarmDataSchema.safeParse(parsedMessage)
            if (result.success) {
                console.log(`Received valid message from ${topic}:`, result.data)
                const airfarmId = topic.split('/').pop()
                if (!airfarmId) return

                this.airfarms.set(airfarmId, result.data)
                this.processRules(airfarmId, result.data)
            } else {
                console.error(`Received invalid message from ${topic}:`, result.error)
            }
        } catch (err) {
            console.error(`Error parsing message from ${topic}:`, err)
        }
    }

    private processRules(airfarmId: string, data: z.infer<typeof AirfarmDataSchema>) {
        if (data.temperature > 25 || data.co2Level > 800) {
            this.controlDevice(airfarmId, 'fan', 'on')
        } else {
            this.controlDevice(airfarmId, 'fan', 'off')
        }

        if (data.humidity < 40) {
            this.controlDevice(airfarmId, 'pump', 'on')
            setTimeout(() => {
                this.controlDevice(airfarmId, 'pump', 'off')
            }, 5000)
        }

        if (data.co2Level > 1000) {
            this.controlDevice(airfarmId, 'led', 'on')
        } else {
            this.controlDevice(airfarmId, 'led', 'off')
        }
    }

    private controlDevice(airfarmId: string, device: string, action: 'on' | 'off') {
        const topic = `${baseTopic}/control/${airfarmId}/${device}`
        const message = JSON.stringify({ action })
        this.client.publish(topic, message)
        console.log(`[${airfarmId}] Setting ${device} to ${action}`)
    }

    public getAirfarmStatus(airfarmId: string): z.infer<typeof AirfarmDataSchema> | undefined {
        return this.airfarms.get(airfarmId)
    }
}
