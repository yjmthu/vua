<template>
  <div id="favorite-box" class="center">
    <nav>
      <SvgIcon name="PencilSquare" size="30px" @click="toggleMode('edit')"/>
      <SvgIcon name="Trash" size="30px" @click="toggleMode('delete')"/>
      <SvgIcon name="PlusSmall" size="30px" @click="enableBookmarkEdit"/>
    </nav>
    <ul ref="favorite-list" :style="{'--visible': mode !== 'normal' ? 'block' : 'none'}">
      <li :content="content" v-for="(data, index) in favoriteData" :key="index" :href="data.url" :index="index">{{ data.name }}</li>
    </ul>
    <BookmarkEdit v-if="bookmarkEdit" @bookmarkEdit="enableBookmarkEdit" @addFavorite="addFavorite"/>
    <div @click="$emit('toggleVisbility')"></div>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SvgIcon from './SvgIcon.vue'
import BookmarkEdit from './BookmarkEdit.vue'

interface BookMark {
  name: string
  url: string
}

@Options({
  components: {
    SvgIcon,
    BookmarkEdit
  }
})
export default class FavoriteBox extends Vue {
  favoriteData: BookMark[] = [
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
  mode: 'normal' | 'delete' | 'edit' = 'normal'

  enableBookmarkEdit (on: boolean) {
    this.bookmarkEdit = on
  }

  toggleMode (m = this.mode) {
    this.mode = this.mode === m ? 'normal' : m
  }

  addFavorite (data: BookMark) {
    this.favoriteData.push(data)
    localStorage.bookmarks = JSON.stringify(this.favoriteData)
  }

  clearBookmarks () {
    this.favoriteData = []
    localStorage.bookmarks = JSON.stringify(this.favoriteData)
  }

  get content () {
    return this.mode === 'delete' ? '-' : '+'
  }

  mounted (): void {
    const tmp = localStorage.getItem('bookmarks')
    if (tmp) {
      this.favoriteData = JSON.parse(tmp)
    } else {
      localStorage.setItem('bookmarks', JSON.stringify(this.favoriteData))
    }

    const target = this.$refs['favorite-list'] as HTMLElement
    target.addEventListener('click', (ev) => {
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
            break
          }
          case 'normal': {
            const href = target.getAttribute('href')
            if (!href) return
            window.location.href = href
            break
          }
        }
      }
    })
  }
}
</script>

<style scoped lang="scss">
#favorite-box {
  // position: relative;
  width: 80%;
  height: 400px;
  background-color: rgba(90, 90, 90, 0.6);
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

nav {
  padding: 2px;
  border-bottom: solid 1px blue;

  & > svg {
    position: relative;
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    color: white;
    background-color: transparent;
    border-radius: 6px;
    padding: 4px 6px;
    margin: 2px;
    cursor: pointer;
    &:hover {
      background-color: darkgray;
    }
  }
}

ul {
  display: grid;
  // grid-gap: 20px 20px;
  // justify-content: space-between;
  grid-template-columns: repeat(auto-fill, 50px);
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

    &::after {
      // content: var(--content, '-');
      content: attr(content);
      display: var(--visible, 'none');
      position: absolute;

      font-size: 6px;
      background-color: black;
      color: white;

      width: 16px;
      height: 16px;

      padding: auto;
      border-radius: 8px;

      right: 0;
      top: 0;
    }
  }
}
</style>
