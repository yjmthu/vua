<template>
  <div class="center">
    <SvgIcon name="XCircle" size="20px" className="close-button" @click="cancelConfig"/>
    <h4><span>书签编辑</span></h4>
    <div>
      <span>名称</span>
      <input type="text" name="name" v-model="temp.name">
    </div>
    <div>
      <span>链接</span>
      <input type="url" name="url" v-model="temp.url">
    </div>
    <div v-if="isDirectLink()">
      <span>图标</span>
      <input type="url" name="icon" v-model="(temp as DirectLink).icon">
    </div>
    <div>
      <button type="button" @click="cancelConfig">取消</button>
      <button type="button" @click="confirmConfig">确定</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SvgIcon from './SvgIcon.vue'
import { FavoriteBookmark, DirectLink } from '@/utils/typedef'

@Options({
  components: {
    SvgIcon
  },
  props: [
    'favorite', 'callback'
  ]
})
export default class BookmarkEdit extends Vue {
  favorite!: FavoriteBookmark | DirectLink | null
  temp: FavoriteBookmark | DirectLink = {
    name: '',
    url: ''
  }

  callback!: (data: FavoriteBookmark | DirectLink | null) => void

  mounted (): void {
    if (this.favorite) {
      this.temp = this.favorite
    }
  }

  isDirectLink () {
    return 'icon' in this.temp
  }

  confirmConfig () {
    this.callback(this.temp)
  }

  cancelConfig () {
    this.callback(null)
  }
}
</script>

<style scoped lang="scss">
div.center {
  color: white;
  width: 260px;
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
  margin: 0;
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
  border-radius: 50%;
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
