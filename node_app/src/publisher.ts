/*
  publisher.ts
*/

import mqtt from 'mqtt'
import dotenv from 'dotenv'

dotenv.config()

const brokerUrl = process.env.BROKER_URL || 'mqtt://nanomq:1883'
const baseTopic = process.env.TOPIC || 'test/'

const client = mqtt.connect(brokerUrl)

const airfarms = ['airfarm1', 'airfarm2', 'airfarm3', 'airfarm4', 'airfarm5']

client.on('connect', () => {
    console.log(`Publisher connected to nanoMQ on ${brokerUrl}`)

    airfarms.forEach((airfarm) => {
        setInterval(() => {
            const payload = {
                airfarm,
                temperature: Math.floor(Math.random() * 100),
                humidity: Math.floor(Math.random() * 100),
                led: Math.random() > 0.5 ? 'on' : 'off',
            }

            const topic = `${baseTopic}/${airfarm}`
            client.publish(topic, JSON.stringify(payload))
            console.log(`Published to ${topic} : ${JSON.stringify(payload)}`)
        }, 5000)
    })
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})
