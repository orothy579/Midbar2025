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
    console.log('\nSubscriber connected to nanoMQ')

    client.subscribe(DATA_TOPIC, (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${DATA_TOPIC}`)
    })
})

// mqtt-router.ts 에서 만들어져 있는 것들 가져다가 쓰는 형태로 바꾸자
type Route = { topic: string; schema: any; handler: (topic: string, data: unknown) => void }
const routes: Route[] = []

function match(topic: string, schema: any, handler: (topic: string, msg: unknown) => void) {
    routes.push({ topic, schema, handler })
}

match(SENSOR_TOPIC, airfarmDataSchema, (topic, data) => {
    const validatedData = airfarmDataSchema.parse(data)
    console.log('\nvalid SENSOR Data:', validatedData)

    const isFanOn = validatedData.temperature > 25
    pub(FAN_CONTROL_TOPIC, isFanOn)

    const isPumpOn = validatedData.humidity < 40
    pub(PUMP_CONTROL_TOPIC, isPumpOn)

    const isLedOn = validatedData.co2Level > 800
    pub(LED_CONTROL_TOPIC, isLedOn)
})

// 왜 4번 이나 실행되지?
//  --> io.ts 에서 4번 publish 하기 때문
//  --> 그렇다면 4번 pub 이 필요한가?
//  --> 각 device 에 대한 control 이 있을 때마다 publish 한다. + 10초마다 iodata 를 publish 한다.
match(IO_TOPIC, deviceStateSchema, (topic, data) => {
    const validatedData = deviceStateSchema.parse(data)
    console.log('\nvalid IO Data:', validatedData)
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
