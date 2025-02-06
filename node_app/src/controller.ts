import mqtt from 'mqtt'
import dotenv from 'dotenv'
import {
    airfarmDataSchema,
    deviceStateSchema,
    FAN_CONTROL_TOPIC,
    IO_TOPIC,
    LED_CONTROL_TOPIC,
    PUMP_CONTROL_TOPIC,
    SENSOR_TOPIC,
} from './common'
import { ZodAny } from 'zod'

dotenv.config()

const brokerUrl = process.env.BROKER_URL
if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
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

type Route = { topic: string; schema: any; handler: (topic: string, data: unknown) => void }
const routes: Route[] = []

function match(topic: string, schema: any, handler: (topic: string, msg: unknown) => void) {
    routes.push({ topic, schema, handler })
}

match(SENSOR_TOPIC, airfarmDataSchema, (topic, data) => {
    const validatedData = airfarmDataSchema.parse(data)
    console.log('valid SENSOR Data:', validatedData)

    const isFanOn = validatedData.temperature > 25
    pub(FAN_CONTROL_TOPIC, isFanOn)

    const isPumpOn = validatedData.humidity < 40
    pub(PUMP_CONTROL_TOPIC, isPumpOn)

    const isLedOn = validatedData.co2Level > 800
    pub(LED_CONTROL_TOPIC, isLedOn)
})

match(IO_TOPIC, airfarmDataSchema, (topic, data) => {
    const validatedData = deviceStateSchema.parse(data)
    console.log('valid IO Data:', validatedData)
    console.log(`Fan status: ${validatedData.fan}`)
    console.log(`Pump status: ${validatedData.pump}`)
    console.log(`LED status: ${validatedData.led}`)
})

client.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString())

        routes.forEach((route) => {
            if (topic === route.topic) {
                try {
                    route.handler(topic, route.schema.parse(data))
                } catch (e) {}
            }
        })
    } catch (err) {
        console.error('data parse error:', err)
    }
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
