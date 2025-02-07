import mqttMatch from 'mqtt-match'
import z from 'zod'

export type MqttRouterHandler<T> = (msg: T, topic: string, param: string | undefined) => void

export type MqttRoute = {
    path: string
    schema?: z.ZodType
    handler: MqttRouterHandler<any>
}
export class MqttRouter {
    private routes: MqttRoute[] = []

    match<$Schema extends z.ZodType>(
        path: string,
        schema: $Schema,
        handler: MqttRouterHandler<z.infer<$Schema>>
    ): void

    match<T>(path: string, handler: MqttRouterHandler<T>): void

    match<T>(
        path: string,
        arg1: z.ZodType | MqttRouterHandler<T>,
        arg2?: MqttRouterHandler<typeof arg1 extends z.ZodType ? z.infer<typeof arg1> : T>
    ) {
        if (!arg2 && arg1 instanceof Function) {
            this.routes.push({ path, handler: arg1 })
        }
        if (arg1 instanceof z.ZodType && arg2) {
            this.routes.push({ path, schema: arg1, handler: arg2 })
        }
    }

    private getParam(filter: string, topic: string) {
        const idx = filter.split('/').indexOf('+')
        if (idx >= 0) {
            const parts = topic.split('/')
            return parts[idx]
        }
        return
    }

    // handle(topic: string, schema?: z.ZodType, message: Buffer) {
    handle(topic: string, message: Buffer) {
        const route = this.routes.find(({ path }) => mqttMatch(path, topic))
        if (route) {
            let param = this.getParam(route.path, topic)

            // if (route.path.endsWith('+')) {
            //   param = topic.replace(route.path.replace('+', ''), '')
            //   // console.log({param})
            // }
            try {
                let msg
                try {
                    msg = JSON.parse(message.toString())
                } catch (err) {
                    msg = message.toString()
                }
                if (route.schema) {
                    msg = route.schema.parse(msg)
                }
                route.handler(msg, topic, param)
            } catch (err) {
                console.error(err)
            }
        }
    }
}
