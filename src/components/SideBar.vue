<template>
  <aside ref="aside" :class="showSideBar? 'show' : 'hide'">
    <div id="wallpaper-buttons">
      <span class="tooltip" data-tooltip="打开侧边面板">
        <SvgIcon name="Photo" size="16px" @click="toggleSideBar"/>
      </span>
      <span class="tooltip" data-tooltip="收藏当前背景">
        <SvgIcon name="Star" size="16px" :class="{checked: isFavorite()}" @click="toggleFavorite"/>
      </span>
      <span class="tooltip" data-tooltip="切换当前背景">
      <SvgIcon name="ArrowPath" size="16px" @click="setWallpaper"/>
      </span>
    </div>
    <nav>
      <h2>Vua New Tab</h2>
      <div id="sidebar-buttons">
        <button @click="login" class="tooltip" data-tooltip="登录清华云盘">登录</button>
        <button @click="update" class="tooltip" data-tooltip="刷新显示云盘文件夹">刷新</button>
        <button @click="deploy" class="tooltip" data-tooltip="使用当前文件夹下的图片文件作为背景">部署</button>
        <button @click="config" class="tooltip" data-tooltip="在当前文件夹下存放书签">书签</button>
      </div>
      <h3>云盘数据</h3>
      <small>{{ currentFolder }}</small>
      <ul class="text-list" v-if="folderContent.length">
        <li v-if="folderContentStack.length !== 0" @click="goBack">..</li>
        <li v-for="item in folderContent" :key="item.id" @click="goForward(item)">
          <SvgIcon :name="icons[item.type]" size="16px"/>
          <div>{{ item.name }}</div>
        </li>
      </ul>
      <h3>收藏预览</h3>
      <ul class="image-list" v-if="showSideBar">
        <li v-for="item in viewList" :key="item">
          <img :src="item" :alt="getNameFromThumbnail(item)" @click="setFromFavorite(item)"/>
          <!-- <div>{{ item }}</div> -->
        </li>
      </ul>
      <h3>壁纸设置</h3>
      <div id="schedule-config">
        <h4>壁纸配置同步</h4>
        <select v-model="wallpaperDataIndex"
          @contextmenu.prevent="changeWallpaperDataName"
          class="side-bar-input">
          <option value="-1">本地配置</option>
          <option v-for="(item, index) in wallpaperData"
            :value="index"
            :key="index">{{ item.name }}</option>
          <option value="-2">新建配置</option>
        </select>
        <h4>自动切换模式</h4>
        <!-- radio button to choose schedule mode -->
        <select v-model="scheduleMode" class="side-bar-input">
          <option value="static">静态壁纸</option>
          <option value="newtab">新标签页</option>
          <option value="timer">定时切换</option>
        </select>
        <div v-if="scheduleMode === 'timer'">
          <h4>时间间隔</h4>
          <!-- user can input number (range in 1~60) and choose unit here (second, minute, hour, day)-->
          <input type="number" class="side-bar-input" min="1" max="60" v-model.number="timeInterval">
          <select v-model="scheduleIntervalUnit" class="side-bar-input">
            <option value="second">秒</option>
            <option value="minute">分</option>
            <option value="hour">时</option>
            <option value="day">天</option>
          </select>
        </div>
        <h4>壁纸来源</h4>
        <select v-model="scheduleSource" class="side-bar-input">
          <option value="favorite">收藏</option>
          <option value="deploy">部署</option>
        </select>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts">
// seafile api: https://download.seafile.com/published/web-api/v2.1

import { Vue, Options } from 'vue-class-component'
import SvgIcon from '@/components/SvgIcon.vue'
import { FilePosition, getFileDetail, DeployData, Bookmark, ScheduleData, WallpaperData, MessageType } from '@/utils/typedef'
import axios from 'axios'
import HugeStorage from '@/utils/storage'
import TabAsync from '@/utils/tabsync'

interface FolderContent {
  name: string
  id: string
  type: string
}

function getFavoriteImageList () {
  const imagesForMobile = [
    '11ae1f71e1c14962a0c1',
    'ad25a52909ef4dba8f39',
    '9fc84199af59450bb4ef',
    '1ef738b0491f453f8af2'
  ]
  const imagesForPC = [
    '9362495c22c94187acae',
    '648b8c9b579a4682a851',
    '061f88443278449d9150',
    '6e222049b9954218bf07'
  ]
  const images = (window.innerWidth >= 720) ? imagesForPC : imagesForMobile
  return images.map((item) => `https://cloud.tsinghua.edu.cn/f/${item}/?dl=1`)
}

@Options({
  components: {
    SvgIcon
  },
  props: {
    tabAsync: TabAsync
  }
})
export default class SideBar extends Vue {
  tabAsync!: TabAsync
  showSideBar = false
  domain = 'cloud.tsinghua.edu.cn'
  host = `https://${this.domain}`
  _wallpaperDataIndex = '-1'
  wallpaperData: WallpaperData[] = []
  folderContent: FolderContent[] = []
  currentPath: FolderContent[] = []
  folderContentStack: FolderContent[][] = []
  deployData: DeployData | null = null
  favoriteImageList: string[] = []
  timerId: number | null = null
  scheduleData: ScheduleData = {
    displayMode: 'timer',
    source: 'favorite',
    currentImage: '',
    lastChange: 0,
    interval: 300,
    intervalUnit: 'second'
  }

  storage = new HugeStorage('backgroundImage')

  icons: {[key: string]: string} = {
    dir: 'Folder',
    file: 'Document',
    mine: 'Gift'
  }

  showMessage (msg: string, type: MessageType) {
    this.$emit('showMessage', msg, type)
  }

  set wallpaperDataIndex (index: string) {
    if (index === this._wallpaperDataIndex) return

    if (index === '-2') {
      const bookmark: Bookmark = {
        name: '新配置'
      }
      const callback = (data: Bookmark) => {
        this.wallpaperData.push({
          name: data.name,
          schedule: this.scheduleData,
          favorite: this.favoriteImageList,
          deploy: this.deployData
        })
        this._wallpaperDataIndex = (this.wallpaperData.length - 1).toString()
        this.saveWallpaperData(this.wallpaperData)
        this.saveWallpaperDataIndex()
      }
      this.$emit('showEditBox', bookmark, callback)
      return
    } else if (index === '-1') {
      this._wallpaperDataIndex = index
      this.readDeployData()
      this.readFavoriteImageList()
      this.readScheduleData()
    } else {
      const lastIndex = this._wallpaperDataIndex
      this._wallpaperDataIndex = index
      this.updateDetailData()
      if (lastIndex === '-1' && confirm('是否覆盖本地配置？')) {
        this._wallpaperDataIndex = '-1'
        this.saveScheduleData()
        this.saveFavoriteImageList()
        this.saveDeployData()
        this._wallpaperDataIndex = index
      }
    }
    this.saveWallpaperDataIndex()
    this.startSchedule()
  }

  get wallpaperDataIndex () {
    return this._wallpaperDataIndex
  }

  changeWallpaperDataName () {
    const index = parseInt(this.wallpaperDataIndex)
    if (index < 0) return
    const bookmark: Bookmark = {
      name: this.wallpaperData[index].name
    }
    const callback = (data: Bookmark) => {
      if (!data.name.length) {
        if (!confirm('名称为空，是否确认删除该配置？')) return
        this.wallpaperData.splice(index, 1)
        this.wallpaperDataIndex = '-1'
      } else {
        this.wallpaperData[index].name = data.name
      }
      this.saveWallpaperData(this.wallpaperData)
    }
    this.$emit('showEditBox', bookmark, callback)
  }

  uploadSyncData () {
    this.$emit('uploadSyncData')
  }

  hideWhenClick (event: MouseEvent) {
    const aside = this.$refs.aside as HTMLElement
    if (aside && !aside.contains(event.target as Node)) {
      this.showSideBar = false
    }
  }

  mounted (): void {
    document.addEventListener('click', this.hideWhenClick.bind(this))

    this.readWallpaperData()
    this.readScheduleData()
    this.readFavoriteImageList()
    this.readDeployData()
    this.readWallpaperDataIndex()
    this.updateDetailData()

    this.startSchedule()

    this.tabAsync.addListener('FAVORITE_IMAGE_CHANGE', () => {
      this.readFavoriteImageList()
    })

    this.tabAsync.addListener('SCHEDULE_DATA_CHANGE', () => {
      this.readWallpaperData()
      this.startSchedule()
    })

    this.tabAsync.addListener('DEPLOY_DATA_CHANGE', () => {
      this.readDeployData()
    })

    this.tabAsync.addListener('WALLPAPERDATA_INDEX_CHANGE', () => {
      this.readWallpaperDataIndex()
      this.updateDetailData()
    })

    this.tabAsync.addListener('WALLPAPERDATA_CHANGE', () => {
      this.readWallpaperData()
      this.updateDetailData()
    })
  }

  readFavoriteImageList () {
    const favorite = localStorage.getItem('favoriteImageList')
    if (favorite) {
      this.favoriteImageList = JSON.parse(favorite)
    } else {
      this.favoriteImageList = getFavoriteImageList()
      localStorage.setItem('favoriteImageList', JSON.stringify(this.favoriteImageList))
    }
  }

  saveFavoriteImageList () {
    if (this.wallpaperDataIndex === '-1') {
      localStorage.setItem('favoriteImageList', JSON.stringify(this.favoriteImageList))
      this.tabAsync.postMessage({ name: 'FAVORITE_IMAGE_CHANGE' })
    } else {
      this.wallpaperData[parseInt(this.wallpaperDataIndex)].favorite = this.favoriteImageList
      this.saveWallpaperData(this.wallpaperData)
    }
  }

  beforeDestroy (): void {
    this.clearTimer()
    document.removeEventListener('click', this.hideWhenClick)
  }

  getCurrentBackgroundImage () {
    const app = document.getElementById('app')
    if (!app) return ''
    const text = app.style.backgroundImage
    return text.slice(5, text.length - 2)
  }

  saveScheduleData () {
    if (this.wallpaperDataIndex === '-1') {
      localStorage.setItem('scheduleData', JSON.stringify(this.scheduleData))
      this.tabAsync.postMessage({ name: 'SCHEDULE_DATA_CHANGE' })
    } else {
      this.wallpaperData[parseInt(this.wallpaperDataIndex)].schedule = this.scheduleData
      this.saveWallpaperData(this.wallpaperData)
    }
  }

  readScheduleData () {
    const data = localStorage.getItem('scheduleData')
    if (data) {
      this.scheduleData = JSON.parse(data)
    }
  }

  readDeployData () {
    const data = localStorage.getItem('deployData')
    if (data) {
      this.deployData = JSON.parse(data)
    }
  }

  saveDeployData () {
    if (this.wallpaperDataIndex === '-1') {
      localStorage.setItem('deployData', JSON.stringify(this.deployData))
      this.tabAsync.postMessage({ name: 'DEPLOY_DATA_CHANGE' })
    } else {
      this.wallpaperData[parseInt(this.wallpaperDataIndex)].deploy = this.deployData
      this.saveWallpaperData(this.wallpaperData)
    }
  }

  readWallpaperDataIndex () {
    const index = localStorage.getItem('wallpaperDataIndex')
    if (index) {
      this._wallpaperDataIndex = index
    }
  }

  updateDetailData () {
    const i = parseInt(this.wallpaperDataIndex)
    if (i >= 0 && i < this.wallpaperData.length) {
      const current = this.wallpaperData[i]
      this.scheduleData = current.schedule
      this.favoriteImageList = current.favorite
      this.deployData = current.deploy
    } else {
      this.wallpaperDataIndex = '-1'
    }
  }

  saveWallpaperDataIndex () {
    localStorage.setItem('wallpaperDataIndex', this.wallpaperDataIndex.toString())
    this.tabAsync.postMessage({ name: 'WALLPAPERDATA_INDEX_CHANGE' })
  }

  readWallpaperData () {
    const data = localStorage.getItem('wallpaperData')
    if (data) {
      this.wallpaperData = JSON.parse(data)
    }
  }

  saveWallpaperData (data: WallpaperData[], upload = true) {
    this.wallpaperData = data
    localStorage.setItem('wallpaperData', JSON.stringify(data))
    this.tabAsync.postMessage({ name: 'WALLPAPERDATA_CHANGE' })
    if (upload) this.uploadSyncData()
  }

  importWallpaperData (data: WallpaperData[]) {
    if (parseInt(this.wallpaperDataIndex) >= data.length) {
      this.wallpaperDataIndex = '-1'
    }

    const index = parseInt(this.wallpaperDataIndex)
    if (index >= 0 && index < data.length) {
      const current = data[index]
      const changed = current.schedule.currentImage !== this.scheduleData.currentImage
      this.scheduleData = current.schedule
      this.favoriteImageList = current.favorite
      this.deployData = current.deploy
      if (changed) {
        this.startSchedule()
      }
    } else {
      this.wallpaperDataIndex = '-1'
    }

    this.saveWallpaperData(data, false)
  }

  exportWallpaperData () {
    return this.wallpaperData
  }

  get scheduleSource () {
    return this.scheduleData.source
  }

  set scheduleSource (value: 'favorite' | 'deploy') {
    // check if is chrome extention or pure website
    if (!chrome?.runtime) {
      this.scheduleData.source = value
      this.showMessage('请使用 Chrome 扩展！', 'warning')
      return
    }
    this.scheduleData.source = value
    this.saveScheduleData()
    this.startSchedule()
  }

  get scheduleMode () {
    return this.scheduleData.displayMode
  }

  set scheduleMode (value: 'static' | 'newtab' | 'timer') {
    this.scheduleData.displayMode = value
    this.saveScheduleData()
    this.startSchedule()
  }

  get scheduleIntervalUnit () {
    return this.scheduleData.intervalUnit
  }

  set scheduleIntervalUnit (value: 'second' | 'minute' | 'hour' | 'day') {
    this.scheduleData.intervalUnit = value
    // eslint-disable-next-line no-self-assign
    this.timeInterval = this.timeInterval
  }

  get timeInterval () {
    let value = this.scheduleData.interval
    switch (this.scheduleData.intervalUnit) {
      case 'minute':
        value /= 60
        break
      case 'hour':
        value /= 3600
        break
      case 'day':
        value /= 86400
        break
    }

    value = Math.ceil(value)
    if (value === 0) value = 1
    return value
  }

  set timeInterval (value: number) {
    switch (this.scheduleIntervalUnit) {
      case 'second':
        this.scheduleData.interval = value
        break
      case 'minute':
        this.scheduleData.interval = value * 60
        break
      case 'hour':
        this.scheduleData.interval = value * 3600
        break
      case 'day':
        this.scheduleData.interval = value * 86400
        break
      default:
        this.scheduleData.interval = value
    }
    if (this.scheduleData.interval <= 30) this.scheduleData.interval = 30
    this.saveScheduleData()
    this.startSchedule()
  }

  clearTimer () {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  startSchedule () {
    this.clearTimer()
    switch (this.scheduleMode) {
      case 'static':
        this.initBackgroundImage()
        break
      case 'newtab':
        this.setWallpaper()
        break
      case 'timer': {
        const now = Math.floor(Date.now() / 1000)
        if (now - this.scheduleData.lastChange >= this.scheduleData.interval) {
          this.scheduleData.lastChange = now
          this.setWallpaper()
        } else {
          this.initBackgroundImage()
        }
        const timeInterval = this.scheduleData.interval + this.scheduleData.lastChange - now
        console.log(`Next change in ${timeInterval} seconds, or ${Math.ceil(timeInterval / 60)} minutes.`)
        this.timerId = setTimeout(this.startSchedule.bind(this), timeInterval * 1000)
        break
      }
    }
  }

  initBackgroundImage () {
    const curImage = this.getCurrentBackgroundImage()
    if (curImage !== this.scheduleData.currentImage) {
      if (this.scheduleData.currentImage.length) {
        this.setBackgroundImage(this.scheduleData.currentImage)
      } else {
        this.scheduleData.currentImage = curImage
        this.saveScheduleData()
      }
    }
  }

  get viewList () {
    const viewList = []
    for (const item of this.favoriteImageList) {
      if (!item.startsWith(this.host)) continue
      // https://cloud.tsinghua.edu.cn/lib/6ab41ae3-06dc-483b-9606-4a55c0f9925e/file/%E6%A1%8C%E9%9D%A2%E5%A3%81%E7%BA%B8/wallhaven-kx8vmm.jpg?dl=1
      const regex = /^https:\/\/cloud.tsinghua.edu.cn\/lib\/(.{36})\/file\/(.*)\?dl=1$/g
      const match = regex.exec(item)
      if (!match) continue
      viewList.push(`${this.host}/thumbnail/${match[1]}/192/${match[2]}`)
    }
    return viewList
  }

  async setBackgroundImage (url: string) {
    const app = document.getElementById('app')
    if (!app) return

    if (!chrome?.runtime) {
      app.style.backgroundImage = `url(${url})`
    } else {
      // console.log('Set background image:', url)

      const blob = await this.storage.addUrl(url)
      if (!blob) {
        console.error('Failed to get blob from url:', url)
        return
      }
      const newUrl = URL.createObjectURL(blob)
      app.style.backgroundImage = `url(${newUrl})`
    }
    if (url !== this.scheduleData.currentImage) {
      this.scheduleData.currentImage = url
      this.saveScheduleData()
    }
  }

  setFromFavorite (view: string) {
    const regex = /^https:\/\/cloud.tsinghua.edu.cn\/thumbnail\/(.{36})\/192\/(.*)$/g
    const match = regex.exec(view)
    if (!match) return
    const url = `${this.host}/lib/${match[1]}/file/${match[2]}?dl=1`
    this.setBackgroundImage(url)
  }

  getNameFromThumbnail (thumbnail: string) {
    const regex = /^https:\/\/cloud.tsinghua.edu.cn\/thumbnail\/.{36}\/192\/.*?([^\\/]*)$/g
    const match = regex.exec(thumbnail)
    if (!match) return '未能加载图片'
    return decodeURIComponent(match[1])
  }

  get currentFolder () {
    return this.currentPath.map((item) => item.name).join('/')
  }

  toggleSideBar () {
    this.showSideBar = !this.showSideBar
  }

  toggleFavorite () {
    if (!this.scheduleData.currentImage.length) return

    const index = this.favoriteImageList.indexOf(this.scheduleData.currentImage)
    if (index === -1) {
      this.favoriteImageList.push(this.scheduleData.currentImage)
    } else {
      this.favoriteImageList.splice(index, 1)
    }

    this.saveFavoriteImageList()
  }

  isFavorite () {
    if (!this.scheduleData.currentImage) return false
    return this.favoriteImageList.indexOf(this.scheduleData.currentImage) !== -1
  }

  async getCookies () {
    if (!chrome?.cookies) {
      this.showMessage('请使用 Chrome 扩展！', 'warning')
      return []
    }
    const cookies = await chrome.cookies.getAll({
      domain: this.domain
    })

    return cookies
  }

  async login () {
    if (!chrome?.tabs) {
      this.showMessage('请使用 Chrome 扩展！', 'warning')
      return
    }
    const tab = await chrome.tabs.create({ url: this.host })
    console.log('Open login page:', tab)
    this.update()
  }

  async update () {
    const cookies = await this.getCookies()
    if (cookies.length === 0) {
      this.showMessage('请先登录清华云盘！', 'warning')
      return
    }
    const url = `${this.host}/api/v2.1/repos/?type=mine`
    const res = await axios.get(url)
    const json = res.data?.repos
    if (!json) return
    this.folderContent = []
    for (const item of json) {
      this.folderContent.push({
        name: item.repo_name,
        id: item.repo_id,
        type: item.type
      })
    }
  }

  async goForward (data: FolderContent) {
    // const data = this.folderContent[index]
    if (!data) return
    const cookies = await this.getCookies()
    if (cookies.length === 0) {
      this.showMessage('请先登录清华云盘！', 'warning')
      return
    }
    if (data.type !== 'dir' && data.type !== 'mine') {
      this.showMessage('不是文件夹！', 'error')
      return
    }
    let p: string, id: string
    if (this.currentPath.length) {
      id = this.currentPath[0].id
      p = ''
      for (let i = 1; i !== this.currentPath.length; ++i) {
        p += `/${this.currentPath[i].name}`
      }
      p += `/${data.name}`
    } else {
      id = data.id
      p = '/'
    }

    const url = `${this.host}/api/v2.1/repos/${id}/dir/?p=${encodeURIComponent(p)}&with_thumbnail=true`

    const res = await axios.get(url)
    const json = res.data?.dirent_list
    if (!json) return
    this.currentPath.push({
      name: data.name,
      id: data.id,
      type: data.type
    })
    this.folderContentStack.push(this.folderContent)
    this.folderContent = []
    for (const item of json) {
      this.folderContent.push({
        name: item.name,
        id: item.id,
        type: item.type
      })
    }
  }

  goBack (event: MouseEvent) {
    event.stopPropagation()
    if (!this.folderContentStack.length) return
    this.currentPath.pop()
    const data = this.folderContentStack.pop()
    if (data) this.folderContent = data
  }

  deploy () {
    if (!this.currentPath.length) {
      this.showMessage('请选择文件夹！', 'error')
      return
    }
    const pLib = this.currentPath.map((item, index) => (index ? encodeURIComponent(item.name) : `${item.id}/file`)).join('/')
    const pThumbnail = this.currentPath.map((item, index) => (index ? encodeURIComponent(item.name) : `${item.id}/192`)).join('/')
    const lib = `${this.host}/lib/${pLib}`
    const thumbnail = `${this.host}/thumbnail/${pThumbnail}`
    // get all the file whose name end with ".jpg"/".png"/".jpeg"
    const filesList = this.folderContent.filter((item) => {
      if (item.type !== 'file') return false
      const name = item.name.toLowerCase()
      return name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')
    }).map((item) => item.name)
    if (filesList.length === 0) {
      this.showMessage('该文件夹下没有图片！', 'error')
      return
    }
    this.deployData = { lib, thumbnail, filesList }
    this.saveDeployData()
    this.showMessage('部署成功！', 'info')
    this.startSchedule()
  }

  async config () {
    if (!this.currentPath.length) {
      this.showMessage('请选择文件夹！', 'error')
      return
    }

    const bookmarkPosition: FilePosition = {
      host: this.host,
      repoId: this.currentPath[0].id,
      folder: this.currentPath.map((item, index) => (index ? item.name : '')).join('/'),
      fileName: 'vua.bookmarks.json'
    }

    const detail = await getFileDetail(bookmarkPosition)
    // if (!exsist || confirm('该文件夹下已存在书签文件，是否覆盖？')) {
    //   let bookmarks = localStorage.getItem('bookmarks')
    //   if (!bookmarks) bookmarks = '[]'
    //   // uploadBookmark(bookmarks, bookmarkSync, true)
    // }
    const exsist = detail?.type === 'file'
    let msg = '设置书签位置成功！\n'
    if (exsist) {
      // UTC
      const timestamp = detail.mtime
      // YYYY-MM-DD HH:MM:SS
      const time = new Date(timestamp * 1000).toLocaleString()
      msg += `云端状态：已存在书签文件！\n最后修改时间：${time}。`
    } else {
      msg += '云端状态：未找到书签文件！'
    }
    alert(msg)
    localStorage.setItem('bookmarkSync', JSON.stringify(bookmarkPosition))
  }

  setWallpaper () {
    let list = []
    switch (this.scheduleSource) {
      case 'favorite':
        list = this.favoriteImageList
        break
      case 'deploy':
        if (!this.deployData) return
        list = this.deployData.filesList
        break
    }
    if (list.length === 0) return
    const index = Math.floor(Math.random() * list.length)
    let url = list[index]
    if (this.scheduleSource === 'deploy') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url = `${this.deployData!.lib}/${encodeURIComponent(url)}?dl=1`
    }
    this.setBackgroundImage(url)
  }
}
</script>

<style scoped lang="scss">
h3 {
  text-indent: 16px;
}

aside {
  position: fixed;
  color: white;
  top: 0;
  width: var(--side-bar-width);
  height: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.5);

  border-radius: 0 6px 6px 0;

  transition-property: left;
  transition-duration: 0.2s;
  transition-timing-function: ease-in-out;

  &.show {
    left: 0;
  }

  &.hide {
    left: calc(-1 * var(--side-bar-width));
  }
}

nav {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  border: none;
  box-sizing: border-box;
  padding: 10px 0 20px;
}

h2 {
  position: sticky;
  top: 0;
  text-align: center;
}

#wallpaper-buttons {
  position: absolute;
  top: 0;
  left: 100%;
  margin: 10px;
  border-radius: 14px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  height: 28px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  span {
    display: inline-block;
    width: 28px;
    height: 28px;
    padding: 0;
  }

  svg {
    padding: 6px;

    border-radius: 14px;
    &:hover {
      background-color: #ffffff1a;
    }
  }

  &:hover {
    background-color: #46413a;
    color: #3498db;
  }
}

#sidebar-buttons {

  padding: 0;
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;

  & > * {
    margin: 10px 0;
  }
}

button {
  color: white;
  border-radius: 6px;
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  border: none;

  &:hover {
    background-color: #ffffff1a;
  }
}

small {
  display: block;
  margin: 4px 8px;
}

ul {
  padding: 4px 10px;
  height: 210px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  &.image-list {
    height: 400px;
    max-height: 700px;
  }
}

#schedule-config {
  padding: 4px 16px;

  div {
    margin: 4px 0;
  }
}

li {
  list-style-type: none;
}

ul.text-list > li {
  margin: 2px;
  padding: 8px 20px;
  border-radius: 6px;
  background-color: #ffffff1a;
  cursor: pointer;

  &:hover {
    background-color: #ffffff66;
  }

  & > * {
    display: inline-block;
    vertical-align: middle;
  }

  div {
    line-height: 20px;
    padding: 2px;
  }

  svg {
    margin-right: 6px;
  }

}

ul.image-list > li {
  cursor: pointer;
  text-align: center;
  padding: 2px;

  &:hover {
    background-color: #ffffff66;
  }

  img {
    display: inline-block;
    width: var(--side-bar-image-width);
    height: var(--side-bar-image-height);
    border-radius: 4px;
    vertical-align: middle;
    margin: 2px;
  }
}

.side-bar-input {
  display: block;
  box-sizing: border-box;
  padding: 6px;
  width: 90%;
  background-color: #ffffff1a;
  color: inherit;
  border-radius: 4px;
  border: 2px solid #767676;
  outline: none;
  margin: 6px 0;

  &:hover {
    background-color: #ffffff33;
    border: 2px solid #AAA;
  }
}

select > option {
  padding: 6px 12px;
  background-color: #46413a;
}

input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
}

input::-webkit-outer-spin-button{
  -webkit-appearance: none !important;
}
</style>
