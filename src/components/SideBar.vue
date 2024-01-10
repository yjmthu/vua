<template>
  <aside :class="showSideBar?'show':'hide'">
    <div id="wallpaper-button" @click="toggleSideBar">
      <SvgIcon name="Photo" size="16px"/>
    </div>
    <h2>Vua New Tab</h2>
    <small>{{ currentFolder }}</small>
    <ul>
      <li v-if="folderContentStack.length !== 0" @click="goBack">..</li>
      <li v-for="item in folderContent" :key="item.id" @click="goForward(item)">
        <SvgIcon :name="icons[item.type]" size="16px"/>
        <div>{{ item.name }}</div>
      </li>
    </ul>
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
  url: string
  filesList: string[]
}

interface Icons {
  [key: string]: string;
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
    const data = localStorage.getItem('deployData')
    if (!data) return
    this.deployData = JSON.parse(data)
    this.setWallpaper()
  }

  get currentFolder () {
    return this.currentPath.map((item) => item.name).join('/')
  }

  toggleSideBar () {
    this.showSideBar = !this.showSideBar
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
    const p = this.currentPath.map((item, index) => (index ? encodeURIComponent(item.name) : `${item.id}/file`)).join('/')
    const url = `${this.host}/lib/${p}`
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
    this.deployData = { url, filesList }
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
    const url = `${this.deployData.url}/${encodeURIComponent(file)}?dl=1`
    console.log(url)
    const app = document.getElementById('app')
    if (!app) return
    app.style.backgroundImage = `url(${url})`
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

#wallpaper-button {
  position: absolute;
  top: 0;
  left: 100%;
  margin: 10px;
  border-radius: 50%;
  background-color: transparent;
  color: white;
  cursor: pointer;
  width: 28px;
  height: 28px;

  & > * {
    padding: 6px;
  }

  &:hover {
    background-color: #46413a;
    color: #3498db;
  }
}

#sidebar-buttons {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);

  padding: 20px 0;
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
  height: 400px;
  max-height: 400px;
  overflow-y: auto;
}

li {
  margin: 2px;
  padding: 8px 20px;
  border-radius: 6px;
  background-color: #ffffff1a;
  cursor: pointer;

  &:hover {
    background-color: #ffffff66;
  }

  list-style-type: none;

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
</style>
