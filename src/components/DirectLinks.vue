<template>
  <ul class="row-center">
    <li v-for="(item, index) in directLinks" :key="index" @contextmenu.prevent="onRightClick($event, index)">
      <div class="direct-link" @click="openUrl($event, index)">
        <img :src="item.icon" :style="{'background-color': item.color}"/>
        <div>{{ item.name }}</div>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { Options } from 'vue-class-component'
import { Bookmark, MsgVue } from '@/utils/typedef'
import TabAsync from '@/utils/tabsync'

@Options({
  props: {
    tabAsync: TabAsync
  }
})
export default class DirectLinks extends MsgVue {
  tabAsync!: TabAsync
  public directLinks: Bookmark[] = [
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
      name: 'Gitee',
      url: 'https://gitee.com',
      icon: 'https://files.codelife.cc/icons/gitee.svg',
      color: '#961a1d'
    },
    {
      name: '微软邮箱',
      url: 'https://outlook.live.com',
      icon: 'https://www.svgrepo.com/show/452067/ms-outlook.svg',
      color: '#0c4061'
    }
  ]

  openUrl (e: MouseEvent, index: number) {
    const url = this.directLinks[index].url
    if (!url) return

    e.preventDefault()
    e.stopPropagation()
    if (e.ctrlKey) {
      window.location.href = url
    } else {
      window.open(url)
    }
  }

  readDirectLinks () {
    const data = localStorage.getItem('directLinks')
    if (data) {
      this.directLinks = JSON.parse(data) as Bookmark[]
    } else {
      this.writeDirectLinks()
    }
  }

  writeDirectLinks () {
    localStorage.setItem('directLinks', JSON.stringify(this.directLinks))
    this.tabAsync.postMessage({ name: 'DIRECT_LINK_CHANGE' })
  }

  importDirectLinks (data: Bookmark[]) {
    this.directLinks = data
    this.writeDirectLinks()
  }

  exportDirectLinkData () {
    return this.directLinks
  }

  uploadSyncData () {
    this.$emit('uploadSyncData')
  }

  mounted () {
    this.readDirectLinks()

    this.tabAsync.addListener('DIRECT_LINK_CHANGE', () => {
      this.readDirectLinks()
    })
  }

  onRightClick (e: MouseEvent, index: number) {
    // e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey) {
      const url = this.directLinks[index].url
      if (url) {
        navigator.clipboard.writeText(url)
        this.showMessage('已复制链接', 'success')
      } else {
        this.showMessage('无法复制链接', 'warning')
      }
    } else {
      this.showDirectLinkEdit(index)
    }
  }

  showDirectLinkEdit (index: number) {
    const favorite = this.directLinks[index]

    const callback = (data: Bookmark) => {
      this.directLinks[index] = data
      this.writeDirectLinks()
      this.uploadSyncData()
    }

    this.$emit('showEditBox', favorite, callback)
  }
}
</script>

<style scoped lang="scss">
.direct-link {
  text-decoration: none;
  font-size: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-direction: column;
  cursor: pointer;

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
