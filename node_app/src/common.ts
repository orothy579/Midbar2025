import { z } from 'zod'

export const DATA_TOPIC = 'airfarm/+/data'
export const SENSOR_TOPIC = 'airfarm/sensors/data'
export const IO_TOPIC = 'airfarm/io/data'

export const CONTROL_TOPIC = 'airfarm/control/+'
export const FAN_CONTROL_TOPIC = 'airfarm/control/fan'
export const PUMP_CONTROL_TOPIC = 'airfarm/control/pump'
export const LED_CONTROL_TOPIC = 'airfarm/control/led'

export const THRESHOLD_TOPIC = 'airfarm/threshold/+'
export const TEMP_MAX_THREHSHOLD_TOPIC = 'airfarm/threshold/maxTemp'
export const TEMP_MIN_THREHSHOLD_TOPIC = 'airfarm/threshold/minTemp'
export const HUMID_MAX_THRESHOLD_TOPIC = 'airfarm/threshold/maxHumid'
export const HUMID_MIN_THRESHOLD_TOPIC = 'airfarm/threshold/minHumid'
export const CO2_MAX_THRESHOLD_TOPIC = 'airfarm/threshold/maxCo2'
export const CO2_MIN_THRESHOLD_TOPIC = 'airfarm/threshold/minCo2'

export const airfarmDataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    co2Level: z.number(),
    timestamp: z.string().datetime(),
})

export type airfarmData = z.infer<typeof airfarmDataSchema>

export const deviceStateSchema = z.object({
    led: z.boolean(),
    fan: z.boolean(),
    pump: z.boolean(),
})
export type deviceState = z.infer<typeof deviceStateSchema>

export const thresholdSchema = z.number()
export type threshold = z.infer<typeof thresholdSchema>
