<template>
  <form id="config-box" class="center" ref="form">
    <div>
      <span>名称</span>
      <input type="text" name="name">
    </div>
    <div>
      <span>链接</span>
      <input type="url" name="url">
    </div>
    <div>
      <button type="button" @click="cancelConfig">取消</button>
      <button type="button" @click="confirmConfig">确定</button>
    </div>
  </form>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'

@Options({
})
export default class BookmarkEdit extends Vue {
  confirmConfig () {
    // configBoxDom.style.visibility = 'hidden'
    const formData = new FormData(this.$refs.form as HTMLFormElement)
    const name = formData.get('name')
    const url = formData.get('url')
    if (name && url) {
      this.$emit('addFavorite', {
        name, url
      })
    }
    this.$emit('bookmarkEdit', false)
  }

  cancelConfig () {
    this.$emit('bookmarkEdit', false)
  }
}
</script>

<style scoped lang="scss">
#config-box {
  padding: 12px;
  border-radius: 6px;
  background-color: aquamarine;

  & > * {
    padding: 4px 8px;

    & > * {
      margin: 2px 4px;
    }
  }
}
</style>
