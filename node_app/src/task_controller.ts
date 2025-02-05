import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const baseTopic = process.env.TOPIC || 'test/'

interface AirfarmData {
    temperature: number
    humidity: number
    co2Level: number
    led: 'on' | 'off'
    fan: 'on' | 'off'
    pump: 'on' | 'off'
    timestamp: string
}

class TaskController {
    private client: mqtt.MqttClient
    private airfarms: Map<string, AirfarmData>

    constructor() {
        this.client = mqtt.connect(brokerUrl)
        this.airfarms = new Map()
        this.setupMqttHandlers()
    }

    private setupMqttHandlers() {
        this.client.on('connect', () => {
            console.log('Task controller connected to nanoMQ')
            this.subscribeToTopics()
        })

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message)
        })

        this.client.on('error', (err) => {
            console.error('Task controller error:', err)
        })
    }

    private subscribeToTopics() {
        this.client.subscribe(`${baseTopic}/#`, (err) => {
            if (err) {
                console.error('Subscribe error:', err)
                return
            }
            console.log(`Subscribed to ${baseTopic}/#`)
        })
    }

    private handleMessage(topic: string, message: Buffer) {
        try {
            const data = JSON.parse(message.toString()) as AirfarmData
            const airfarmId = topic.split('/').pop()
            if (!airfarmId) return

            this.airfarms.set(airfarmId, data)
            this.processRules(airfarmId, data)
        } catch (err) {
            console.error('Error handling message:', err)
        }
    }

    private processRules(airfarmId: string, data: AirfarmData) {
        // Fan control
        if (data.temperature > 25 || data.co2Level > 800) {
            this.controlDevice(airfarmId, 'fan', 'on')
        } else {
            this.controlDevice(airfarmId, 'fan', 'off')
        }

        // Pump control
        if (data.humidity < 40) {
            this.controlDevice(airfarmId, 'pump', 'on')
            setTimeout(() => {
                this.controlDevice(airfarmId, 'pump', 'off')
            }, 5000)
        }

        // LED control
        if (data.co2Level > 1000) {
            this.controlDevice(airfarmId, 'led', 'on')
        } else {
            this.controlDevice(airfarmId, 'led', 'off')
        }
    }

    private controlDevice(airfarmId: string, device: string, action: 'on' | 'off') {
        const topic = `${baseTopic}/control/${airfarmId}/${device}`
        const message = JSON.stringify({ action })
        this.client.publish(topic, message)
        console.log(`[${airfarmId}] Setting ${device} to ${action}`)
    }

    public getAirfarmStatus(airfarmId: string): AirfarmData | undefined {
        return this.airfarms.get(airfarmId)
    }
}

export const taskController = new TaskController()
