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

    client.subscribe([DATA_TOPIC, THRESHOLD_TOPIC], (err) => {
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
// [외기 가정] temp: 20도,  humid: 50%, co2 : 500ppm
// [saturation]

// 내기와 외기가 서로 상호작용 받아서, 내기 상태 유지, 외기 상태도 유지? 아니면 항상 같은 상태 유지?
// 외기가 내기보다 온도 변화량이 적을 것.

// < 내기 변화 조건 >
// LED & Pump -> co2 down else co2 변화 없음
// !LED & Pump -> humid up else humid down
// LED & !Pump -> temp up else temp down
// !LED
// FAN  -> temp down , co2 up , humid down

router.match(SENSOR_TOPIC, airfarmDataSchema, (message) => {
    console.log('\nvalid SENSOR Data:', message)

    console.log('Current Thresholds:', thresholds)

    // LED 제어 : 온도 기준 컨트롤
    if (message.temperature > thresholds.maxTemp) {
        deviceStatus.led = false
        console.log('LED OFF : temp >', thresholds.maxTemp)
    } else if (message.temperature < thresholds.minTemp) {
        deviceStatus.led = true
        console.log('LED ON : temp <', thresholds.minTemp)
    }

    // Pump 제어 : 습도 기준 컨트롤
    if (message.humidity > thresholds.maxHumid) {
        deviceStatus.pump = false
        console.log('PUMP OFF : humid >', thresholds.maxHumid)
    } else if (message.humidity < thresholds.minHumid) {
        deviceStatus.pump = true
        console.log('PUMP ON : humid <', thresholds.minHumid)
    }

    // FAN 제어 : CO2 기준 컨트롤
    if (message.co2Level > thresholds.maxCo2) {
        deviceStatus.fan = false
        console.log('FAN OFF : co2 >', thresholds.maxCo2)
    } else if (message.co2Level < thresholds.minCo2) {
        deviceStatus.fan = true
        console.log('FAN ON : co2 <', thresholds.minCo2)
    }
    pub(CONTROL_TOPIC, deviceStatus)
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

// 매 분마다 실행
cron.schedule('* * * * *', () => {
    deviceStatus.led = !deviceStatus.led
    if (deviceStatus.led === true) {
        console.log('LED ON : 식물이 광합성을 시작합니다.')
    } else {
        console.log('LED OFF : 식물이 호흡을 시작합니다.')
    }
    pub(CONTROL_TOPIC, deviceStatus)
})

// task 개념 추가
// Control Pump with timer
// setInterval(() => {
//     deviceStatus.pump = !deviceStatus.pump
//     pub(PUMP_CONTROL_TOPIC, deviceStatus.pump)
// }, 10000)
