import mqtt from 'mqtt'
import dotenv from 'dotenv'
import * as cron from 'node-cron'

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
    CONTROL_TOPIC_LED,
    ledTimeSchema,
    CONTROL_TOPIC_SPRAY,
    spraySchema,
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

const ledTime = {
    onHour: 7,
    onMinute: 15,
    offHour: 22,
    offMinute: 0,
}

const spray = {
    duration: 5,
    interval: 30,
}

dotenv.config()

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

function convertToCron(hour: number, minute: number): string {
    return `${minute} ${hour} * * *`
}

const brokerUrl = process.env.BROKER_URL
if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('\nSubscriber connected to nanoMQ')

    client.subscribe(
        [DATA_TOPIC, THRESHOLD_TOPIC, CONTROL_TOPIC_LED, CONTROL_TOPIC_SPRAY],
        (err) => {
            if (err) {
                console.error('Subscribe error:', err)
                return
            }
            console.log(`Subscribed complete from contorller`)
        }
    )
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

// 기존에 등록된 cron 작업을 저장할 변수 선언
let ledOnTask: cron.ScheduledTask | null = null
let ledOffTask: cron.ScheduledTask | null = null

// Update LED on/off time
router.match(CONTROL_TOPIC_LED, ledTimeSchema.partial(), (message) => {
    Object.assign(ledTime, message)
    console.log('\nLED Time updated:', ledTime)
    const ledOnCron = convertToCron(ledTime.onHour, ledTime.onMinute)
    const ledOffCron = convertToCron(ledTime.offHour, ledTime.offMinute)

    // 기존 작업이 있다면 취소
    if (ledOnTask) ledOnTask.stop()
    if (ledOffTask) ledOffTask.stop()

    // 새로운 cron 작업 등록
    ledOnTask = cron.schedule(ledOnCron, () => {
        deviceStatus.led = true
        console.log('LED ON : 식물이 광합성을 시작합니다.')
        pub(CONTROL_TOPIC, deviceStatus)
    })

    ledOffTask = cron.schedule(ledOffCron, () => {
        deviceStatus.led = false
        console.log('LED OFF : 식물이 호흡을 시작합니다.')
        pub(CONTROL_TOPIC, deviceStatus)
    })
})

// Spray control
router.match(CONTROL_TOPIC_SPRAY, spraySchema.partial(), (message) => {
    Object.assign(spray, message)
    console.log('\nSpray Data:', message)
})
