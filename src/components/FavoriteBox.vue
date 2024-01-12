<template>
  <div id="favorite-box" class="center dark-scrub-backgound">
    <nav>
      <SvgIcon name="PencilSquare" size="30px" @click="toggleMode('edit')"/>
      <SvgIcon name="Trash" size="30px" @click="toggleMode('delete')"/>
      <SvgIcon name="PlusSmall" size="30px" @click="enableBookmarkEdit"/>
      <SvgIcon name="ViewfinderCircle" size="30px" @click="$router.push({path: 'scan'})"/>
      <a href="https://yjmthu.github.io/vua/vua.crx" target="_blank"><SvgIcon name="Extension" size="30px"/></a>
      <SvgIcon name="ArrowUpCircle" size="30px" @click="uploadBookmarks"/>
      <SvgIcon name="ArrowDownCircle" size="30px" @click="downloadBookmarks"/>
    </nav>
    <ul ref="favorite-list" :style="{'--visible': mode !== 'normal' ? 'block' : 'none'}">
      <li v-for="(data, index) in favoriteData" :key="index" :href="data.url" :index="index">
        {{ data.name }}
        <SvgIcon class="li-icon" name="PlusSmall" v-if="mode=='edit'" size="14px"/>
        <SvgIcon class="li-icon" name="MinusSmall" v-else-if="mode=='delete'" size="14px"/>
      </li>
    </ul>
    <BookmarkEdit v-if="bookmarkEdit"
     :favoriteData="favoriteData"
     :index="index"
     @bookmarkEdit="enableBookmarkEdit"
     @addFavorite="addFavorite"/>
    <div @click="$emit('toggleVisbility')"></div>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SvgIcon from './SvgIcon.vue'
import BookmarkEdit from './BookmarkEdit.vue'
import { Bookmark, BookmarkSync, uploadBookmark, downloadBookmark } from '@/utils/typedef'

@Options({
  components: {
    SvgIcon,
    BookmarkEdit
  }
})
export default class FavoriteBox extends Vue {
  favoriteData: Bookmark[] = [
    {
      name: '网络学堂',
      url: 'https://learn.tsinghua.edu.cn/f/login'
    },
    {
      name: '信息门户',
      url: 'http://info.tsinghua.edu.cn/'
    }
  ]

  bookmarkEdit = false
  index = -1
  mode: 'normal' | 'delete' | 'edit' = 'normal'

  enableBookmarkEdit (on: boolean) {
    this.bookmarkEdit = on
    if (!on) {
      this.index = -1
      this.mode = 'normal'
    }
  }

  toggleMode (m = this.mode) {
    this.mode = this.mode === m ? 'normal' : m
  }

  addFavorite (data: Bookmark, index: number) {
    if (index === -1) {
      this.favoriteData.push(data)
    } else {
      this.favoriteData[index] = data
    }
    localStorage.bookmarks = JSON.stringify(this.favoriteData)
  }

  clearBookmarks () {
    this.favoriteData = []
    localStorage.bookmarks = JSON.stringify(this.favoriteData)
  }

  changeWhenClick (ev: MouseEvent) {
    if (ev.target) {
      const target = ev.target as HTMLElement
      switch (this.mode) {
        case 'delete': {
          const index = target.getAttribute('index')
          if (!index) return
          const i = Number(index)
          if (i >= 0 && i < this.favoriteData.length) {
            // console.log(`删除${i}`, this.favoriteData[i])
            this.favoriteData.splice(i, 1)
            localStorage.bookmarks = JSON.stringify(this.favoriteData)
          }
          break
        }
        case 'edit': {
          const index = target.getAttribute('index')
          if (!index) return
          this.index = Number(index)
          this.enableBookmarkEdit(true)
          break
        }
        case 'normal': {
          const href = target.getAttribute('href')
          if (!href) return
          // window.location.href = href
          window.open(href)
          break
        }
      }
    }
  }

  mounted (): void {
    const tmp = localStorage.getItem('bookmarks')
    if (tmp) {
      this.favoriteData = JSON.parse(tmp)
    } else {
      localStorage.setItem('bookmarks', JSON.stringify(this.favoriteData))
    }

    const target = this.$refs['favorite-list'] as HTMLElement
    target.addEventListener('click', this.changeWhenClick.bind(this))
  }

  beforeDestroy (): void {
    const target = this.$refs['favorite-list'] as HTMLElement
    target.removeEventListener('click', this.changeWhenClick.bind(this))
  }

  getBookmarkSync (): BookmarkSync | null {
    const syncString = localStorage.getItem('bookmarkSync')
    if (!syncString) {
      alert('同步失败，未选择云端存储位置！')
      return null
    }
    return JSON.parse(syncString) as BookmarkSync
  }

  uploadBookmarks () {
    const sync = this.getBookmarkSync()
    if (!sync) return
    uploadBookmark(JSON.stringify(this.favoriteData), sync)
  }

  downloadBookmarks () {
    const sync = this.getBookmarkSync()
    if (!sync) return

    downloadBookmark(sync, (data: Bookmark[]) => {
      this.favoriteData = data
      localStorage.setItem('bookmarks', JSON.stringify(this.favoriteData))
      alert('下载成功！')
    })
  }
}
</script>

<style scoped lang="scss">
#favorite-box {
  // position: relative;
  width: 40%;
  height: 400px;
  border-radius: 10px;
  z-index: 100;
  padding: 10px 20px 40px;

  & > div:last-child {
    cursor: pointer;
    border-top: solid 1px gray;
    position: absolute;
    width: calc(100% - 60px);
    height: 40px;
    bottom: 0;
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

  * {
    box-sizing: border-box;
  }
  & > * {
    position: relative;

    background-color: transparent;
    border-radius: 6px;
    cursor: pointer;
    &:hover {
      background-color: darkgray;
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
  display: grid;
  // grid-gap: 20px 20px;
  // justify-content: space-between;
  grid-template-columns: repeat(auto-fill, 50px);
  row-gap: 8px;
  list-style: none;

  padding: 2px;

  & > li {
    position: relative;
    list-style-type: none;
    border-radius: 6px;
    background-color: rgba(90, 90, 90, 0.8);
    list-style-type: none;
    user-select: none;

    &:hover {
      background-color: rgba(200, 200, 200, 0.5);
    }

    text-align: center;
    padding: 4px;
    width: 40px;
    height: 40px;
    box-sizing: border-box;
    font-size: smaller;
    color: white;
    cursor: pointer;

    &>.li-icon {
      position: absolute;

      color: white;
      background-color: rgba(0, 0, 0, 0.773);
      width: 16px;
      height: 16px;
      padding: 1px;
      border-radius: 8px;

      right: -5px;
      top: -5px;
    }
  }
}
</style>
