import mqtt from 'mqtt'
import dotenv from 'dotenv'
import {
    airfarmDataSchema,
    DATA_TOPIC,
    deviceStateSchema,
    FAN_CONTROL_TOPIC,
    IO_TOPIC,
    LED_CONTROL_TOPIC,
    PUMP_CONTROL_TOPIC,
    SENSOR_TOPIC,
} from './common'
import { MqttRouter } from './mqtt-router'

dotenv.config()

const brokerUrl = process.env.BROKER_URL
if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('\nSubscriber connected to nanoMQ')

    client.subscribe(DATA_TOPIC, (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${DATA_TOPIC}`)
    })
})

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

const router = new MqttRouter()

router.match(SENSOR_TOPIC, airfarmDataSchema, (message) => {
    console.log('\nvalid SENSOR Data:', message)

    const isFanOn = message.temperature > 25
    pub(FAN_CONTROL_TOPIC, isFanOn)

    const isPumpOn = message.humidity < 40
    pub(PUMP_CONTROL_TOPIC, isPumpOn)

    const isLedOn = message.co2Level > 800
    pub(LED_CONTROL_TOPIC, isLedOn)
})

router.match(IO_TOPIC, deviceStateSchema, (message) => {
    console.log('\nvalid IO Data:', message)
})

client.on('message', (topic, message) => {
    try {
        router.handle(topic, message)
    } catch (err) {
        console.error('data parse error:', err)
    }
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
