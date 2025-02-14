export class SprayTask {
    private isRunning = false
    private intervalId: NodeJS.Timeout | null = null

    constructor(
        private duration: number,
        private interval: number,
        private pub: (topic: string, message: unknown) => void,
        private controlTopic: string
    ) {}

    start(): void {
        if (this.isRunning) {
            console.log(`Spray already running`)
            return
        }

        this.isRunning = true
        console.log(`Starting spray: duration=${this.duration}s, interval=${this.interval}s`)

        this.pub(this.controlTopic, {
            pump: {
                running: true,
                task: 'spray',
                duration: this.duration,
                interval: this.interval,
            },
        })

        this.intervalId = setInterval(() => {
            console.log(`Spray ON for ${this.duration} seconds`)
            this.pub(this.controlTopic, {
                pump: {
                    running: true,
                    task: 'spray',
                    duration: this.duration,
                    interval: this.interval,
                },
            })

            setTimeout(() => {
                console.log(`Spray OFF`)
                this.pub(this.controlTopic, {
                    pump: {
                        running: false,
                        task: 'spray',
                        duration: this.duration,
                        interval: this.interval,
                    },
                })
            }, this.duration * 1000)
        }, this.interval * 1000)
    }

    stop(): void {
        if (!this.isRunning) return

        this.isRunning = false
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }

        console.log(`Spray stopped`)
        this.pub(this.controlTopic, {
            pump: { running: false, task: 'spray', duration: 0, interval: 0 },
        })
    }
}

export class Pump {
    private sprayTask: SprayTask | null = null

    constructor(
        private pub: (topic: string, message: unknown) => void,
        private controlTopic: string
    ) {}

    // SprayTask 생성 및 실행
    startSpray(duration: number, interval: number): void {
        if (this.sprayTask) {
            this.sprayTask.stop()
        }
        this.sprayTask = new SprayTask(duration, interval, this.pub, this.controlTopic)
        this.sprayTask.start()
    }

    // Spray 중지
    stopSpray(): void {
        if (this.sprayTask) {
            this.sprayTask.stop()
            this.sprayTask = null
        }
    }
}
