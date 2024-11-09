<template>
  <div id="favorite-box" class="center dark-scrub-backgound">
    <nav>
      <div>
        <small @click="() => {currentTab = 0}" :class="{active: currentTab === 0}">收藏</small>
        <small @click="() => {currentTab = 1}" :class="{active: currentTab === 1}">书签</small>
      </div>
      <div>
        <SvgIcon name="ArrowLeft" size="30px" @click="leaveNode"></SvgIcon>
        <SvgIcon name="ViewfinderCircle" size="30px" @click="$router.push({path: 'scan'})"/>
        <a href="https://yjmthu.github.io/vua/vua.crx" target="_blank"><SvgIcon name="Extension" size="30px"/></a>
        <SvgIcon name="ArrowUpCircle" size="30px" @click="uploadBookmarks(true)"/>
        <SvgIcon name="ArrowDownCircle" size="30px" @click="downloadBookmarks"/>
        <SvgIcon name="Trash" size="30px" :class="{ checked: isTrashMode }" @click="switchTrashMode"></SvgIcon>
      </div>
    </nav>
    <ul v-if="currentTab == 0" id="favorite-bookmarks">
      <li v-for="(data, index) in favoriteBookmark" :key="index" @click="clickFavorite(index)" @contextmenu.prevent="showBookmarkEdit(index)">{{  data.name }}</li>
      <li @click="addFavorite"><SvgIcon name="PlusSmall" size="24px"></SvgIcon></li>
    </ul>
    <ul v-if="currentTab == 1" id="all-bookmarks">
      <li v-for="(data, index) in currentNode?.children" :key="index" @click="enterNode(index)">
        <SvgIcon :name="data.children ? 'Folder': 'Document'" size="14px"></SvgIcon>
        <span>{{ data.title }}</span>
      </li>
    </ul>
    <div @click="$emit('toggleVisbility')">{{ getCurrentParth() }}</div>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SvgIcon from './SvgIcon.vue'
import BookmarkEdit from './BookmarkEdit.vue'
import TabAsync from '@/utils/tabsync'
import { FavoriteBookmark, FilePosition, uploadBookmark, getFileDetail, downloadFile } from '@/utils/typedef'
import { createApp, App } from 'vue'

@Options({
  components: {
    SvgIcon,
    BookmarkEdit
  },
  props: {
    tabAsync: TabAsync
  }
})
export default class FavoriteBox extends Vue {
  favoriteBookmark: FavoriteBookmark[] = []
  bookmarkDirStack: chrome.bookmarks.BookmarkTreeNode[] = []
  rootNode: chrome.bookmarks.BookmarkTreeNode | null = null
  currentNode: chrome.bookmarks.BookmarkTreeNode | null = null
  tabAsync!: TabAsync
  isTrashMode = false
  currentTab = 0

  getCurrentParth () {
    return this.bookmarkDirStack.map((node) => {
      return node.title
    }).join('/')
  }

  readFavoriteBookmarks () {
    const data = localStorage.getItem('bookmarks')
    if (data) {
      this.favoriteBookmark = JSON.parse(data) as FavoriteBookmark[]
    }
  }

  writeFavoriteBookmarks (data: FavoriteBookmark[]) {
    localStorage.setItem('bookmarks', JSON.stringify(data))
    this.tabAsync.postMessage({ name: 'FAVORITE_CHANGE' })
  }

  enterNode (index: number) {
    const children = this.currentNode?.children
    if (!children) return
    const node = children[index]

    if (this.isTrashMode) {
      chrome.bookmarks.remove(node.id)
      return
    }

    if (node?.url) {
      window.open(node.url)
      return
    }
    this.bookmarkDirStack.push(node)
    this.currentNode = node
  }

  leaveNode () {
    if (this.bookmarkDirStack.length <= 1) {
      return
    }
    this.bookmarkDirStack.pop()
    this.currentNode = this.bookmarkDirStack[this.bookmarkDirStack.length - 1]
  }

  addFavorite () {
    this.showBookmarkEdit(-1)
  }

  favoriteChanged = false
  clickFavorite (index: number) {
    if (index < 0 || index >= this.favoriteBookmark.length) {
      return
    }
    if (this.isTrashMode) {
      this.favoriteBookmark.splice(index, 1)
      this.favoriteChanged = true
    } else {
      // open url in new tab
      const url = this.favoriteBookmark[index].url
      window.open(url)
    }
  }

  switchTrashMode () {
    if (this.isTrashMode) {
      if (this.favoriteChanged) {
        this.writeFavoriteBookmarks(this.favoriteBookmark)
        this.uploadBookmarks()
        this.favoriteChanged = false
      }
    } else {
      this.favoriteChanged = false
    }
    this.isTrashMode = !this.isTrashMode
  }

  loadBookmarks () {
    chrome.bookmarks?.getTree((bookmarkArray) => {
      const allBookmarks = bookmarkArray[0]?.children
      if (allBookmarks && allBookmarks.length) {
        this.rootNode = allBookmarks[0]
        this.currentNode = this.rootNode
        this.bookmarkDirStack = [this.currentNode]
      } else {
        console.log('获取书签失败。')
      }
    })
  }

  async checkForUpdate () {
    if (this.tabAsync.otherTabCount > 0) {
      console.log('存在其他标签页，无需同步。')
      return
    }

    console.log('--------------------checkForUpdate--------------------')

    if (!chrome.bookmarks) {
      return
    }

    const position = this.getBookmarkPosition()
    if (!position) {
      return
    }

    const detail = await getFileDetail(position)
    const time = this.readBookmarkTime()
    if (detail && detail.mtime > time) {
      if (confirm('检测到云端书签有更新，是否下载？')) {
        await this.downloadBookmarks(detail.mtime)
      }
      // await this.downloadBookmarks(detail.mtime)
    }
  }

  mounted (): void {
    this.loadBookmarks()
    this.readFavoriteBookmarks()
    this.addBookmarkListener()
    setTimeout(() => {
      this.checkForUpdate()
    }, 500)

    this.tabAsync.addListener('FAVORITE_CHANGE', () => {
      this.readFavoriteBookmarks()
    })
  }

  importingBookmarks = false
  addBookmarkListener () {
    if (!chrome.bookmarks) {
      return
    }

    chrome.bookmarks.onCreated.addListener((id, bookmark) => {
      if (this.importingBookmarks) { return }
      // console.log('onCreated', id, bookmark)
      if (bookmark.parentId === undefined) {
        console.log('不存在父节点！')
        return
      }
      const parent = this.findElementById(bookmark.parentId, this.rootNode)
      if (parent && parent.children) {
        let index = bookmark.index
        if (index === undefined) {
          index = parent.children.length
        }
        parent.children.splice(index, 0, bookmark)
        this.updateChildrenIndex(parent)
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.log('未找到父节点！')
      }
    })

    chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
      if (this.importingBookmarks) { return }
      // console.log('onRemoved', id, removeInfo)
      const parent = this.findElementById(removeInfo.parentId, this.rootNode)
      if (parent) {
        const index = parent.children?.findIndex((node) => node.id === id)
        if (index !== undefined && index >= 0) {
          parent.children?.splice(index, 1)
        } else {
          console.log('未找到子节点！')
        }
        this.updateChildrenIndex(parent)
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.log('未找到父节点！')
      }
    })

    chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
      // console.log('onChanged', id, changeInfo)
      const node = this.findElementById(id, this.rootNode)
      if (node) {
        if (changeInfo.title) {
          node.title = changeInfo.title
        }
        if (changeInfo.url) {
          node.url = changeInfo.url
        }
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.log('未找到节点！')
      }
    })

    chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
      // console.log('onMoved', id, moveInfo)
      const node = this.findElementById(id, this.rootNode)
      if (node) {
        const oldParent = this.findElementById(moveInfo.oldParentId, this.rootNode)
        const newParent = this.findElementById(moveInfo.parentId, this.rootNode)
        if (oldParent && oldParent.children) {
          const index = oldParent.children.findIndex((child) => child.id === id)
          if (index >= 0) {
            oldParent.children.splice(index, 1)
            this.updateChildrenIndex(oldParent)
          }
        }
        if (newParent && newParent.children) {
          let index = moveInfo.index
          if (index === undefined) {
            index = newParent.children.length
          }
          newParent.children.splice(index, 0, node)
          this.updateChildrenIndex(newParent)
        }
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.log('未找到节点！')
      }
    })

    chrome.bookmarks.onChildrenReordered.addListener((id, reorderInfo) => {
      // console.log('onChildrenReordered', id, reorderInfo)
      const node = this.findElementById(id, this.rootNode)
      if (node && node.children) {
        const newChildren = []
        for (const id of reorderInfo.childIds) {
          const child = node.children.find((child) => child.id === id)
          if (child) {
            newChildren.push(child)
          }
        }
        node.children = newChildren
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.log('未找到节点！')
      }
    })

    chrome.bookmarks.onImportBegan.addListener(() => {
      console.log('onImportBegan')
      this.importingBookmarks = true
    })

    chrome.bookmarks.onImportEnded.addListener(() => {
      console.log('onImportEnded')
      this.importingBookmarks = false
      this.loadBookmarks()
      if (this.tabAsync.isMaster()) {
        this.uploadBookmarks()
      }
    })
  }

  findElementById (id: string, node: chrome.bookmarks.BookmarkTreeNode | null): chrome.bookmarks.BookmarkTreeNode | null {
    if (node?.id === id) {
      return node
    }
    if (node?.children) {
      for (const child of node.children) {
        const result = this.findElementById(id, child)
        if (result) {
          return result
        }
      }
    }
    return null
  }

  updateChildrenIndex (node: chrome.bookmarks.BookmarkTreeNode) {
    if (!node.children) {
      return
    }
    for (let i = 0; i < node.children.length; i++) {
      node.children[i].index = i
    }
  }

  getBookmarkPosition (): FilePosition | null {
    const syncString = localStorage.getItem('bookmarkSync')
    if (!syncString) {
      alert('同步失败，未选择云端存储位置！')
      return null
    }
    return JSON.parse(syncString) as FilePosition
  }

  async clearBookmarks () {
    const bookmarkArray = await chrome.bookmarks.getTree()
    const allBookmarks = bookmarkArray[0]?.children
    if (allBookmarks && allBookmarks.length) {
      const rootId = allBookmarks[0].id
      const roots = allBookmarks[0].children
      if (!roots || !roots.length) {
        return rootId
      }
      for (const node of roots) {
        await chrome.bookmarks.removeTree(node.id)
      }
      return rootId
    } else {
      throw new Error('无法获取默认书签文件夹！')
    }
  }

  async uploadBookmarks (showAlert = false) {
    const position = this.getBookmarkPosition()
    if (!position) {
      alert('同步失败，未选择云端存储位置！')
      return
    }
    if (!this.bookmarkDirStack.length) {
      alert('上传失败，书签数据错误！')
      return
    }
    const directLinks = localStorage.getItem('directLinks')
    await uploadBookmark(JSON.stringify({
      bookmark: this.bookmarkDirStack[0],
      favorite: this.favoriteBookmark,
      directLinks: directLinks ? JSON.parse(directLinks) : null
    }), position, true)
    const detail = await getFileDetail(position)
    if (detail) {
      this.saveBookmarkTime(detail.mtime)
      if (showAlert) {
        alert('上传书签成功！')
      } else {
        console.log('上传书签成功！')
      }
    } else {
      alert('上传书签失败，无法获取文件信息！')
    }
  }

  saveBookmarkTime (time: number) {
    localStorage.setItem('bookmarkTime', time.toString())
  }

  readBookmarkTime (): number {
    const time = localStorage.getItem('bookmarkTime')
    if (time) {
      return parseInt(time)
    }
    return 0
  }

  async addBookmark (parentId: string, node: chrome.bookmarks.BookmarkTreeNode) {
    const newNode = await chrome.bookmarks.create({
      parentId,
      title: node.title,
      url: node.url
    })
    if (node.children) {
      for (const child of node.children) {
        await this.addBookmark(newNode.id, child)
      }
    }
  }

  async downloadBookmarks (timestamp: null | number = null): Promise<boolean> {
    const position = this.getBookmarkPosition()
    if (!position) return false

    const data = await downloadFile(position)
    if (data && data.bookmark && data.favorite) {
      this.writeFavoriteBookmarks(data.favorite)
      this.favoriteBookmark = data.favorite
    } else {
      alert('下载书签失败！')
      return false
    }
    if (data.directLinks) {
      localStorage.setItem('directLinks', JSON.stringify(data.directLinks))
      this.$emit('updateDirectLinks')
    }
    //
    const dataChilren = data.bookmark.children || []
    this.importingBookmarks = true
    const rootId = await this.clearBookmarks()
    console.log('清空书签成功！')
    for (const node of dataChilren) {
      await this.addBookmark(rootId, node)
    }
    this.importingBookmarks = false
    if (timestamp === null) {
      const detail = await getFileDetail(position)
      if (!detail) {
        alert('下载书签失败！')
        return false
      }
      timestamp = detail.mtime
    }
    this.saveBookmarkTime(timestamp)
    alert('下载书签成功！')
    return true
  }

  showBookmarkEdit (index: number) {
    const favorite = index > 0 ? this.favoriteBookmark[index] : null
    // create 'bookmark-edit' element
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.zIndex = '1000'
    document.body.appendChild(div)
    let bookmarkEdit: App<Element> | null = null
    const callback = (data: FavoriteBookmark | null) => {
      if (data !== null) {
        if (favorite) {
          this.favoriteBookmark[index] = data
        } else {
          this.favoriteBookmark.push(data)
        }
      }
      this.writeFavoriteBookmarks(this.favoriteBookmark)
      if (data) {
        this.uploadBookmarks()
      }
      // delete bookmarkEdit
      bookmarkEdit?.unmount()
      document.body.removeChild(div)
    }
    bookmarkEdit = createApp(BookmarkEdit, { favorite, callback })
    // mount it on an element
    bookmarkEdit.mount(div)
  }
}
</script>

<style scoped lang="scss">
#favorite-box {
  // position: relative;
  width: 40%;
  border-radius: 10px;
  z-index: 100;
  padding: 10px 20px 0;

  & > div:last-child {
    box-sizing: border-box;
    padding-top: 4px;
    color: aqua;
    font-size: smaller;
    cursor: pointer;
    border-top: solid 1px gray;
    height: 40px;
  }
}

@media screen and (max-width: 720px) {
  #favorite-box {
    width: 80%;
  }
}

nav {
  padding: 2px;
  border-bottom: solid 1px blue;
  color: white;
  display: flex;
  flex-direction: row;

  & > div {
    padding: 0;
    margin: 0;
    font-size: 18px;

    small {
      user-select: none;
      border-radius: 6px;
      display: inline-block;
      vertical-align: middle;
      padding: 0px 8px;
      cursor: pointer;
      margin-right: 4px;

      &.active {
        background-color: darkgray;
      }

      &:hover {
        background-color: gray;
      }
    }

    &:first-child {
      flex: 1;
      line-height: 30px;
    }

    * {
      box-sizing: border-box;
    }
    &:last-child > * {
      position: relative;

      background-color: transparent;
      border-radius: 6px;
      cursor: pointer;
      &:hover {
        background-color: darkgray;
      }
    }
  }

  svg {
    padding: 4px 6px;
  }

  a {
    display: inline-block;
    width: 30px;
    height: 30px;
    color: white;
    text-decoration: none;
  }
}

ul {
  padding: 2px;
  height: 350px;
  overflow-y: auto;

  & > li {
    border-radius: 6px;
    background-color: rgba(90, 90, 90, 0.8);
    list-style-type: none;
    user-select: none;

    &:hover {
      background-color: rgba(200, 200, 200, 0.5);
    }

    padding: 8px;
    margin-bottom: 6px;
    box-sizing: border-box;
    font-size: smaller;
    color: white;
    cursor: pointer;
  }
}

ul#favorite-bookmarks {
  line-height: 14px;
  & > li {
    display: inline-block;
    vertical-align: middle;
    width: 40px;
    height: 40px;
    margin: 4px;
  }
}

ul#all-bookmarks {
  & > li {
    line-height: 14px;
    font-size: 14px;
    & > * {
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
    }
    & > svg {
      color: white;
      padding: 1px;
    }
  }
}

</style>
