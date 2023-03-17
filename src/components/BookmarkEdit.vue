<template>
  <form class="center" ref="form">
    <SvgIcon name="XCircle" size="20px" className="close-button" @click="cancelConfig"/>
    <h4>
      <span>书签编辑</span>
    </h4>
    <div>
      <span>名称</span>
      <input type="text" ref="text" name="name">
    </div>
    <div>
      <span>链接</span>
      <input type="url" ref="url" name="url">
    </div>
    <div>
      <button type="button" @click="cancelConfig">取消</button>
      <button type="button" @click="confirmConfig">确定</button>
    </div>
  </form>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import { BookMark } from '@/utils/typedef'
import SvgIcon from './SvgIcon.vue'

@Options({
  components: {
    SvgIcon
  },
  props: [
    'favoriteData', 'index'
  ]
})
export default class BookmarkEdit extends Vue {
  favoriteData!: BookMark[]
  index!: number

  mounted () {
    if (this.index !== -1) {
      const t = this.$refs.text as HTMLInputElement
      t.value = this.favoriteData[this.index].name
      const u = this.$refs.url as HTMLInputElement
      u.value = this.favoriteData[this.index].url
    }
  }

  confirmConfig () {
    // configBoxDom.style.visibility = 'hidden'
    const formData = new FormData(this.$refs.form as HTMLFormElement)
    const name = formData.get('name')
    const url = formData.get('url')
    if (name && url) {
      this.$emit('addFavorite', {
        name, url
      }, this.index)
    }
    this.$emit('bookmarkEdit', false)
  }

  cancelConfig () {
    this.$emit('bookmarkEdit', false)
  }
}
</script>

<style scoped lang="scss">
form {
  color: white;
  width: 260px;
  height: 200px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 10px;
  border: 2px solid gray;
  border-radius: 6px;
  background-color: rgb(26, 28, 28, 0.5);

  & > * {
    padding: 8px;

    & > * {
      margin: 2px 8px;
    }
  }
}

h4 {
  margin: 10px 0 12px;
  padding: 2px;
}

input {
  line-height: 2em;
  border-radius: 10px;
  padding: 2px 8px;
}

button {
  border-radius: 6px;
  margin: 10px 20px;
  padding: 8px 20px;
  background-color: white;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: gray;
  }
}

.close-button {
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  display: inline-block;
  padding: 0;
  top: 20px;
  right: 15px;

  &:hover {
    background-color: #ea6e4d;
  }
}
</style>
