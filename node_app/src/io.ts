import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { set, z } from 'zod'
import { faker } from '@faker-js/faker'
import {
    airfarmData,
    deviceState,
    FAN_CONTROL_TOPIC,
    LED_CONTROL_TOPIC,
    PUMP_CONTROL_TOPIC,
    SENSOR_TOPIC,
    IO_TOPIC,
} from './common'

dotenv.config()

const brokerUrl = process.env.BROKER_URL

if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

const deviceStatus: deviceState = {
    fan: false,
    pump: false,
    led: false,
}

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

/*
    Not using dummy data. I want to make the more logical data.
*/

// function generateDummyData(): AirfarmData {
//     return {
//         temperature: parseFloat(faker.number.float({ min: 15, max: 30 }).toFixed(1)),
//         humidity: faker.number.int({ min: 30, max: 70 }),
//         co2Level: faker.number.int({ min: 300, max: 1000 }),
//         timestamp: faker.date.recent().toISOString(),
//     }
// }

let airfarmData = {
    temperature: 25, // 25 degree celsius
    humidity: 60, // 60% humidity
    co2Level: 500, // 500 ppm
    timestamp: new Date().toISOString(),
}

function initialSensorData() {
    return airfarmData
}

// Connect to the broker
client.on('connect', () => {
    console.log('Publisher connected')
    client.subscribe('airfarm/control/+')

    setInterval(() => {
        const payload = initialSensorData()
        pub(SENSOR_TOPIC, payload)
        pub(IO_TOPIC, deviceStatus) // publish current device status
    }, 10000)
})

function updateState() {
    // LED 효과
    if (deviceStatus.led) {
        airfarmData.temperature += 0.1 // LED 작동으로 발생하는 열
        airfarmData.co2Level -= 5 // LED 작동으로 광합성 -> co2 농도 감소
    } else {
        airfarmData.temperature -= 0.05 // LED가 꺼져있으면 온도가 서서히 떨어짐
    }

    // Fan 효과
    if (deviceStatus.fan) {
        // airfarmData.temperature -= 0.1 // Fan 작동으로 열이 빠져나감
        airfarmData.co2Level += 10 // 환기로 외부의 co2 유입되어 co2 농도 상승
        airfarmData.humidity -= 0.1 // Fan 작동으로 습도 감소
    }

    // Pump 효과
    if (deviceStatus.pump) {
        airfarmData.humidity += 0.2 // pump 작동으로 습도 상승
    }
}

setInterval(updateState, 1000)

// Handle incoming messages
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
