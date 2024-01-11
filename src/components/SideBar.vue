<template>
  <aside :class="showSideBar?'show':'hide'">
    <div id="wallpaper-buttons">
      <SvgIcon name="Photo" size="16px" @click="toggleSideBar"/>
      <SvgIcon id="favoriteStar" name="Star" size="16px" @click="toggleFavorite"/>
    </div>
    <h2>Vua New Tab</h2>
    <h3>云盘数据</h3>
    <small>{{ currentFolder }}</small>
    <ul class="text-list">
      <li v-if="folderContentStack.length !== 0" @click="goBack">..</li>
      <li v-for="item in folderContent" :key="item.id" @click="goForward(item)">
        <SvgIcon :name="icons[item.type]" size="16px"/>
        <div>{{ item.name }}</div>
      </li>
    </ul>
    <h3>收藏预览</h3>
    <ul class="image-list" v-if="showSideBar">
      <li v-for="item in favoriteImageViewList" :key="item">
        <img :src="item" alt="未能加载" width="192" height="108" @click="setFromFavorite(item)"/>
        <!-- <div>{{ item }}</div> -->
      </li>
    </ul>
    <!-- radio button to choose schedule mode -->
    <h3>壁纸设置</h3>
    <div>
      <input type="radio" id="static" name="displayMode" value="static" v-model="scheduleMode">
      <label for="static">静态壁纸</label>
      <input type="radio" id="newtab" name="displayMode" value="newtab" v-model="scheduleMode">
      <label for="newtab">新标签页</label>
      <input type="radio" id="timer" name="displayMode" value="timer" v-model="scheduleMode">
      <label for="timer">定时切换</label>
    </div>
    <div id="sidebar-buttons">
      <button @click="login">Login</button>
      <button @click="update">Update</button>
      <button @click="deploy">Delpoy</button>
    </div>
  </aside>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SvgIcon from '@/components/SvgIcon.vue'
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
  // timestamp
  lastChange: number
  // in second
  interval: number
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
  scheduleData: ScheduleData = {
    displayMode: 'static',
    source: 'deploy',
    currentImage: '',
    lastChange: Math.floor(Date.now() / 1000),
    interval: 300
  }

  icons: Icons = {
    dir: 'Folder',
    file: 'Document',
    mine: 'Gift'
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
    }

    const app = document.getElementById('app')
    if (app) {
      const text = app.style.backgroundImage
      this.scheduleData.currentImage = text.slice(5, text.length - 2)
    }

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

  get scheduleMode () {
    return this.scheduleData.displayMode
  }

  set scheduleMode (value: 'static' | 'newtab' | 'timer') {
    this.scheduleMode = value
    this.startSchedule()
  }

  startSchedule () {
    switch (this.scheduleMode) {
      case 'static':
        this.setBackgroundImage(this.scheduleData.currentImage)
        break
      case 'newtab':
        this.setWallpaper()
        break
      case 'timer': {
        const now = Math.floor(Date.now() / 1000)
        if (now - this.scheduleData.lastChange >= this.scheduleData.interval) {
          this.scheduleData.lastChange = now
          this.setWallpaper()
        }
        setTimeout(this.startSchedule.bind(this), (this.scheduleData.lastChange + this.scheduleData.interval - now) * 1000)
        break
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
    localStorage.setItem('scheduleData', JSON.stringify(this.scheduleData))
  }

  setFromFavorite (view: string) {
    const regex = /^https:\/\/cloud.tsinghua.edu.cn\/thumbnail\/(.{36})\/192\/(.*)$/g
    const match = regex.exec(view)
    if (!match) return
    const url = `${this.host}/lib/${match[1]}/file/${match[2]}?dl=1`
    this.setBackgroundImage(url)

    const star = document.getElementById('favoriteStar')
    if (star) {
      star.style.color = 'yellow'
    }
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

    const star = document.getElementById('favoriteStar')
    const index = this.favoriteImageList.indexOf(this.scheduleData.currentImage)
    if (index === -1) {
      this.favoriteImageList.push(this.scheduleData.currentImage)
      if (star) star.style.color = 'yellow'
    } else {
      this.favoriteImageList.splice(index, 1)
      if (star) star.style.color = 'inherit'
    }

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
    this.setWallpaper()
  }

  setWallpaper () {
    if (!this.deployData) return
    const index = Math.floor(Math.random() * this.deployData.filesList.length)
    const file = this.deployData.filesList[index]
    console.log(file)
    const url = `${this.deployData.lib}/${encodeURIComponent(file)}?dl=1`
    this.setBackgroundImage(url)
  }
}
</script>

<style scoped lang="scss">
h2 {
  text-align: center;
}

aside {
  --side-bar-width: 240px;
  position: fixed;
  color: white;
  top: 0;
  width: var(--side-bar-width);
  height: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.5);

  border-radius: 0 10px 10px 0;

  &.show {
    left: 0;
  }

  &.hide {
    left: calc(-1 * var(--side-bar-width));
  }
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
  width: 60px;
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
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);

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
  border-radius: 6px;
  padding: 8px 16px;
  background-color: white;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: gray;
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

.image-list > li {
  cursor: pointer;
  text-align: center;
  padding: 2px;

  &:hover {
    background-color: #ffffff66;
  }

  img {
    display: inline-block;
    border-radius: 4px;
    vertical-align: middle;
    margin: 2px;
  }
}
</style>
