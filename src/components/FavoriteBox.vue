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
      </div>
    </nav>
    <ul v-if="currentTab == 0" id="favorite-bookmarks">
      <li v-for="(data, index) in favoriteBookmark" :key="index" @click="enterNode(index)">
        <a :href="data.url">{{  data.name }}</a>
      </li>
    </ul>
    <ul v-if="currentTab == 1" id="all-bookmarks">
      <li v-for="(data, index) in currentNode?.children" :key="index" @click="enterNode(index)">
        <SvgIcon :name="data.children ? 'Folder': 'Document'"></SvgIcon>
        {{ data.title }}
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

@Options({
  components: {
    SvgIcon,
    BookmarkEdit
  }
})
export default class FavoriteBox extends Vue {
  favoriteBookmark: FavoriteBookmark[] = []
  favriteDirStack: chrome.bookmarks.BookmarkTreeNode[] = []
  currentNode: chrome.bookmarks.BookmarkTreeNode | null = null

  currentTab = 0
  bookmarkEdit = false
  index = -1

  getCurrentParth () {
    return this.favriteDirStack.map((node) => {
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
    if (!this.currentNode?.children) {
      return
    }
    const node = this.currentNode.children[index]
    if (node?.url) {
      window.open(node.url)
      return
    }
    this.favriteDirStack.push(node)
    this.currentNode = node
  }

  leaveNode () {
    if (this.favriteDirStack.length <= 1) {
      return
    }
    this.favriteDirStack.pop()
    this.currentNode = this.favriteDirStack[this.favriteDirStack.length - 1]
  }

  mounted (): void {
    chrome.bookmarks.getTree((bookmarkArray) => {
      const allBookmarks = bookmarkArray[0]?.children
      if (allBookmarks && allBookmarks.length) {
        this.currentNode = allBookmarks[0]
        this.favriteDirStack.push(this.currentNode)
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
    if (!this.favriteDirStack.length) {
      alert('上传失败，书签数据错误！')
      return
    }
    uploadBookmark(JSON.stringify({
      bookmark: this.favriteDirStack[0],
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
        this.favriteDirStack = [this.currentNode]
        const dataChilren = this.currentNode.children || []
        for (const node of dataChilren) {
          this.addBookmark(rootId, node)
        }
        console.log('创建书签成功！')
      })
    })
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
      border-radius: 6px;
      display: inline-block;
      vertical-align: middle;
      padding: 0px 8px;

      &.active {
        background-color: darkgray;
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

ul#favorite-bookmarks, ul#all-bookmarks {
  list-style: none;
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

    &>svg {
      color: white;
      width: 16px;
      height: 16px;
      padding: 1px;
    }
  }
}
</style>
