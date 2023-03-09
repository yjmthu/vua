<template>
  <div>
    <ul ref="suggestDOM">
      <li class="suggest-item" :ref="`${index}`" :class="{'selected-item': adjustSelected(index)}" v-for="text, index in suggests" :key="`item-${index}`">{{ text }}</li>
      <i v-if="!suggests.length">没有匹配结果</i>
    </ul>
  </div>
</template>

<script lang="ts">
// import { gotoPage } from '@/utils/public'
import { Options, Vue } from 'vue-class-component'

@Options({
  props: {
    suggests: Array,
    selected: Number
  }
})
export default class SuggestBox extends Vue {
  suggests!: Array<string>
  private selected!: number

  adjustSelected (index: number) {
    if (this.selected !== index) return false
    const els = this.$refs[`${index}`] as HTMLElement[] | null
    if (!els || els.length !== 1) return true
    const el = els[0]

    const suggestDOM = this.$refs.suggestDOM as HTMLElement

    let item = el.offsetTop - suggestDOM.scrollTop
    let box = 0

    if (item < box) {
      suggestDOM.scrollTop -= box - item
      return true
    }

    item += el.offsetHeight
    box += suggestDOM.offsetHeight

    if (item > box) {
      suggestDOM.scrollTop -= box - item
    }

    return true
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
div {
  top: 100%;
  left: 50%;
  width: 85%;
  border-radius: 0 0 10px 10px;
  padding: 8px 10px;
  position: absolute;
  transform: translateX(-50%);
  background-color: transparent;
  backdrop-filter: blur(15px);
}

ul {
  position: relative;
  list-style: none;
  list-style-type: none;
  margin: 0;
  padding: 0;
  max-height: 160px;
  overflow-x: hidden;
  overflow-y: auto;

  & > i {
    background-color: transparent;
    font-size: 7pt;
    color: gray;
    text-align: center;
  }

  & > li {
    /* margin: 2px 4px; */
    padding: 6px 10px;
    border-radius: 4px;
    background-color: transparent;
    color: white;
    text-align: left;

    &:hover, &.selected-item {
      background-color: rgba(200, 200, 200, 0.1);
    }
  }
}

/* li.selected-item {
  background-color: rgba(200, 200, 200, 0.1);
} */

</style>
