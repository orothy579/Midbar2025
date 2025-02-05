import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { TaskController } from './task_controller'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const baseTopic = process.env.TOPIC || 'test/'

const client = mqtt.connect(brokerUrl)
const airfarms = ['airfarm1', 'airfarm2', 'airfarm3', 'airfarm4', 'airfarm5']
const taskController = TaskController(client)

client.on('connect', () => {
    console.log('Subscriber connected to nanoMQ')

    airfarms.forEach((airfarm) => {
        const topic = `${baseTopic}/${airfarm}`
        client.subscribe(topic, (err) => {
            if (err) {
                console.error('Subscribe error:', err)
                return
            }
            console.log(`Subscribed to ${topic}`)
        })
    })
})

client.on('message', (topic, message) => {
    taskController.handleMessage(topic, message)
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
