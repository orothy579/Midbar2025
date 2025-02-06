import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { controlFan, controlPump, controlLed } from './task_controller'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || ''
const SENSOR_TOPIC = process.env.SENSOR_TOPIC || ''

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('Subscriber connected to nanoMQ')

    client.subscribe(SENSOR_TOPIC, (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${SENSOR_TOPIC}`)
    })
})

client.on('message', (topic, message) => {
    if (topic === SENSOR_TOPIC) {
        console.log('Received sensor data:', message.toString())
        try {
            const data = JSON.parse(message.toString())

            if (data.temperature >= 25 || data.co2 >= 800) {
                controlFan('on')
            } else {
                controlFan('off')
            }
            if (data.humidity < 40) {
                controlPump('on', 5000)
            } else {
                controlPump('off')
            }
            if (data.temperature >= 25 || data.co2 >= 800) {
                controlLed('on')
            } else {
                controlLed('off')
            }
        } catch (err) {
            console.error('JSON parse error:', err)
        }
    }
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
