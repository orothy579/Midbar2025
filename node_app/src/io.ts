import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { CONTROL_TOPIC, deviceStateSchema, SENSOR_TOPIC, IO_TOPIC, deviceStatus } from './common'

import { MqttRouter } from './mqtt-router'

// 환경 변수 로드
dotenv.config()

const brokerUrl = process.env.BROKER_URL

if (!brokerUrl) {
    throw new Error('BROKER_URL is required')
}

const airfarmData = {
    temperature: 25, // 25 degree celsius
    humidity: 60, // 60% humidity
    co2Level: 500, // 500 ppm
    timestamp: new Date(),
}

// 외기 가정, 외기는 항상 같은 상태 유지 한다고 가정
const outAirfarmData = {
    temperature: 20,
    humidity: 70,
    co2Level: 500,
}

// saturation boundaries definition
const saturationBounds = {
    temperature: { min: 15, max: 30 },
    humidity: { min: 10, max: 90 },
    co2Level: { min: 300, max: 700 },
}

// airfarmData에 현재 시간을 업데이트한 후 반환
function sensorData() {
    airfarmData.timestamp = new Date()
    return airfarmData
}

function pub(topic: string, message: unknown) {
    client.publish(topic, JSON.stringify(message))
}

const client = mqtt.connect(brokerUrl)

// 브로커에 연결
client.on('connect', () => {
    client.subscribe(CONTROL_TOPIC, (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${CONTROL_TOPIC}`)
    })

    setInterval(() => {
        const payload = sensorData()
        pub(SENSOR_TOPIC, payload)
        pub(IO_TOPIC, deviceStatus) // publish current device status
    }, 3000)
})

// Handle incoming messages
client.on('message', (topic, message) => {
    try {
        // 토픽에 맞는 핸들러 호출
        router.handle(topic, message)
    } catch (err) {
        console.error('Router handling error:', err)
    }
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})

const router = new MqttRouter()

router.match(CONTROL_TOPIC, deviceStateSchema.partial(), (message, topic, param) => {
    // CONTROL_TOPIC에 대한 handler 함수
    Object.assign(deviceStatus, message)
    console.log('\nDevice status updated:', deviceStatus)
    pub(IO_TOPIC, deviceStatus)
})

function updateState() {
    // LED off 밤 (식물 호흡)
    if (!deviceStatus.led && !deviceStatus.pump) {
        airfarmData.co2Level += 10 // 식물 호흡으로 인한 co2 농도 상승
    }

    if (!deviceStatus.led && deviceStatus.pump) {
        airfarmData.humidity += 1 // pump 작동으로 습도 상승
        airfarmData.co2Level += 10 // 식물 호흡으로 인한 co2 농도 상승
    }
    // LED on 낮 (식물 광합성)
    if (deviceStatus.led && !deviceStatus.pump) {
        airfarmData.temperature += 1 // LED 작동으로 발생하는 열
        airfarmData.humidity -= 1 // 온도 상승으로 인한 상대 습도 감소
        airfarmData.co2Level -= 10 // 광합성으로 인한 co2 농도 감소
    }

    if (deviceStatus.led && deviceStatus.pump) {
        airfarmData.temperature += 1 // LED 작동으로 발생하는 열
        airfarmData.humidity += 1 // pump 작동으로 습도 상승
        airfarmData.co2Level -= 10 // 광합성으로 인한 co2 농도 감소
    }

    // Fan 작동시
    if (deviceStatus.fan) {
        // 온도 조정 (외기 온도가 크면 내부 온도 상승, 작은 경우 하강)
        if (outAirfarmData.temperature > airfarmData.temperature) {
            airfarmData.temperature = Math.min(
                airfarmData.temperature + 1.1,
                saturationBounds.temperature.max
            )
        } else {
            airfarmData.temperature = Math.max(
                airfarmData.temperature - 1.1,
                saturationBounds.temperature.min
            )
        }

        // 습도 조정
        if (outAirfarmData.humidity > airfarmData.humidity) {
            airfarmData.humidity = Math.min(airfarmData.humidity + 1, saturationBounds.humidity.max)
        } else {
            airfarmData.humidity = Math.max(airfarmData.humidity - 1, saturationBounds.humidity.min)
        }

        // CO2 레벨 조정
        if (outAirfarmData.co2Level > airfarmData.co2Level) {
            airfarmData.co2Level = Math.min(
                airfarmData.co2Level + 20,
                saturationBounds.co2Level.max
            )
        } else {
            airfarmData.co2Level = Math.max(
                airfarmData.co2Level - 20,
                saturationBounds.co2Level.min
            )
        }
    }
}

setInterval(updateState, 1000)
