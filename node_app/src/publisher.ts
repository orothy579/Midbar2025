import mqtt from 'mqtt'
import { config } from 'dotenv'
import { faker } from '@faker-js/faker'

config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const baseTopic = process.env.TOPIC || 'test/'

const client = mqtt.connect(brokerUrl)

const airfarms = ['airfarm1', 'airfarm2', 'airfarm3', 'airfarm4', 'airfarm5']
interface AirfarmData {
    temperature: number
    humidity: number
    co2Level: number
    led: 'on' | 'off'
    fan: 'on' | 'off'
    pump: 'on' | 'off'
    timestamp: string
}

function generateDummyData(): AirfarmData {
    return {
        temperature: parseFloat(faker.number.float({ min: 15, max: 30 }).toFixed(1)),
        humidity: faker.number.int({ min: 30, max: 70 }),
        co2Level: faker.number.int({ min: 300, max: 1000 }),
        led: faker.helpers.arrayElement(['on', 'off']),
        fan: faker.helpers.arrayElement(['on', 'off']),
        pump: faker.helpers.arrayElement(['on', 'off']),
        timestamp: faker.date.recent().toISOString(),
    }
}

const dummyDataList: AirfarmData[] = Array.from({ length: 5 }, () => generateDummyData())

client.on('connect', () => {
    console.log(`Publisher connected to nanoMQ on ${brokerUrl}`)

    airfarms.forEach((airfarm) => {
        // 왜 forEach를 사용하는지 이해가 안됨, 그리고 왜 airfarm 이 하나로 고정되고 안 넘어가는지 이해 안됨
        setInterval(() => {
            const payload = dummyDataList
            const topic = `${baseTopic}/${airfarm}`
            client.publish(topic, JSON.stringify(payload))
        }, 1000)
    })
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})
