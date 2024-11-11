
function randBetween (min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}

const colours = ['#F73859', '#14FFEC', '#00E0FF', '#FF99FE', '#FAF15D']

class Ball {
  static minimalRadius = 0.05
  x: number
  y: number
  angle: number
  speed: number
  vx: number
  vy: number
  r: number
  color: string

  constructor (x: number, y: number) {
    this.x = x
    this.y = y
    this.angle = Math.PI * 2 * Math.random()
    this.speed = randBetween(1, 9) / 10
    this.vx = (this.speed + Math.random() * 0.5) * Math.cos(this.angle)
    this.vy = (this.speed + Math.random() * 0.5) * Math.sin(this.angle)
    this.r = randBetween(22, 30) + 3 * Math.random()
    this.color = colours[Math.floor(Math.random() * colours.length)]
  }

  draw (ctx: CanvasRenderingContext2D, timePassed: number) {
    this.update(timePassed)

    if (this.r < Ball.minimalRadius) return
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false)
    ctx.fill()
  }

  private update (timePassed: number) {
    const rate = timePassed / 8
    this.x += this.vx * timePassed
    this.y += this.vy * timePassed
    this.r *= 0.96 ** rate
    this.vx *= 0.94 ** rate
    this.vy *= 0.94 ** rate
  }

  isDied (w: number, h: number) {
    return this.x + this.r < 0 || this.x - this.r > w || this.y + this.r < 0 || this.y - this.r > h || this.r < Ball.minimalRadius
  }
}

class FireworksEffext {
  balls: Ball[][] = []
  origin = { x: 0, y: 0 }
  ctx: CanvasRenderingContext2D | null = null
  canvas: HTMLCanvasElement | null = null

  // constructor () {
  // }

  start () {
    this.canvas = document.createElement('canvas')
    document.body.appendChild(this.canvas)
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.zIndex = '99999'
    this.canvas.style.pointerEvents = 'none'
    if (this.canvas.getContext && window.addEventListener) {
      this.ctx = this.canvas.getContext('2d')
      this.updateSize()
      window.addEventListener('resize', this.updateSize, false)
      window.addEventListener('mousedown', this.mouseDown, false)
    } else {
      console.log('canvas or addEventListener is unsupported!')
      document.body.removeChild(this.canvas)
      this.canvas = null
    }
  }

  stop () {
    if (this.canvas) {
      document.body.removeChild(this.canvas)
      window.removeEventListener('resize', this.updateSize)
      window.removeEventListener('mousedown', this.mouseDown)
      this.canvas = null
    }
  }

  updateSize = () => {
    if (!this.canvas) return
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  lastTime = 0

  mouseDown = (e: MouseEvent) => {
    const count = randBetween(24, 32)
    this.origin.x = e.clientX
    this.origin.y = e.clientY
    this.pushBalls(count, e.clientX, e.clientY)
    this.lastTime = Date.now()
    this.loop()
  }

  radius: number[] = []
  radiusSpeed = 0.15
  maxRadius = 100

  drawCircle (index: number, timePassed: number) {
    if (!this.ctx || !this.canvas) return

    this.radius[index] += this.radiusSpeed * timePassed
    if (this.radius[index] > 100) return

    const alpha = Math.floor(255 * (1 - this.radius[index] / this.maxRadius))
    this.ctx.strokeStyle = `#FF0000${alpha}`
    this.ctx.beginPath()
    this.ctx.arc(this.origin.x, this.origin.y, this.radius[index], 0, Math.PI * 2, false)
    this.ctx.stroke()
  }

  loop = () => {
    if (!this.ctx || !this.canvas) return
    const w = this.canvas.width
    const h = this.canvas.height

    const time = Date.now()
    const timePassed = time - this.lastTime
    this.lastTime = time

    this.ctx.clearRect(0, 0, w, h)

    for (let i = 0; i < this.balls.length; i++) {
      this.drawCircle(i, timePassed)
      const balls = this.balls[i]
      for (let j = 0; j < balls.length; j++) {
        const b = balls[j]
        b.draw(this.ctx, timePassed)
        if (b.isDied(w, h)) balls.splice(j--, 1)
      }
      if (balls.length === 0) {
        this.radius.splice(i, 1)
        this.balls.splice(i--, 1)
      }
    }
    if (this.balls.length) requestAnimationFrame(this.loop)
  }

  pushBalls (count: number, x: number, y: number) {
    const balls = []
    for (let i = 0; i < count; i++) {
      balls.push(new Ball(x, y))
    }
    this.radius.push(10)
    this.balls.push(balls)
  }
}

export { FireworksEffext }
