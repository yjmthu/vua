<template>
  <div class="mask" @click="cancelConfig">
    <div class="center" @click="$event.stopPropagation()">
      <h4>内容编辑器</h4>
      <div class="edit-box">
        <div class="edit-item">
          <span>名称</span>
          <input type="text" name="name" v-model="content.name">
          <SvgIcon name="Copy" size="24px" @click="copyContent"/>
        </div>
        <div v-if="'url' in content" class="edit-item">
          <span>链接</span>
          <input type="url" name="url" v-model="content.url">
          <SvgIcon name="Copy" size="24px" @click="copyContent"/>
        </div>
        <div v-if="'icon' in content" class="edit-item">
          <span>图标</span>
          <input type="url" name="icon" v-model="content.icon">
          <SvgIcon name="Copy" size="24px" @click="copyContent"/>
        </div>
        <div v-if="'color' in content" class="edit-item">
          <span>颜色</span>
          <input type="text" name="color" v-model="content.color">
          <SvgIcon name="Copy" size="24px" @click="copyContent"/>
        </div>
      </div>
      <div class="button-box">
        <button type="button" @click="cancelConfig">取消</button>
        <button type="button" @click="confirmConfig">确定</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SvgIcon from './SvgIcon.vue'
import { Bookmark } from '@/utils/typedef'

@Options({
  components: {
    SvgIcon
  },
  props: [
    'bookmark', 'callback'
  ]
})
export default class BookmarkEdit extends Vue {
  bookmark!: Bookmark
  content: Bookmark = {
    name: '新书签'
  }

  callback!: (data: Bookmark | null) => void

  mounted (): void {
    this.content = JSON.parse(JSON.stringify(this.bookmark))
  }

  confirmConfig () {
    this.callback(this.content)
  }

  cancelConfig () {
    this.callback(null)
  }

  copyContent ($event: MouseEvent) {
    let target = $event.target as HTMLElement
    if (target.tagName.toUpperCase() !== 'SVG') {
      target = target.parentElement as HTMLElement
    }
    const input = target.previousElementSibling as HTMLInputElement
    if (input === null || input.tagName.toUpperCase() !== 'INPUT') return
    // copy the content without using the execCommand API
    navigator.clipboard.writeText(input.value).then(() => {
      input.focus()
      input.select()
    }).catch(err => {
      console.error('Failed to copy: ', err)
    })
  }
}
</script>

<style scoped lang="scss">
div.center {
  color: white;
  padding: 20px 30px;
  border-radius: 10px;
  background-color: #1e1e1e;
  z-index: 999;
  font-size: 14px;
}

h4 {
  position: relative;
  margin: 4px;
  font-size: 16px;
  padding-bottom: 18px;
  text-align: center;
  user-select: none;
}

input {
  line-height: 1.6em;
  border-radius: 3px;
  padding: 8px;
  background-color: #333;
  border: none;
  outline: none;
  color: inherit;

  &:focus {
    background-color: #3e3e3e;
  }
}

button {
  border-radius: 3px;
  font-size: inherit;
  padding: 8px 20px;
  background-color: #333;
  user-select: none;
  cursor: pointer;
  border: none;
  color: inherit;

  &:hover {
    background-color: #3e3e3e;
  }

  &:active {
    background-color: #70c000;
  }
}

.edit-box {
  background-color: #282828;
  color: white;
  padding: 10px;
  border-radius: 5px;
}

.edit-item {
  margin: 10px 2px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  color: inherit;

  & > svg {
    color: inherit;
    border-radius: 2px;
    padding: 4px;
    cursor: pointer;

    &:hover {
      background-color: #3e3e3e
    }

    &:active {
      background-color: #70c000
    }

    > * {
      pointer-events: none;
    }
  }

  > * {
    margin: 0 4px;
  }
}

.button-box {
  padding: 10px 10px;
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

span {
  width: 40px;
  user-select: none;
  color: inherit;
}
</style>
