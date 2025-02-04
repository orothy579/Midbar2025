/*
  subscriber.ts
*/

import mqtt from 'mqtt'

const brokerUrl = 'mqtt://nanomq:1883'
const client = mqtt.connect(brokerUrl)

client.on('connect', () => {
    console.log('Subscriber connected to nanoMQ')
    client.subscribe('test/topic', (err) => {
        if (err) {
            console.error('Subscribe error:', err)
            return
        }
        console.log('Subscribed to test/topic')
    })
})

client.on('message', (topic, message) => {
    console.log(`Received on ${topic}: ${message.toString()}`)
})

client.on('error', (err) => {
    console.error('Subscriber error:', err)
})
