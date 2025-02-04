/*
  publisher.ts
*/

import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const topic = process.env.TOPIC || 'test/topic'

const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log(`Publisher connected to nanoMQ on ${brokerUrl}`)

    setInterval(() => {
        const message = `Hello from nonoMQ ${new Date().toISOString()}`
        client.publish(topic, message)
        console.log(`Published: ${message}`)
    }, 3000)
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})
