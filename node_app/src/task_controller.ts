import mqtt from 'mqtt'
import dotenv from 'dotenv'
dotenv.config()

const FAN_CONTROL_TOPIC = process.env.FAN_CONTROL_TOPIC || ''
const PUMP_CONTROL_TOPIC = process.env.PUMP_CONTROL_TOPIC || ''
const LED_CONTROL_TOPIC = process.env.LED_CONTROL_TOPIC || ''

const client = mqtt.connect(process.env.BROKER_URL || '')

export function controlFan(action: 'on' | 'off') {
    client.publish(FAN_CONTROL_TOPIC, JSON.stringify({ action }))
}

export function controlPump(action: 'on' | 'off', duration?: number) {
    client.publish(PUMP_CONTROL_TOPIC, JSON.stringify({ action, duration }))
}

export function controlLed(action: 'on' | 'off') {
    client.publish(LED_CONTROL_TOPIC, JSON.stringify({ action }))
}
