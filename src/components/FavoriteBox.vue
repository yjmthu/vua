<template>
  <div id="favorite-box" class="center dark-scrub-backgound">
    <nav>
      <div>
        <small @click="() => {currentTab = 0}" :class="{active: currentTab === 0}">收藏夹</small>
        <small @click="() => {currentTab = 1}" :class="{active: currentTab === 1}">书签栏</small>
      </div>
      <div>
        <SvgIcon name="ArrowLeft" size="30px" @click="leaveNode"></SvgIcon>
        <SvgIcon name="ViewfinderCircle" size="30px" @click="$router.push({path: 'scan'})"/>
        <a href="https://yjmthu.github.io/vua/vua.crx" target="_blank"><SvgIcon name="Extension" size="30px"/></a>
        <SvgIcon name="ArrowUpCircle" size="30px" @click="uploadBookmarks"/>
        <SvgIcon name="ArrowDownCircle" size="30px" @click="downloadBookmarks"/>
        <SvgIcon name="Trash" size="30px" :class="{ checked: isTrashMode }" @click="() => { isTrashMode = !isTrashMode }"></SvgIcon>
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
import { FavoriteBookmark, BookmarkSync, uploadBookmark, downloadBookmark } from '@/utils/typedef'
import { createApp, App } from 'vue'

@Options({
  components: {
    SvgIcon,
    BookmarkEdit
  }
})
export default class FavoriteBox extends Vue {
  favoriteBookmark: FavoriteBookmark[] = []
  bookmarkDirStack: chrome.bookmarks.BookmarkTreeNode[] = []
  currentNode: chrome.bookmarks.BookmarkTreeNode | null = null
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
  }

  enterNode (index: number) {
    const children = this.currentNode?.children
    if (!children) return
    const node = children[index]

    if (this.isTrashMode) {
      chrome.bookmarks.remove(node.id).then(() => {
        this.currentNode?.children?.splice(index, 1)
      }).catch((err) => {
        alert(err)
      })
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

  clickFavorite (index: number) {
    if (index < 0 || index >= this.favoriteBookmark.length) {
      return
    }
    if (this.isTrashMode) {
      this.favoriteBookmark.splice(index, 1)
    } else {
      // open url in new tab
      const url = this.favoriteBookmark[index].url
      window.open(url)
    }
  }

  mounted (): void {
    chrome.bookmarks.getTree((bookmarkArray) => {
      const allBookmarks = bookmarkArray[0]?.children
      if (allBookmarks && allBookmarks.length) {
        this.currentNode = allBookmarks[0]
        this.bookmarkDirStack.push(this.currentNode)
      } else {
        console.log('获取书签失败。')
      }
    })

    this.readFavoriteBookmarks()
  }

  getBookmarkSync (): BookmarkSync | null {
    const syncString = localStorage.getItem('bookmarkSync')
    if (!syncString) {
      alert('同步失败，未选择云端存储位置！')
      return null
    }
    return JSON.parse(syncString) as BookmarkSync
  }

  clearBookmarks (callback: (rootId: string) => void) {
    chrome.bookmarks.getTree((bookmarkArray) => {
      const allBookmarks = bookmarkArray[0]?.children
      if (allBookmarks && allBookmarks.length) {
        const rootId = allBookmarks[0].id
        const roots = allBookmarks[0].children
        if (!roots || !roots.length) {
          callback(rootId)
          return
        }
        let size = roots.length
        for (const node of roots) {
          chrome.bookmarks.removeTree(node.id).then(() => {
            size -= 1
            if (!size) {
              callback(rootId)
            }
          }).catch((err) => {
            console.log(err)
          })
        }
      } else {
        alert('无法获取默认书签文件夹！')
      }
    })
  }

  uploadBookmarks () {
    const sync = this.getBookmarkSync()
    if (!sync) {
      alert('同步失败，未选择云端存储位置！')
      return
    }
    if (!this.bookmarkDirStack.length) {
      alert('上传失败，书签数据错误！')
      return
    }
    uploadBookmark(JSON.stringify({
      bookmark: this.bookmarkDirStack[0],
      favorite: this.favoriteBookmark
    }), sync, true)
  }

  addBookmark (parentId: string, node: chrome.bookmarks.BookmarkTreeNode) {
    chrome.bookmarks.create({
      parentId,
      title: node.title,
      url: node.url
    }, (newNode) => {
      if (node.children) {
        for (const child of node.children) {
          this.addBookmark(newNode.id, child)
        }
      }
    })
  }

  downloadBookmarks () {
    const sync = this.getBookmarkSync()
    if (!sync) return

    downloadBookmark(sync, (data) => {
      if (data.bookmark && data.favorite) {
        this.writeFavoriteBookmarks(data.favorite)
        this.favoriteBookmark = data.favorite
        console.log('下载书签成功！')
      } else {
        alert('下载书签失败！')
        return
      }
      this.clearBookmarks((rootId: string) => {
        console.log('清空书签成功！')
        this.currentNode = data.bookmark
        this.bookmarkDirStack = [this.currentNode]
        const dataChilren = this.currentNode.children || []
        for (const node of dataChilren) {
          this.addBookmark(rootId, node)
        }
        console.log('创建书签成功！')
      })
    })
  }

  showBookmarkEdit (index: number) {
    const favorite = index > 0 ? this.favoriteBookmark[index] : null
    // create 'bookmark-edit' element
    const div = document.createElement('div')
    div.id = 'bookmark-edit'
    div.style.position = 'absolute'
    div.style.zIndex = '1000'
    document.body.appendChild(div)
    let bookmarkEdit: App<Element> | null = null
    const callback = (data: FavoriteBookmark, isEdit: boolean) => {
      if (isEdit) {
        if (favorite) {
          this.favoriteBookmark[index] = data
        } else {
          this.favoriteBookmark.push(data)
        }
      }
      this.writeFavoriteBookmarks(this.favoriteBookmark)
      // delete bookmarkEdit
      bookmarkEdit?.unmount()
      document.body.removeChild(div)
    }
    bookmarkEdit = createApp(BookmarkEdit, { favorite, callback })
    // mount it on an element
    bookmarkEdit.mount('#bookmark-edit')
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
