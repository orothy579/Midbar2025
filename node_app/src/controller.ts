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
    thresholdSchema,
} from './common'
import { MqttRouter } from './mqtt-router'
import { deviceState } from './common'
import { z } from 'zod'

const deviceStatus: deviceState = {
    led: false,
    fan: false,
    pump: false,
}

const thresholds = {
    maxTemp: 25,
    minTemp: 18,
    maxHumid: 80,
    minHumid: 40,
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

const thresholdConfigSchema = z.object({
    maxTemp: z.number(),
    minTemp: z.number(),
    maxHumid: z.number(),
    minHumid: z.number(),
    maxCo2: z.number(),
    minCo2: z.number(),
})

// 조금 더 알아볼 필요 있다.
router.match('airfarm/threshold/set', thresholdConfigSchema.partial(), (message, topic, param) => {
    Object.assign(thresholds, message)
})

// Control devices based on sensor data
router.match(SENSOR_TOPIC, airfarmDataSchema, (message) => {
    console.log('\nvalid SENSOR Data:', message)

    console.log('Current Thresholds:', thresholds)
    // LED 제어 : 온도 기준 컨트롤
    if (message.temperature > thresholds.maxTemp) {
        if (deviceStatus.led !== false) {
            deviceStatus.led = false
            pub(LED_CONTROL_TOPIC, deviceStatus.led)
            console.log('LED OFF : temp >', thresholds.maxTemp)
        }
    } else if (message.temperature < thresholds.minTemp) {
        if (deviceStatus.led !== true) {
            deviceStatus.led = true
            pub(LED_CONTROL_TOPIC, deviceStatus.led)
            console.log('LED ON : temp <', thresholds.minTemp)
        }
    }

    // Pump 제어 : 습도 기준 컨트롤
    if (message.humidity > thresholds.maxHumid) {
        if (deviceStatus.pump !== false) {
            deviceStatus.pump = false
            pub(PUMP_CONTROL_TOPIC, deviceStatus.pump)
            console.log('PUMP OFF : humid >', thresholds.maxHumid)
        }
    } else if (message.humidity < thresholds.minHumid) {
        if (deviceStatus.pump !== true) {
            deviceStatus.pump = true
            pub(PUMP_CONTROL_TOPIC, deviceStatus.pump)
            console.log('PUMP ON : humid <', thresholds.minHumid)
        }
    }

    // FAN 제어 : CO2 기준 컨트롤
    if (message.co2Level > thresholds.maxCo2) {
        if (deviceStatus.fan !== false) {
            deviceStatus.fan = false
            pub(FAN_CONTROL_TOPIC, deviceStatus.fan)
            console.log('FAN OFF : co2 >', thresholds.maxCo2)
        }
    } else if (message.co2Level < thresholds.minCo2) {
        if (deviceStatus.fan !== true) {
            deviceStatus.fan = true
            pub(FAN_CONTROL_TOPIC, deviceStatus.fan)
            console.log('FAN ON : co2 <', thresholds.minCo2)
        }
    }
})

// Control LED with timer [ 이전 상황을 고려하지 않고, 시간에 따라 무조건 바꿈. --> 수정 필요 ]
setInterval(() => {
    deviceStatus.led = !deviceStatus.led
    pub(LED_CONTROL_TOPIC, deviceStatus.led)
}, 50000)

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
