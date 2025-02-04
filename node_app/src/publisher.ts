/*
  publisher.ts
*/

import mqtt from 'mqtt'

const client = mqtt.connect('mqtt://nanomq:1883')

client.on('connect', () => {
    console.log('Publisher connected to nanoMQ')

    setInterval(() => {
        const message = `Hello from nonoMQ ${new Date().toISOString()}`
        client.publish('test/topic', message)
        console.log(`Published: ${message}`)
    }, 3000)
})

client.on('error', (err) => {
    console.error('Publish error : ', err)
})
