<template>
  <svg :class="classList" :style="styleSheet">
    <use :xlink:href="`#icon-${name}`"></use>
  </svg>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'

@Options({
  props: {
    name: String,
    size: {
      type: String,
      default: '20px'
    },
    className: String
  }
})
export default class SvgIcon extends Vue {
  name!: string
  size!: string
  className?: string

  get styleSheet () {
    return {
      width: this.size,
      height: this.size
    }
  }

  get classList () {
    if (this.className) {
      return `${this.className} svg-icon`
    } else {
      return 'svg-icon'
    }
  }
}
</script>

<style scoped lang="scss">
.svg-icon {
  fill: currentColor;
  overflow: hidden;
  color: 'inherit';
}
</style>
