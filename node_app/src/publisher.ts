import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { z } from 'zod'
import { faker } from '@faker-js/faker'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || ''
const SENSOR_TOPIC = process.env.SENSOR_TOPIC || ''

const client = mqtt.connect(brokerUrl)

export const AirfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    timestamp: z.string().datetime(),
})

type AirfarmData = z.infer<typeof AirfarmDataSchema>

function generateDummyData(): AirfarmData {
    return {
        temperature: parseFloat(faker.number.float({ min: 15, max: 30 }).toFixed(1)),
        humidity: faker.number.int({ min: 30, max: 70 }),
        co2Level: faker.number.int({ min: 300, max: 1000 }),
        timestamp: faker.date.recent().toISOString(),
    }
}

client.on('connect', () => {
    console.log('Publisher connected')
    setInterval(() => {
        const payload = generateDummyData()
        client.publish(SENSOR_TOPIC, JSON.stringify(payload))
    }, 10000)
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})
