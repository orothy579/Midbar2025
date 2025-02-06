import mqtt from 'mqtt'
import dotenv from 'dotenv'
dotenv.config()

const FAN_CONTROL_TOPIC = process.env.FAN_CONTROL_TOPIC || ''
const PUMP_CONTROL_TOPIC = process.env.PUMP_CONTROL_TOPIC || ''
const LED_CONTROL_TOPIC = process.env.LED_CONTROL_TOPIC || ''

const client = mqtt.connect(process.env.BROKER_URL || '')

type DeviceAction = 'on' | 'off'

const deviceStatus: Record<string, DeviceAction> = {
    fan: 'off',
    pump: 'off',
    led: 'off',
}

export function controlFan(action: DeviceAction) {
    client.publish(FAN_CONTROL_TOPIC, JSON.stringify({ action }))
    deviceStatus.fan = action
}

export function controlPump(action: DeviceAction) {
    client.publish(PUMP_CONTROL_TOPIC, JSON.stringify({ action }))
    deviceStatus.pump = action
}

export function controlLed(action: DeviceAction) {
    client.publish(LED_CONTROL_TOPIC, JSON.stringify({ action }))
    deviceStatus.led = action
}

export function getDeviceStatus(device: string): DeviceAction | undefined {
    return deviceStatus[device]
}
