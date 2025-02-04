/*
  subscriber.ts
*/

import mqtt from 'mqtt'
import dotenv from 'dotenv'
import { sleep } from './utils'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const baseTopic = process.env.TOPIC || 'test/'

const client = mqtt.connect(brokerUrl)

const airfarms = ['airfarm1', 'airfarm2', 'airfarm3', 'airfarm4', 'airfarm5']

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
    sleep(1000).then(() => {
        console.log('Subscriber ready')
    })
})

client.on('message', (topic, message) => {
    console.log(`Received on ${topic}: ${message.toString()}`)
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
