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
}

interface Sakura {
  x: number
  y: number
  rotation: number
  scale: number
  size: number
}

class SakuraEffetc {
  div: HTMLElement
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | null
  sakuras: Sakura[] = []
  options: SakuraOptions

  image = new Image()
  constructor (div: HTMLElement, options: SakuraOptions) {
    this.div = div
    this.canvas = document.createElement('canvas')
    this.div.appendChild(this.canvas)
    this.options = options

    this.context = this.canvas.getContext('2d')

    this.initCanvas()
  }

  initCanvas () {
    this.canvas.width = this.div.clientWidth
    this.canvas.height = this.div.clientHeight
    this.canvas.style.position = 'fixed'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.setAttribute('id', 'sakura')
  }

  drawSakura () {
    if (!this.context) return
    for (let i = 0; i < this.sakuras.length; i++) {
      const sakura = this.sakuras[i]
      this.context.save()
      this.context.translate(sakura.x, sakura.y)
      this.context.rotate(sakura.rotation)
      this.context.globalAlpha = this.options.opacity
      this.context.drawImage(this.image, 0, 0, sakura.size * sakura.scale, sakura.size * sakura.scale)
      this.context.restore()
    }
  }
}

export { SakuraEffetc, SakuraOptions }
