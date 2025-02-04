/*
  subscriber.ts
*/

import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const topic = process.env.TOPIC || 'test/topic'

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('Subscriber connected to nanoMQ')
    client.subscribe(topic, (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log(`Subscribed to ${topic}`)
    })
})

client.on('message', (topic, message) => {
    console.log(`Received on ${topic}: ${message.toString()}`)
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
