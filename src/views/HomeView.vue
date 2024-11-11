<template>
  <div id="main">
    <div id="logo" ref="logo" @click="toggleFavrotite"></div>
    <DirectLinks ref="directLinks"
      :tabAsync="tabAsync"
      @showEditBox="showEditBox"
      @uploadSyncData="uploadSyncData"/>
    <SearchBox
      @engineChanged="changeEngineLogo"/>
    <FavoriteBox ref="favoriteBox"
      v-show="showFavorite"
      :tabAsync="tabAsync"
      @uploadSyncData="uploadSyncData"
      @downloadSyncData="downloadSyncData"
      @showMessage="showMessage"
      @showEditBox="showEditBox"
      @toggleVisbility="toggleFavrotite"/>
    <SideBar ref="sideBar"
      :tabAsync="tabAsync"
      :syncStatus="syncStatus"
      @uploadSyncData="uploadSyncData"
      @showMessage="showMessage"
      @showEditBox="showEditBox"/>
  </div>
  <small v-show="message" :style="{'background-color': messageColor}"> {{ message }}</small>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
// import HelloWorld from '@/components/HelloWorld.vue' // @ is an alias to /src
import SideBar from '@/components/SideBar.vue'
import SearchBox from '@/components/SearchBox.vue'
import FavoriteBox from '@/components/FavoriteBox.vue'
import DirectLinks from '@/components/DirectLinks.vue'
import BookmarkEdit from '@/components/BookmarkEdit.vue'
import TabAsync from '@/utils/tabsync'
import { FilePosition, SyncData, Bookmark, uploadSyncData, getFileDetail, downloadFile, MessageType, messageColor } from '@/utils/typedef'
import { createApp, App } from 'vue'

@Options({
  components: {
    SearchBox,
    FavoriteBox,
    DirectLinks,
    SideBar,
    BookmarkEdit
  }
})
export default class HomeView extends Vue {
  showFavorite = false
  message = ''
  messageColor = 'black'
  tabAsync = new TabAsync()
  syncStatus = '数据未同步'
  // syncing = false

  mounted (): void {
    setTimeout(() => {
      this.checkSyncUpdate()
    }, 500)
  }

  toggleFavrotite () {
    this.showFavorite = !this.showFavorite
  }

  changeEngineLogo (logoName: string) {
    // console.log(`changeEngineLogo: ${logoName}`)
    const logo = this.$refs.logo as HTMLElement
    logo.style.backgroundImage = `url(./icons/${logoName}.svg)`
  }

  messageId: number | null = null
  showMessage (message: string, type: MessageType) {
    this.messageColor = messageColor[type]
    this.message = message

    if (this.messageId !== null) {
      clearTimeout(this.messageId)
    }

    this.messageId = setTimeout(() => {
      this.message = ''
      this.messageId = null
    }, 3000)
  }

  getBookmarkPosition (): FilePosition | null {
    const syncString = localStorage.getItem('bookmarkSync')
    return syncString ? JSON.parse(syncString) as FilePosition : null
  }

  saveSyncTime (time: number) {
    localStorage.setItem('bookmarkTime', time.toString())
  }

  readSyncTime (): number {
    const time = localStorage.getItem('bookmarkTime')
    if (time) {
      return parseInt(time)
    }
    return 0
  }

  async checkSyncUpdate () {
    if (this.tabAsync.otherTabCount > 0) {
      console.log('存在其他标签页，无需同步。')
      return
    }

    if (typeof chrome === 'undefined' || chrome.bookmarks === undefined) {
      return
    }

    const position = this.getBookmarkPosition()
    if (!position) {
      return
    }

    const detail = await getFileDetail(position)
    const time = this.readSyncTime()
    if (detail && detail.mtime > time) {
      // if (confirm('检测到云端书签有更新，是否下载？')) {
      //   await this.downloadSyncData(detail.mtime)
      // }
      if (await this.downloadSyncData(detail.mtime)) {
        this.showMessage('下载云端数据成功。', 'success')
      } else {
        this.showMessage('下载云端数据失败。', 'error')
      }
    } else if (detail) {
      this.syncStatus = `同步时间：${new Date(detail.mtime * 1000).toLocaleString()}`
      console.log('书签无需更新。')
    } else {
      this.showMessage('无法获取云端书签信息。', 'warning')
      this.syncStatus = `同步失败，本地时间：${new Date(time * 1000).toLocaleString()}`
    }
  }

  async uploadSyncData () {
    if (typeof chrome === 'undefined' || chrome.runtime === undefined) return
    const position = this.getBookmarkPosition()
    if (!position) {
      this.showMessage('同步失败，未选择云端存储位置！', 'warning')
      return
    }

    const favoriteBox = this.$refs.favoriteBox as FavoriteBox
    const wallpaperBar = this.$refs.sideBar as SideBar
    const directLinks = this.$refs.directLinks as DirectLinks
    const syncData: SyncData = {
      bookmark: favoriteBox.exportBookmarkData(),
      directLinks: directLinks.exportDirectLinkData(),
      wallpaper: wallpaperBar.exportWallpaperData()
    }
    if (!await uploadSyncData(syncData, position, true)) {
      this.showMessage('数据上传失败！', 'error')
      return
    }
    const detail = await getFileDetail(position)
    if (detail) {
      this.saveSyncTime(detail.mtime)
      this.showMessage('数据上传成功！', 'success')
    } else {
      this.showMessage('无法获取文件信息！', 'warning')
    }
  }

  async downloadSyncData (timestamp?: number) {
    const position = this.getBookmarkPosition()
    if (!position) return false

    const data = await downloadFile(position)
    if (!data) {
      this.showMessage('下载书签失败！', 'error')
      return false
    }

    if (data.bookmark) {
      const favoriteBox = this.$refs.favoriteBox as FavoriteBox
      await favoriteBox.importBookmarkData(data.bookmark)
    }
    if (data.directLinks) {
      const directLinks = this.$refs.directLinks as DirectLinks
      directLinks.importDirectLinks(data.directLinks)
    }
    if (data.wallpaper) {
      const wallpaperBar = this.$refs.sideBar as SideBar
      wallpaperBar.importWallpaperData(data.wallpaper)
    }
    if (timestamp === undefined) {
      const detail = await getFileDetail(position)
      if (!detail) {
        this.showMessage('下载书签信息失败！', 'warning')
        return false
      }
      timestamp = detail.mtime
    }
    this.saveSyncTime(timestamp)
    this.showMessage('下载书签成功！', 'info')
    return true
  }

  showEditBox (data: Bookmark, callback: ((data: Bookmark) => void) | ((data: Bookmark) => void)) {
    // create 'bookmark-edit' element
    const div = document.createElement('div')
    div.style.position = 'fixed'
    // div.style.zIndex = '1000'
    document.body.appendChild(div)
    let bookmarkEdit: App<Element> | null = null
    const cb = (data: Bookmark | null) => {
      if (data) callback(data)
      bookmarkEdit?.unmount()
      document.body.removeChild(div)
    }
    bookmarkEdit = createApp(BookmarkEdit, { bookmark: data, callback: cb })
    // mount it on an element
    bookmarkEdit.mount(div)
  }
}
</script>

<style scoped lang="scss">
#logo {
  width: 360px;
  height: 120px;
  margin-bottom: 20px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: bottom;
}

#main {
  position: relative;
  top: -10%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

small {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  padding: 6px 12px;
  margin: 10px;
  line-height: 16px;
  font-size: 14px;
  border-radius: 14px;
  color: white;
}

@media screen and (max-width: 720px) {
  #main {
    top: -15%;
  }
  #logo {
    width: 210px;
    height: 60;
    margin-bottom: 16px;
  }
}
</style>
