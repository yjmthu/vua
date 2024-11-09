<template>
  <ul class="row-center">
    <li v-for="(item, index) in directLinks" :key="index" @contextmenu.prevent="showBookmarkEdit(index)">
      <a :href="item.url" target="_blank">
        <img :src="item.icon" :style="{'background-color': item.color}"/>
        <div>{{ item.name }}</div>
      </a>
    </li>
  </ul>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { DirectLink } from '@/utils/typedef'
import { App, createApp } from 'vue'
import TabAsync from '@/utils/tabsync'
import BookmarkEdit from './BookmarkEdit.vue'

@Options({
  props: {
    tabAsync: TabAsync
  }
})
export default class DirectLinks extends Vue {
  tabAsync!: TabAsync
  public directLinks: DirectLink[] = [
    {
      name: '网络学堂',
      url: 'https://learn.tsinghua.edu.cn/f/login/',
      icon: 'https://files.codelife.cc/user-website-icon/20230603/fD9TA2ag2A0LgqPa7a3va9996.jpeg?x-oss-process=image/resize,limit_0,m_fill,w_100,h_100/quality,q_92/format,webp',
      color: '#ffffff'
    },
    {
      name: '信息门户',
      url: 'http://info.tsinghua.edu.cn/',
      icon: 'https://files.codelife.cc/website/5bec1fed649fb56180c8d908.png?x-oss-process=image/resize,limit_0,m_fill,w_100,h_100/quality,q_92/format,webp',
      color: '#ffffff'
    },
    {
      name: '腾讯视频',
      url: 'http://v.qq.com/',
      icon: 'https://files.codelife.cc/icons/qqvideo.svg',
      color: '#ffffff'
    },
    {
      name: '哔哩哔哩',
      url: 'http://www.bilibili.com/',
      icon: 'https://files.codelife.cc/icons/bilibili2.svg',
      color: '#fe65a6'
    },
    {
      name: 'GitHub',
      url: 'https://github.com',
      icon: 'https://files.codelife.cc/icons/github.svg',
      color: 'black'
    },
    {
      name: '知乎',
      url: 'https://www.zhihu.com',
      icon: 'https://files.codelife.cc/icons/zhihu.svg',
      color: '#0c6dfe'
    },
    {
      name: 'Wikipedia',
      url: 'https://en.wikipedia.org',
      icon: 'https://files.codelife.cc/icons/wikipedia.svg',
      color: 'black'
    },
    {
      name: 'Wallhaven',
      url: 'https://wallhaven.cc',
      icon: 'https://files.codelife.cc/icons/wallhave.svg',
      color: '#0c4061'
    }
  ]

  readDirectLinks () {
    const data = localStorage.getItem('directLinks')
    if (data) {
      this.directLinks = JSON.parse(data) as DirectLink[]
    } else {
      this.writeDirectLinks()
    }
  }

  writeDirectLinks () {
    localStorage.setItem('directLinks', JSON.stringify(this.directLinks))
    this.tabAsync.postMessage({ name: 'DIRECT_LINK_CHANGE' })
  }

  mounted () {
    this.readDirectLinks()

    this.tabAsync.addListener('DIRECT_LINK_CHANGE', () => {
      this.readDirectLinks()
    })
  }

  showBookmarkEdit (index: number) {
    const favorite = this.directLinks[index]
    const div = document.createElement('div')
    document.body.appendChild(div)
    div.style.position = 'fixed'
    let bookmarkEdit: App<Element> | null = null
    const callback = (data: DirectLink | null) => {
      if (data) {
        this.directLinks[index] = data
        this.writeDirectLinks()
        this.$emit('linkChanged')
      }
      bookmarkEdit?.unmount()
      document.body.removeChild(div)
    }
    bookmarkEdit = createApp(BookmarkEdit, { favorite, callback })
    bookmarkEdit.mount(div)
  }
}
</script>

<style scoped lang="scss">
a {
  text-decoration: none;
  font-size: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-direction: column;

  width: var(--icon-size)
}

img {
  width: var(--icon-size);
  height: var(--icon-size);
  border-radius: 16px;
  color: #cc7878;
}

ul {
  position: absolute;
  user-select: none;
  padding-left: 0;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 5px);
  flex-wrap: wrap;
  width: var(--icon-row-size);
  justify-content: center;
  gap: 24px;

  & > li {
    list-style: none;
  }
}
</style>
