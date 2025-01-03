// show sakura in the div

interface SakuraOptions {
  // sakura count
  count: number
  // sakura size
  size: number
  // sakura color
  color: string
  // sakura speed
  speed: number
  // sakura wind
  wind: number
  // sakura opacity
  opacity: number
  // sakura limit
  limit: number
}

class Sakura {
  x!: number
  y!: number
  rotation!: number
  scale!: number
  size: number
  limit: number

  constructor (canvas: HTMLCanvasElement, limit: number) {
    this.size = 40
    this.randomX(canvas.width)
    this.randomY(canvas.height)
    this.randomRotation()
    this.randomScale()
    this.limit = limit
  }

  randomRotation () {
    this.rotation = Math.random() * Math.PI * 2
  }

  randomX (w: number) {
    this.x = Math.random() * w
  }

  randomY (h: number) {
    this.y = Math.random() * h
  }

  randomScale () {
    this.scale = Math.random()
  }

  update (w: number, h: number, timePassed: number) {
    timePassed /= 17

    let random = Math.random() - 0.5
    this.x += (-1.7 + random * 0.5) * timePassed

    random = Math.random()
    this.y += (1.5 + random * 0.7) * timePassed

    random = Math.random()
    this.rotation += (random * 0.03) * timePassed

    if (this.x > w || this.x < 0 || this.y > h || this.y < 0) {
      if (this.limit === 0) {
        return
      }
      if (this.limit > 0) {
        this.limit--
      }

      if (Math.random() > 0.4) {
        this.randomX(w)
        this.y = 0
      } else {
        this.x = w
        this.randomY(h)
      }
      this.randomRotation()
      this.randomScale()
    }
  }

  isDied () {
    return this.limit === 0
  }

  draw (context: CanvasRenderingContext2D, image: HTMLImageElement) {
    context.save()
    context.translate(this.x, this.y)
    context.rotate(this.rotation)
    context.globalAlpha = 0.5
    context.drawImage(image, 0, 0, this.size * this.scale, this.size * this.scale)
    context.restore()
  }

  onResize () {
    this.randomX(window.innerWidth)
    this.randomY(window.innerHeight)
  }
}

class SakuraEffetc {
  div: HTMLElement
  canvas: HTMLCanvasElement | null = null
  context!: CanvasRenderingContext2D | null
  sakuras: Sakura[] = []
  options!: SakuraOptions
  lastTime = 0
  timePassed = 0

  image = new Image()
  constructor (div: HTMLElement, options?: SakuraOptions) {
    this.div = div
    this.initOptions(options)
    this.image.src = './icons/sakura.png'
  }

  createCanvas () {
    this.canvas = document.createElement('canvas')
    this.div.appendChild(this.canvas)

    this.canvas.width = this.div.clientWidth
    this.canvas.height = this.div.clientHeight
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.setAttribute('id', 'sakura')
    this.context = this.canvas.getContext('2d')

    addEventListener('resize', () => {
      if (!this.canvas) return
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
      this.sakuras.forEach(sakura => sakura.onResize())
    })

    return this.canvas
  }

  removeCanvas () {
    if (!this.canvas) return
    this.div.removeChild(this.canvas)
    this.canvas = null
  }

  initOptions (options?: SakuraOptions) {
    if (!options) {
      const count = Math.ceil(window.innerWidth * window.innerHeight / 20000)
      this.options = {
        count: count,
        size: 40,
        color: '#fff',
        speed: 1,
        wind: 0,
        opacity: 0.5,
        limit: Math.floor(6000 / (window.innerWidth + window.innerHeight))
      }
    } else {
      this.options = options
    }
  }

  drawSakura () {
    if (!this.context || !this.canvas) return
    const ctx = this.context
    const w = this.canvas.width
    const h = this.canvas.height
    ctx.clearRect(0, 0, w, h)

    for (let i = 0; i < this.sakuras.length; i++) {
      const sakura = this.sakuras[i]
      sakura.update(w, h, this.timePassed)
      sakura.draw(ctx, this.image)
      if (sakura.isDied()) {
        this.sakuras.splice(i--, 1)
      }
    }
  }

  start () {
    const canvas = this.createCanvas()
    this.sakuras = []
    for (let i = 0; i < this.options.count; i++) {
      this.sakuras.push(new Sakura(canvas, this.options.limit))
    }
    this.lastTime = Date.now()
    this.animate()
  }

  stop () {
    this.sakuras = []
    // clear canvas
    this.removeCanvas()
  }

  animate () {
    if (this.sakuras.length === 0) {
      if (this.canvas) {
        this.removeCanvas()
      }
      return
    }
    const time = Date.now()
    this.timePassed = time - this.lastTime
    this.lastTime = time
    this.drawSakura()
    requestAnimationFrame(() => this.animate())
  }
}

export { SakuraEffetc, SakuraOptions }
