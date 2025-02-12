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
    THRESHOLD_TOPIC,
    thresholdConfigSchema,
} from './common'
import { MqttRouter } from './mqtt-router'

const thresholds = {
    maxTemp: 25,
    minTemp: 18,
    maxHumid: 80,
    minHumid: 75,
    maxCo2: 600,
    minCo2: 400,
}

dotenv.config()

const brokerUrl = process.env.BROKER_URL
if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('\nSubscriber connected to nanoMQ')

    client.subscribe([DATA_TOPIC, THRESHOLD_TOPIC], (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${DATA_TOPIC} and ${THRESHOLD_TOPIC}`)
    })
})

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

const router = new MqttRouter()

// Update threshold values
router.match(THRESHOLD_TOPIC, thresholdConfigSchema.partial(), (message, topic, param) => {
    Object.assign(thresholds, message)
    console.log('\nThresholds updated:', thresholds)
})

// Control devices based on sensor data
router.match(SENSOR_TOPIC, airfarmDataSchema, (message) => {
    console.log('\nvalid SENSOR Data:', message)

    console.log('Current Thresholds:', thresholds)
    // LED 제어 : 온도 기준 컨트롤
    if (message.temperature > thresholds.maxTemp) {
        pub(LED_CONTROL_TOPIC, false)
        console.log('LED OFF : temp >', thresholds.maxTemp)
    } else if (message.temperature < thresholds.minTemp) {
        pub(LED_CONTROL_TOPIC, true)
        console.log('LED ON : temp <', thresholds.minTemp)
    }

    // Pump 제어 : 습도 기준 컨트롤
    if (message.humidity > thresholds.maxHumid) {
        pub(PUMP_CONTROL_TOPIC, false)
        console.log('PUMP OFF : humid >', thresholds.maxHumid)
    } else if (message.humidity < thresholds.minHumid) {
        pub(PUMP_CONTROL_TOPIC, true)
        console.log('PUMP ON : humid <', thresholds.minHumid)
    }

    // FAN 제어 : CO2 기준 컨트롤
    if (message.co2Level > thresholds.maxCo2) {
        pub(FAN_CONTROL_TOPIC, false)
        console.log('FAN OFF : co2 >', thresholds.maxCo2)
    } else if (message.co2Level < thresholds.minCo2) {
        pub(FAN_CONTROL_TOPIC, true)
        console.log('FAN ON : co2 <', thresholds.minCo2)
    }
})

// Control LED with timer [ 이전 상황을 고려하지 않고, 시간에 따라 무조건 바꿈. --> 수정 필요 ]
// setInterval(() => {
//     deviceStatus.led = !deviceStatus.led
//     pub(LED_CONTROL_TOPIC, deviceStatus.led)
// }, 50000)

// task 개념 추가
// Control Pump with timer
// setInterval(() => {
//     deviceStatus.pump = !deviceStatus.pump
//     pub(PUMP_CONTROL_TOPIC, deviceStatus.pump)
// }, 10000)

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
