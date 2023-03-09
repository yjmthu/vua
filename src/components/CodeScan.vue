<template>
  <div class="scaner">
    <!-- 扫码框：显示扫码动画 -->
    <p class="tips">将二维码放入框内，即可自动扫描</p>
    <div id="codeSquare">
      <canvas ref="canvas" />
      <span :class="{'active': active, 'paused': !active }"></span>
      <div class="bd-l bd-t"></div>
      <div class="bd-l bd-b"></div>
      <div class="bd-r bd-t"></div>
      <div class="bd-r bd-b"></div>
    </div>
    <video class="source" ref="video"/>
    <div class='flex-row'>
      <span>扫描结果</span>
      <input ref="result" type="url">
    </div>
    <div class="flex-row">
      <button @click="copyResult">复制</button>
      <button @click="openResult">打开</button>
      <button v-if="!active" @click="startScan">开始</button>
      <button v-else @click="stopScan">结束</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import jsQR, { QRCode } from 'jsqr'

@Options({})
export default class CodeScan extends Vue {
  facingMode: 'environment' | 'user' = 'environment'
  canvas: HTMLCanvasElement | null = null
  canvasCtx: CanvasRenderingContext2D | null = null
  video: HTMLVideoElement | null = null
  active = false
  size = 250
  // 初始化
  mounted () {
    this.video = this.$refs.video as HTMLVideoElement
    this.canvas = this.$refs.canvas as HTMLCanvasElement
    this.video.width = this.size
    this.video.height = this.size
    this.canvas.height = this.size
    this.canvas.width = this.size
    this.video.autoplay = true
    this.canvasCtx = this.canvas.getContext('2d')
    this.video.playsInline = true
  }

  beforeDestroy () {
    if (this.active) {
      this.stopScan()
    }
    alert('离开路由')
  }

  startScan () {
    // 判断了浏览器是否支持挂载在MediaDevices.getUserMedia()的方法
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // 获取摄像头模式，默认设置是后置摄像头
      this.active = true
      const facingMode = this.facingMode
      // 摄像头视频处理
      const handleSuccess = (stream: MediaStream) => {
        if (!this.video) {
          return
        }
        this.video.srcObject = stream
        this.video.play()
        this.tick()
      }
      // 捕获视频流
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode,
            width: this.size,
            height: this.size
          },
          audio: false
        })
        .then(handleSuccess)
        .catch(() => {
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(handleSuccess)
            .catch((error) => {
              alert(error)
            })
        })
    }
  }

  tick () {
    // 视频处于准备阶段，并且已经加载足够的数据
    if (this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA && this.canvas && this.canvasCtx) {
      // 开始在画布上绘制视频
      this.canvasCtx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
      // getImageData() 复制画布上制定矩形的像素数据
      const imageData = this.canvasCtx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      let code: QRCode | null = null
      try {
        // 识别二维码
        code = jsQR(imageData.data, imageData.width, imageData.height)
      } catch (e) {
        console.error(e)
      }
      // 如果识别出二维码，绘制矩形框
      if (code) {
        const result = this.$refs.result as HTMLInputElement
        result.value = code.data
        this.stopScan()
        return
        // alert(code.location + '  ==  ' + code.data)
      }
    }
    if (this.active) {
      // 浏览器在下次重绘前循环调用扫码方法
      requestAnimationFrame(this.tick)
    }
  }

  stopScan () {
    this.active = false
    if (this.video && this.video.srcObject) {
      // 停止视频流序列轨道
      (this.video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
  }

  copyResult () {
    const result = this.$refs.result as HTMLInputElement
    navigator.clipboard.writeText(result.value)
    alert('复制成功')
  }

  openResult () {
    const result = this.$refs.result as HTMLInputElement
    if (result.value.length) {
      window.location.href = result.value
    } else {
      alert('空的链接无法打开')
    }
  }
}
</script>

<style scoped lang="scss">
video {
  display: none;
}
.scaner {
  position: absolute;
  background-color: cadetblue;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
}

button {
  border-radius: 6px;
  background-color: aquamarine;
  padding: 8px 24px;
  margin: 6px;
}

@keyframes myslide {
  0% {
    top: 0%;
  }
  100% {
    top: 100%;
  }
}

span {
  display: inline-block;
  padding: 2px 4px;
}

#codeSquare {
  position: relative;
  background-color: black;
  margin: 10px;

  & > span.active {
    position: absolute;
    left: 0;
    top: 0;
    background-color: white;
    height: 2px;
    width: 100%;
    animation: myslide 1s infinite linear;
  }

  & > div {
    position: absolute;
    // background-color: bisque;
    width: 20px;
    height: 20px;
  }
}

.bd-l {
  left: 0;
  border-left: solid 2px white;
}
.bd-r {
  right: 0;
  border-right: solid 2px white;
}
.bd-t {
  top: 0;
  border-top: solid 2px white;
}
.bd-b {
  bottom: 0;
  border-bottom: solid 2px white;
}

.flex-row {
  display: flex;
  align-items: center;
}
</style>
