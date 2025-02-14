import { z } from 'zod'

export const DATA_TOPIC = 'airfarm/+/data'
export const SENSOR_TOPIC = 'airfarm/sensors/data'
export const IO_TOPIC = 'airfarm/io/data'

export const CONTROL_TOPIC = 'airfarm/control'
export const CONTROL_TOPIC_SPRAY = 'airfarm/control/spray' // spray duration, interval 설정 토픽
export const CONTROL_TOPIC_LED = 'airfarm/control/led' // led on/off 시간 설정 토픽

export const THRESHOLD_TOPIC = 'airfarm/threshold'

export const airfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    timestamp: z.string().datetime(),
})

export const deviceStateSchema = z.object({
    led: z.boolean().optional(),
    fan: z.boolean().optional(),
    pump: z.boolean().optional(),
})

export type deviceState = z.infer<typeof deviceStateSchema>

export const deviceStatus: deviceState = {
    led: true,
    fan: false,
    pump: false,
}

export const spraySchema = z.object({
    duration: z.number(),
    interval: z.number(),
})

export const thresholdConfigSchema = z.object({
    maxTemp: z.number(),
    minTemp: z.number(),
    maxHumid: z.number(),
    minHumid: z.number(),
    maxCo2: z.number(),
    minCo2: z.number(),
})

export const ledTimeSchema = z.object({
    onHour: z.number(),
    onMinute: z.number(),
    offHour: z.number(),
    offMinute: z.number(),
})
