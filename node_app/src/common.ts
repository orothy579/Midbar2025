import { z } from 'zod'

export const DATA_TOPIC = 'airfarm/+/data'
export const SENSOR_TOPIC = 'airfarm/sensors/data'
export const IO_TOPIC = 'airfarm/io/data'
export const FAN_CONTROL_TOPIC = 'airfarm/control/fan'
export const PUMP_CONTROL_TOPIC = 'airfarm/control/pump'
export const LED_CONTROL_TOPIC = 'airfarm/control/led'

export const airfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    timestamp: z.string().datetime(),
})

export type AirfarmData = z.infer<typeof airfarmDataSchema>

export const deviceStateSchema = z.object({
    fan: z.boolean(),
    pump: z.boolean(),
    led: z.boolean(),
})
export type DeviceState = z.infer<typeof deviceStateSchema>
