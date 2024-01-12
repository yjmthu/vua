<template>
  <aside ref="aside" :class="showSideBar? 'show' : 'hide'">
    <div id="wallpaper-buttons">
      <SvgIcon name="Photo" size="16px" @click="toggleSideBar"/>
      <SvgIcon id="favoriteStar" name="Star" size="16px" @click="toggleFavorite"/>
      <SvgIcon name="ArrowPath" size="16px" @click="setWallpaper"/>
    </div>
    <nav>
      <h2>Vua New Tab</h2>
      <div id="sidebar-buttons">
        <button @click="login">登录</button>
        <button @click="update">刷新</button>
        <button @click="deploy">部署</button>
        <button @click="config">书签</button>
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
        <li v-for="item in favoriteImageViewList" :key="item">
          <img :src="item" :alt="getNameFromThumbnail(item)" @click="setFromFavorite(item)"/>
          <!-- <div>{{ item }}</div> -->
        </li>
      </ul>
      <h3>壁纸设置</h3>
      <div id="schedule-config">
        <h4>自动切换模式</h4>
        <!-- radio button to choose schedule mode -->
        <select v-model="scheduleMode">
          <option value="static">静态壁纸</option>
          <option value="newtab">新标签页</option>
          <option value="timer">定时切换</option>
        </select>
        <div v-if="scheduleMode === 'timer'">
          <h4>时间间隔</h4>
          <!-- user can input number (range in 1~60) and choose unit here (second, minute, hour, day)-->
          <input type="number" min="1" max="60" v-model.number="timeInterval">
          <select v-model="scheduleIntervalUnit">
            <option value="second">秒</option>
            <option value="minute">分</option>
            <option value="hour">时</option>
            <option value="day">天</option>
          </select>
        </div>
        <h4>壁纸来源</h4>
        <select v-model="scheduleSource">
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
import { BookmarkSync, uploadBookmark } from '@/utils/typedef'
import axios from 'axios'

interface FolderContent {
  name: string
  id: string
  type: string
}

interface DeployData {
  lib: string
  thumbnail: string
  filesList: string[]
}

interface Icons {
  [key: string]: string;
}

interface ScheduleData {
  displayMode: 'static' | 'newtab' | 'timer'
  source: 'favorite' | 'deploy'
  currentImage: string
  // timestamp in second
  lastChange: number
  // interval in second
  interval: number
  // interval unit to show
  intervalUnit: 'second' | 'minute' | 'hour' | 'day'
}

function getFavoriteImageList () {
  let images = ['fa29af52426942c88ba5']
  if (window.innerWidth >= 720) {
    images = [
      '805e90f9963d4547985a',
      '2d9fabd26a7b4163b770',
      'cdf726e5d5e44a85982e',
      '014e257f8d4d428b98f6',
      '80eb15b257574159a9e4',
      '9f9b4899305f40cf8d6a',
      '542dd08d0a3f40a39970'
    ]
  }
  return images.map((item) => `https://cloud.tsinghua.edu.cn/f/${item}/?dl=1`)
}

@Options({
  components: {
    SvgIcon
  }
})
export default class SideBar extends Vue {
  showSideBar = false
  domain = 'cloud.tsinghua.edu.cn'
  host = `https://${this.domain}`
  folderContent: FolderContent[] = []
  currentPath: FolderContent[] = []
  folderContentStack: FolderContent[][] = []
  deployData: DeployData | null = null
  favoriteImageList: string[] = []
  favoriteImageViewList: string[] = []
  timerId: number | null = null
  scheduleData: ScheduleData = {
    displayMode: 'static',
    source: 'favorite',
    currentImage: '',
    lastChange: Math.floor(Date.now() / 1000),
    interval: 300,
    intervalUnit: 'second'
  }

  icons: Icons = {
    dir: 'Folder',
    file: 'Document',
    mine: 'Gift'
  }

  hideWhenClick (event: MouseEvent) {
    const aside = this.$refs.aside as HTMLElement
    if (aside && !aside.contains(event.target as Node)) {
      this.showSideBar = false
    }
  }

  mounted (): void {
    /*
    chrome.storage.local.get(['deployData'], (result) => {
      if (result.deployData) {
        this.deployData = {
          url: result.deployData.url,
          filesList: []
        }
        console.log(result.deployData.filesList)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, item] of Object.entries(result.deployData.filesList)) {
          this.deployData.filesList.push(item as string)
        }
        this.setWallpaper()
      } else {
        console.log('No deploy data found.')
      }
    })
    */

    document.addEventListener('click', this.hideWhenClick.bind(this))

    const schedule = localStorage.getItem('scheduleData')
    if (schedule) {
      this.scheduleData = JSON.parse(schedule)
    }

    const data = localStorage.getItem('deployData')
    if (data) {
      this.deployData = JSON.parse(data)
      this.startSchedule()
    }
    const favorite = localStorage.getItem('favoriteImageList')
    if (favorite) {
      this.favoriteImageList = JSON.parse(favorite)
      this.updateViewList()
    } else {
      this.favoriteImageList = getFavoriteImageList()
      localStorage.setItem('favoriteImageList', JSON.stringify(this.favoriteImageList))
    }

    this.updateStarColor()
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

  updateStarColor () {
    // if currentBackgroundImage is in favoriteImageList, then set the star to yellow
    const star = document.getElementById('favoriteStar')
    if (star) {
      if (this.isFavorite()) {
        star.style.color = 'yellow'
      } else {
        star.style.color = 'inherit'
      }
    }
  }

  saveScheduleData () {
    localStorage.setItem('scheduleData', JSON.stringify(this.scheduleData))
  }

  get scheduleSource () {
    return this.scheduleData.source
  }

  set scheduleSource (value: 'favorite' | 'deploy') {
    // check if is chrome extention or pure website
    if (!chrome.runtime) {
      this.scheduleData.source = value
      alert('请使用 Chrome 扩展！')
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

  updateViewList () {
    this.favoriteImageViewList = []
    for (const item of this.favoriteImageList) {
      if (!item.startsWith(this.host)) continue
      // https://cloud.tsinghua.edu.cn/lib/6ab41ae3-06dc-483b-9606-4a55c0f9925e/file/%E6%A1%8C%E9%9D%A2%E5%A3%81%E7%BA%B8/wallhaven-kx8vmm.jpg?dl=1
      const regex = /^https:\/\/cloud.tsinghua.edu.cn\/lib\/(.{36})\/file\/(.*)\?dl=1$/g
      const match = regex.exec(item)
      if (!match) continue
      this.favoriteImageViewList.push(`${this.host}/thumbnail/${match[1]}/192/${match[2]}`)
    }
  }

  setBackgroundImage (url: string) {
    const app = document.getElementById('app')
    if (!app) return
    app.style.backgroundImage = `url(${url})`
    this.scheduleData.currentImage = url
    this.updateStarColor()
    this.saveScheduleData()
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

    // update favorite list from localStorage
    const favorite = localStorage.getItem('favoriteImageList')
    if (favorite) {
      this.favoriteImageList = JSON.parse(favorite)
    }

    const index = this.favoriteImageList.indexOf(this.scheduleData.currentImage)
    if (index === -1) {
      this.favoriteImageList.push(this.scheduleData.currentImage)
    } else {
      this.favoriteImageList.splice(index, 1)
    }
    this.updateStarColor()

    this.updateViewList()
    localStorage.setItem('favoriteImageList', JSON.stringify(this.favoriteImageList))
  }

  isFavorite () {
    if (!this.scheduleData.currentImage) return false
    return this.favoriteImageList.indexOf(this.scheduleData.currentImage) !== -1
  }

  getCookies (callback: (cookies: chrome.cookies.Cookie[]) => void) {
    chrome.cookies.getAll({
      domain: this.domain
    }, callback)
  }

  login () {
    chrome.tabs.create({ url: this.host }).then((tab) => {
      console.log(tab)
    }).catch((err) => {
      console.log(err)
    })
    this.update()
  }

  update () {
    this.getCookies((cookies) => {
      if (cookies.length === 0) {
        alert('请先登录清华云盘！')
        return
      }
      const url = `${this.host}/api/v2.1/repos/?type=mine`
      axios.get(url).then((res) => {
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
      }).catch((err) => {
        console.log(err)
      })
    })
  }

  goForward (data: FolderContent) {
    // const data = this.folderContent[index]
    if (!data) return
    this.getCookies((cookies) => {
      if (cookies.length === 0) {
        alert('请先登录清华云盘！')
        return
      }
      if (data.type !== 'dir' && data.type !== 'mine') {
        alert('不是文件夹！')
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

      axios.get(url).then((res) => {
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
      }).catch((err) => {
        console.log(err)
      })
    })
  }

  goBack () {
    if (!this.folderContentStack.length) return
    this.currentPath.pop()
    const data = this.folderContentStack.pop()
    if (data) this.folderContent = data
  }

  deploy () {
    if (!this.currentPath.length) {
      alert('请选择文件夹！')
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
      alert('该文件夹下没有图片！')
      return
    }
    this.deployData = { lib, thumbnail, filesList }
    /*
    chrome.storage.local.set({ deployData: this.deployData }, () => {
      if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError)
      } else {
        console.log('Deploy data saved.')
      }
    })
    */
    localStorage.setItem('deployData', JSON.stringify(this.deployData))
    this.startSchedule()
  }

  config () {
    if (!this.currentPath.length) {
      alert('请选择文件夹！')
      return
    }

    const bookmarkSync: BookmarkSync = {
      host: this.host,
      repoId: this.currentPath[0].id,
      folder: this.currentPath.map((item, index) => (index ? item.name : '')).join('/'),
      fileName: 'vua.bookmarks.json'
    }

    let bookmarks = localStorage.getItem('bookmarks')
    if (!bookmarks) bookmarks = '[]'
    uploadBookmark(bookmarks, bookmarkSync)
    localStorage.setItem('bookmarkSync', JSON.stringify(bookmarkSync))
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

  & > svg {
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

select {
  display: block;
  padding: 6px;
  width: 90%;
  background-color: #ffffff1a;
  color: inherit;
  border-radius: 4px;
  outline: none;
  margin: 6px 0;

  option {
    padding: 6px 12px;
    background-color: #46413a;
  }
}

input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
}

input::-webkit-outer-spin-button{
  -webkit-appearance: none !important;
}

input[type=number] {
  width: 90%;
  display: block;
  background-color: #ffffff1a;
  color: white;

  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  padding: 5px 15px;
}
</style>
