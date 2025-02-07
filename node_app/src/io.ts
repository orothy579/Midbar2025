import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { z } from 'zod'
import { faker } from '@faker-js/faker'
import {
    AirfarmData,
    DeviceState,
    FAN_CONTROL_TOPIC,
    IO_TOPIC,
    LED_CONTROL_TOPIC,
    PUMP_CONTROL_TOPIC,
    SENSOR_TOPIC,
} from './common'

dotenv.config()

const brokerUrl = process.env.BROKER_URL

if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

const deviceStatus: DeviceState = {
    fan: false,
    pump: false,
    led: false,
}

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
    client.subscribe('airfarm/control/+')

    setInterval(() => {
        const payload = generateDummyData()
        pub(SENSOR_TOPIC, payload)
        pub(IO_TOPIC, deviceStatus) // publish current device status
    }, 10000)
})

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString())

    console.log('Received control message:', topic, payload)

    if (topic === FAN_CONTROL_TOPIC) {
        deviceStatus.fan = z.boolean().parse(payload)
        pub(IO_TOPIC, deviceStatus)
    }
    if (topic === LED_CONTROL_TOPIC) {
        deviceStatus.led = z.boolean().parse(payload)
        pub(IO_TOPIC, deviceStatus)
    }
    if (topic === PUMP_CONTROL_TOPIC) {
        deviceStatus.pump = z.boolean().parse(payload)
        pub(IO_TOPIC, deviceStatus)
    }
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})
