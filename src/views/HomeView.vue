<template>
  <div id="wallpaper"></div>
  <div id="main">
    <div id="logo" ref="logo" @click="toggleFavrotite"></div>
    <DirectLinks ref="directLinks"
      :tabAsync="tabAsync"
      @showEditBox="showEditBox"
      @showMessage="showMessage"
      @uploadSyncData="uploadSyncData"/>
    <SearchBox
      :searchInputFocused="searchInputFocused"
      @searchInputFocus="searchInputFocus"
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
      :searchInputFocused="searchInputFocused"
      @uploadSyncData="uploadSyncData"
      @showMessage="showMessage"
      @showEditBox="showEditBox"/>
  </div>
  <div class="message-box" v-if="messages.length">
    <div v-for="msg in messages" :key="msg.id" :style="{'background-color': msg.color}">
      {{ msg.content }}
    </div>
  </div>
  <!-- <small v-show="message" :style="{'background-color': messageColor}"> {{ message }}</small> -->
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
import { FilePosition, SyncData, Bookmark, uploadSyncData, getFileDetail, downloadFile, MessageType, Message, messageColor } from '@/utils/typedef'
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
  messages: Message[] = []
  tabAsync = new TabAsync()
  syncStatus = '数据未同步'
  searchInputFocused = false
  // syncing = false

  mounted (): void {
    setTimeout(() => {
      this.checkSyncUpdate()
    }, 500)
  }

  toggleFavrotite () {
    this.showFavorite = !this.showFavorite
  }

  searchInputFocus (focused: boolean) {
    this.searchInputFocused = focused
  }

  changeEngineLogo (logoName: string) {
    // console.log(`changeEngineLogo: ${logoName}`)
    const logo = this.$refs.logo as HTMLElement
    logo.style.backgroundImage = `url(./icons/${logoName}.svg)`
  }

  messageId: number | null = null
  showMessage (message: string, type: MessageType) {
    const msg: Message = { id: 0, content: message, color: messageColor[type], type }
    this.messages.push(msg)

    msg.id = setTimeout(() => {
      const index = this.messages.indexOf(msg)
      if (index >= 0) {
        this.messages.splice(index, 1)
      }
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
    const time = this.readSyncTime()

    if (this.tabAsync.otherTabCount > 0) {
      console.log('存在其他标签页，无需同步。')
      if (time > 0) {
        this.syncStatus = `同步时间：${new Date(time * 1000).toLocaleString()}`
      } else {
        this.syncStatus = `本地时间：${new Date().toLocaleString()}`
      }
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
    if (detail && detail.mtime > time) {
      await this.downloadSyncData(detail.mtime)
    } else if (detail) {
      this.syncStatus = `同步时间：${new Date(detail.mtime * 1000).toLocaleString()}`
    } else {
      this.showMessage('无法获取云端信息。', 'warning')
      this.syncStatus = `同步失败，本地时间：${new Date(time * 1000).toLocaleString()}`
    }
  }

  async uploadSyncData () {
    if (typeof chrome === 'undefined' || chrome.runtime === undefined) return
    const position = this.getBookmarkPosition()
    if (!position) {
      this.showMessage('同步失败，未选择云端存储位置！', 'info')
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
      this.showMessage('同步数据上传失败！', 'error')
      this.syncStatus = '同步失败'
      return
    }
    const detail = await getFileDetail(position)
    if (detail) {
      this.saveSyncTime(detail.mtime)
      this.showMessage('同步数据上传成功！', 'success')
      this.syncStatus = `同步时间：${new Date(detail.mtime * 1000).toLocaleString()}`
    } else {
      this.showMessage('无法获取同步信息！', 'warning')
      this.syncStatus = '同步失败'
    }
  }

  async downloadSyncData (timestamp?: number) {
    const position = this.getBookmarkPosition()
    if (!position) {
      this.showMessage('未选择数据存储位置！', 'warning')
      return false
    }

    const data = await downloadFile(position)
    if (!data) {
      this.showMessage('下载同步数据失败！', 'error')
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
        this.showMessage('获取同步信息失败！', 'error')
        return false
      }
      timestamp = detail.mtime
    }
    this.saveSyncTime(timestamp)
    this.showMessage('下载同步数据成功！', 'success')
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

#wallpaper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  // background-image: url(https://source.unsplash.com/random);
  background-size: cover;
  background-position: center;

  filter: blur(0px);
  z-index: auto;
}

#main {
  position: relative;
  top: -10%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.message-box {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  margin: 6px 10px;

  &>div {
    margin: 4px;
    padding: 6px 12px;
    line-height: 16px;
    font-size: 14px;
    border-radius: 14px;
    color: white;
  }
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
