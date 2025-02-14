import mqtt from 'mqtt'
import dotenv from 'dotenv'
import {
    airfarmDataSchema,
    CONTROL_TOPIC,
    DATA_TOPIC,
    deviceStateSchema,
    IO_TOPIC,
    SENSOR_TOPIC,
    THRESHOLD_TOPIC,
    thresholdConfigSchema,
    deviceStatus,
    LED_TOPIC,
} from './common'
import { MqttRouter } from './mqtt-router'

const thresholds = {
    maxTemp: 25,
    minTemp: 18,
    maxHumid: 80,
    minHumid: 40,
    maxCo2: 600,
    minCo2: 400,
}

dotenv.config()

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

const brokerUrl = process.env.BROKER_URL
if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('\nSubscriber connected to nanoMQ')

    client.subscribe([DATA_TOPIC, THRESHOLD_TOPIC, LED_TOPIC], (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${DATA_TOPIC} and ${THRESHOLD_TOPIC}`)
    })
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

const router = new MqttRouter()

// Control devices based on sensor data
router.match(SENSOR_TOPIC, airfarmDataSchema, (message) => {
    console.log('\nvalid SENSOR Data:', message)

    console.log('Current Thresholds:', thresholds)

    // Fan 으로만 제어, Fan으로 온도, 습도, co2 제어.
    if (
        message.temperature > thresholds.maxTemp ||
        message.humidity > thresholds.maxHumid ||
        message.co2Level > thresholds.maxCo2 ||
        message.temperature < thresholds.minTemp ||
        message.humidity < thresholds.minHumid ||
        message.co2Level < thresholds.minCo2
    ) {
        deviceStatus.fan = true
        console.log('FAN ON : out of threshold')
        pub(CONTROL_TOPIC, deviceStatus)
    } else {
        deviceStatus.fan = false
        console.log('FAN OFF : all values in threshold')
        pub(CONTROL_TOPIC, deviceStatus)
    }
})

router.match(IO_TOPIC, deviceStateSchema, (message) => {
    console.log('\nvalid IO Data:', message)
})

// Update threshold values
router.match(THRESHOLD_TOPIC, thresholdConfigSchema.partial(), (message, topic, param) => {
    Object.assign(thresholds, message)
    console.log('\nThresholds updated:', thresholds)
})

const cron = require('node-cron')

// // 매일 오전 7시 부터 22시 까지 실행
// cron.schedule('* 7-22 * * *', () => {
//     deviceStatus.led = !deviceStatus.led
//     console.log('LED:', deviceStatus.led)
//     pub(CONTROL_TOPIC, deviceStatus)
// })

// 1. mqtt subscribe 다른 토픽으로 해서 schedule 시간을 number 혹은 string 으로 입력 받을 것임.
// cron 형식에 맞게, 업데이트 해야함
// 7을 입력 받으면 '0 7 * * *' 로 변환
// 이 scheduler 를 on 기능 1개, off 1개로 나누어서 사용할 수 있도록 구현
// 매 분마다 실행

function convertToCron(hour: number, minute: number = 0): string {
    return `${minute} ${hour} * * *`
}

const ledOnHour: number = 7 // 예: 오전 7시
const ledOnMinute: number = 15 // 예: 7시 15분
const ledOffHour: number = 22 // 예: 오후 10시
const ledOffMinute: number = 0 // 예: 10시 0분

const ledOnCron = convertToCron(ledOnHour, ledOnMinute)
const ledOffCron = convertToCron(ledOffHour, ledOffMinute)

cron.schedule(ledOnCron, () => {
    deviceStatus.led = true
    console.log('LED ON : 식물이 광합성을 시작합니다.')
    pub(CONTROL_TOPIC, deviceStatus)
})

cron.schedule(ledOffCron, () => {
    deviceStatus.led = false
    console.log('LED OFF : 식물이 호흡을 시작합니다.')
    pub(CONTROL_TOPIC, deviceStatus)
})
