<template>
  <div id="favorite-box" class="center dark-scrub-backgound">
    <nav>
      <div>
        <small @click="() => {currentTab = 0}" :class="{active: currentTab === 0}">收藏</small>
        <small v-if="isChromeExt" @click="() => {currentTab = 1}" :class="{active: currentTab === 1}">书签</small>
      </div>
      <div>
        <SvgIcon name="ArrowLeft" size="30px" @click="leaveNode"></SvgIcon>
        <SvgIcon name="ViewfinderCircle" size="30px" @click="$router.push({path: 'scan'})"/>
        <a href="https://yjmthu.github.io/vua/vua.crx" target="_blank"><SvgIcon name="Extension" size="30px"/></a>
        <SvgIcon name="ArrowUpCircle" size="30px" @click="uploadBookmarks()"/>
        <SvgIcon name="ArrowDownCircle" size="30px" @click="downloadBookmarks()"/>
        <SvgIcon name="Trash" size="30px" :class="{ checked: isTrashMode }" @click="switchTrashMode"></SvgIcon>
      </div>
    </nav>
    <ul v-if="vifFavoritesTab" id="favorite-bookmarks">
      <li v-for="(data, index) in favoriteBookmark" :key="index" @click="clickFavorite(index)" @contextmenu.prevent="editFavorite(index)">{{  data.name }}</li>
      <li @click="editFavorite(favoriteBookmark.length)"><SvgIcon name="PlusSmall" size="24px"></SvgIcon></li>
    </ul>
    <ul v-if="vifBookmarksTab" id="all-bookmarks">
      <li v-for="(data, index) in currentNode?.children" :key="index" @click="enterNode(index)" @contextmenu.prevent="editBookmark(index)">
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
import TabAsync from '@/utils/tabsync'
import { Bookmark, BookmarkData, MessageType } from '@/utils/typedef'

@Options({
  components: {
    SvgIcon
  },
  props: {
    tabAsync: TabAsync
  }
})
export default class FavoriteBox extends Vue {
  favoriteBookmark: Bookmark[] = []
  bookmarkDirStack: chrome.bookmarks.BookmarkTreeNode[] = []
  currentNode: chrome.bookmarks.BookmarkTreeNode | null = null
  tabAsync!: TabAsync
  isTrashMode = false
  currentTab = 0
  // isChromeExt = false
  isChromeExt = typeof chrome !== 'undefined' && chrome.bookmarks !== undefined

  get vifBookmarksTab () {
    return this.isChromeExt && this.currentTab === 1
  }

  get vifFavoritesTab () {
    return this.currentTab === 0
  }

  getCurrentParth () {
    return this.bookmarkDirStack.map((node) => {
      return node.title
    }).join('/')
  }

  readFavoriteBookmarks () {
    const data = localStorage.getItem('bookmarks')
    if (data) {
      this.favoriteBookmark = JSON.parse(data) as Bookmark[]
    }
  }

  writeFavoriteBookmarks (data: Bookmark[]) {
    if (this.favoriteBookmark !== data) {
      this.favoriteBookmark = data
    }
    localStorage.setItem('bookmarks', JSON.stringify(data))
    this.tabAsync.postMessage({ name: 'FAVORITE_CHANGE' })
  }

  async importBookmarkData (data: BookmarkData) {
    this.writeFavoriteBookmarks(data.favorites)
    await this.importBookmarks(data.bookmarks.children)
  }

  exportBookmarkData (): BookmarkData {
    if (!this.bookmarkDirStack.length) {
      this.showMessage('上传失败，书签数据错误！', 'error')
      throw new Error('书签数据错误！')
    }
    return {
      bookmarks: this.bookmarkDirStack[0],
      favorites: this.favoriteBookmark
    }
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

  get rootNode () {
    return this.bookmarkDirStack[0]
  }

  loadBookmarks () {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      return
    }
    chrome.bookmarks?.getTree((bookmarkArray) => {
      const allBookmarks = bookmarkArray[0]?.children
      if (allBookmarks && allBookmarks.length) {
        this.bookmarkDirStack = [allBookmarks[0]]
        this.currentNode = this.rootNode
      } else {
        this.showMessage('获取书签失败。', 'error')
      }
    })
  }

  async importBookmarks (data: chrome.bookmarks.BookmarkTreeNode[] | undefined) {
    const dataChilren = data || []
    this.importingBookmarks = true
    const rootId = await this.clearBookmarks()
    for (const node of dataChilren) {
      await this.addBookmark(rootId, node)
    }
    this.importingBookmarks = false
  }

  mounted (): void {
    this.loadBookmarks()
    this.readFavoriteBookmarks()
    this.addBookmarkListener()
    this.tabAsync.addListener('FAVORITE_CHANGE', () => {
      this.readFavoriteBookmarks()
    })
    // this.isChromeExt = typeof chrome !== 'undefined' && chrome.bookmarks !== undefined
  }

  showMessage (msg: string, type: MessageType) {
    this.$emit('showMessage', msg, type)
  }

  importingBookmarks = false
  addBookmarkListener () {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      return
    }

    chrome.bookmarks.onCreated.addListener((id, bookmark) => {
      if (this.importingBookmarks) { return }
      // console.log('onCreated', id, bookmark)
      if (bookmark.parentId === undefined) {
        console.error('创建书签：不存在父节点！')
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
        console.log('创建书签：未找到父节点！')
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
          console.error('删除书签：未找到子节点！')
        }
        this.updateChildrenIndex(parent)
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.error('删除书签：未找到父节点！')
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
        console.error('更改书签：未找到节点！')
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
        } else {
          console.error('移动书签：未找到旧父节点！')
        }
        if (newParent && newParent.children) {
          let index = moveInfo.index
          if (index === undefined) {
            index = newParent.children.length
          }
          newParent.children.splice(index, 0, node)
          this.updateChildrenIndex(newParent)
        } else {
          console.error('移动书签：未找到新父节点！')
        }
        if (this.tabAsync.isMaster()) {
          this.uploadBookmarks()
        }
      } else {
        console.error('移动书签：未找到节点！')
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
        console.error('书签排序：未找到节点！')
      }
    })

    chrome.bookmarks.onImportBegan.addListener(() => {
      this.showMessage('书签导入开始。', 'info')
      this.importingBookmarks = true
    })

    chrome.bookmarks.onImportEnded.addListener(() => {
      this.showMessage('书签导入结束。', 'info')
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

  async uploadBookmarks () {
    this.$emit('uploadSyncData')
  }

  async downloadBookmarks (timestamp: null | number = null) {
    this.$emit('downloadSyncData', timestamp)
  }

  showBookmarkEdit (bookmark: Bookmark, callback: (data: Bookmark) => void) {
    this.$emit('showEditBox', bookmark, callback)
  }

  editFavorite (index: number) {
    const favorite = this.favoriteBookmark[index]
    const callback = (data: Bookmark) => {
      if (favorite) {
        this.favoriteBookmark[index] = data
      } else {
        this.favoriteBookmark.push(data)
      }

      this.writeFavoriteBookmarks(this.favoriteBookmark)
      this.uploadBookmarks()
    }
    this.showBookmarkEdit(favorite || { name: '', url: '' }, callback)
  }

  editBookmark (index: number) {
    const children = this.currentNode?.children
    if (!children) return
    const node = children[index]
    if (!node) return

    const callback = (data: Bookmark) => {
      if (node.url && data.url) {
        node.url = data.url
      }
      node.title = data.name

      chrome.bookmarks.update(node.id, {
        title: node.title,
        url: node.url
      })
    }

    const nodeData: Bookmark = {
      name: node.title
    }

    if (node.url) {
      nodeData.url = node.url
    }

    this.showBookmarkEdit(nodeData, callback)
  }
}
</script>

<style scoped lang="scss">
#favorite-box {
  // position: relative;
  width: 40%;
  border-radius: 10px;
  // z-index: 100;
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
