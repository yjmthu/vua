<template>
  <div class="dark-scrub-backgound">
    <ul class="row-center">
      <li v-for="(item, index) in allEngines" :key="index" class="column-center" @click="$emit('setEngineIndex', index)">
        <span>
          <SvgIcon :name="item.icon" size="32px"/>
        </span>
        <small>{{ item.name }}</small>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import SvgIcon from './SvgIcon.vue'
import { engines } from '@/utils/search'

@Options({
  components: {
    SvgIcon
  },
  props: [
    'currentEngineIndex'
  ]
})
export default class EngineBox extends Vue {
  currentEngineIndex!: number

  get allEngines () {
    return engines
  }
}
</script>

<style scoped lang="scss">
div {
  position: absolute;
  user-select: none;
  border-radius: 10px;
  // background-color: bisque;
  top: 110%;
  width: 100%;
  transform-origin: left top;
  transition-property: transform;
  transition-duration: .2s;
}

ul {
  padding-left: 0;
  gap: var(--engine-icon-gap);
  flex-wrap: wrap;
  padding: 2px 10px;
}

li {
  list-style: none;
  padding: 8px 12px;
  border-radius: 10px;
  width: var(--icon-size);
  &:hover {
    background-color: #16171952;
  }
}

span {
  display: block;
  background-color: #1c1c1e80;
  border-radius: 8px;
  width: 42px;
  height: 42px;

  svg {
    margin: 5px;
  }
}

small {
  color: white;
  font-size: 10px;
}
</style>
