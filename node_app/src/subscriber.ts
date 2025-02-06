import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { z } from 'zod'
import { controlFan, controlPump, controlLed, getDeviceStatus } from './task_controller'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || ''
const SENSOR_TOPIC = process.env.SENSOR_TOPIC || ''

const client = mqtt.connect(brokerUrl)

const AirfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    timestamp: z.string().datetime(),
})

const validateData = (data: unknown) => {
    const result = AirfarmDataSchema.safeParse(data)
    if (result.success) {
        return result.data
    } else {
        console.error('Validation error:', result.error)
        return null
    }
}

client.on('connect', () => {
    console.log('Subscriber connected to nanoMQ')

    client.subscribe(SENSOR_TOPIC, (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${SENSOR_TOPIC}`)
    })
})

client.on('message', (topic, message) => {
    if (topic === SENSOR_TOPIC) {
        try {
            const data = JSON.parse(message.toString())
            const validatedData = validateData(data)
            if (validatedData) {
                console.log('valid Data:', validatedData)

                if (validatedData.temperature > 25) {
                    controlFan('on')
                } else {
                    controlFan('off')
                }

                if (validatedData.humidity < 40) {
                    controlPump('on')
                } else {
                    controlPump('off')
                }

                if (validatedData.co2Level > 800) {
                    controlLed('on')
                } else {
                    controlLed('off')
                }

                console.log(`Fan status: ${getDeviceStatus('fan')}`)
                console.log(`Pump status: ${getDeviceStatus('pump')}`)
                console.log(`LED status: ${getDeviceStatus('led')}`)
            }
        } catch (err) {
            console.error('JSON parse error:', err)
        }
    }
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
