import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { sleep } from './utils'
import { z } from 'zod'
import { fakerNB_NO, hu } from '@faker-js/faker/.'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const baseTopic = process.env.TOPIC || 'test/'

const client = mqtt.connect(brokerUrl)

const airfarms = ['airfarm1', 'airfarm2', 'airfarm3', 'airfarm4', 'airfarm5']

const AirfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    led: z.enum(['on', 'off']),
    fan: z.enum(['on', 'off']),
    pump: z.enum(['on', 'off']),
    timestamp: z.string().datetime(),
})

client.on('connect', () => {
    console.log('Subscriber connected to nanoMQ')

    airfarms.forEach((airfarm) => {
        const topic = `${baseTopic}/${airfarm}`
        client.subscribe(topic, (err) => {
            if (err) {
                console.error('Subscribe error:', err)
                return
            }
            console.log(`Subscribed to ${topic}`)
        })
    })
    sleep(1000).then(() => {
        console.log('Subscriber ready')
    })
})

client.on('message', (topic, message) => {
    try {
        const parsedMessage = JSON.parse(message.toString())
        const result = AirfarmDataSchema.safeParse(parsedMessage)
        if (result.success) {
            console.log(`Received valid message from ${topic}:`, result.data)
        } else {
            console.error(`Received invalid message from ${topic}:`, result.error)
        }
    } catch (err) {
        console.error(`Error parsing message from ${topic}:`, err)
    }
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
