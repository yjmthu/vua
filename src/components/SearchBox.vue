<template>
  <div id="input">
    <div id="engine-select" class="row-center scrub-backgound" @click="showEngines = !showEngines">
      <SvgIcon :name="currentEngine.icon" size="24px"></SvgIcon>
      <SvgIcon name="Down" size="12px"></SvgIcon>
    </div>
    <div id="search-input-box">
      <input id="search-input" type="search" class="scrub-backgound" @keydown="submitSearch" @input="e => getSuggests(e.target as HTMLInputElement)" placeholder="输入搜索内容" required>
      <i @click="clearInput">
        <SvgIcon name="Clear" size="30px"/>
      </i>
    </div>
    <div id="search-button" class="row-center scrub-backgound" @click="directSearch">
      <SvgIcon name="Magnifier" size="24px"/>
    </div>
    <SuggestBox :suggests="suggests" :selected="selected" v-show="searchInputFocused && hasSuggestions"/>
    <EngineBox :class="`${showEngines ? 'show':'hide'}-pop-y`" :currentEngineIndex=enginesData.currentEngineIndex @setEngineIndex="setEngineIndex"></EngineBox>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SuggestBox from './SuggestBox.vue'
import SvgIcon from './SvgIcon.vue'
import EngineBox from './EngineBox.vue'

import { engines } from '@/utils/search'
import { gotoPage } from '@/utils/public'

@Options({
  components: {
    SuggestBox,
    EngineBox,
    SvgIcon
  },
  props: {
    searchInputFocused: Boolean
  }
})
export default class SearchBox extends Vue {
  suggests = new Array<string>()
  selected = -1
  searchInputFocused!: boolean
  hasSuggestions = false
  showEngines = false
  enginesData = {
    currentEngineIndex: 0
  }

  get currentEngineIndex () {
    return this.enginesData.currentEngineIndex
  }

  set currentEngineIndex (index: number) {
    this.enginesData.currentEngineIndex = index
    this.$emit('engineChanged', this.engineLogoName())
  }

  engineLogoName () {
    return engines[this.enginesData.currentEngineIndex].logo
  }

  get currentEngine () {
    return engines[this.enginesData.currentEngineIndex]
  }

  private loadEngineData () {
    const tmp = localStorage.getItem('enginesData')
    if (tmp) {
      this.enginesData = JSON.parse(tmp)
    }
    this.$emit('engineChanged', this.engineLogoName())
  }

  setEngineIndex (index: number) {
    this.currentEngineIndex = index
    const input = document.getElementById('search-input') as HTMLInputElement | null
    if (input) this.getSuggests(input)
    localStorage.setItem('enginesData', JSON.stringify(this.enginesData))
    this.showEngines = false
  }

  shiftEngine (forward: boolean) {
    if (forward) {
      if (this.currentEngineIndex + 1 >= engines.length) {
        this.currentEngineIndex = 0
      } else {
        ++this.currentEngineIndex
      }
    } else {
      if (this.currentEngineIndex === 0) {
        this.currentEngineIndex = engines.length - 1
      } else {
        --this.currentEngineIndex
      }
    }
    localStorage.setItem('enginesData', JSON.stringify(this.enginesData))
  }

  clearInput () {
    const input = document.getElementById('search-input') as HTMLInputElement | null
    if (!input) return

    input.value = ''
    input.focus()
  }

  mounted (): void {
    this.loadEngineData()

    document.body.addEventListener('click', ev => {
      if (!ev.target) return
      const target = ev.target as HTMLElement
      if (target.id !== 'search-input') {
        if (target.classList.contains('suggest-item')) {
          gotoPage(this.currentEngine.url, target.innerHTML, true)
        }
        this.hasSuggestions = false
      } else {
        const target = ev.target as HTMLInputElement
        this.hasSuggestions = target.value.length !== 0
        this.toggleFocus(true)
        return
      }
      this.toggleFocus(false)
    })
  }

  directSearch () {
    const el = document.getElementById('search-input') as HTMLInputElement | null
    if (el) gotoPage(this.currentEngine.url, el.value, false)
  }

  toggleFocus (on: boolean) {
    if (!on) {
      this.selected = -1
    }
    if (on === this.searchInputFocused) return
    this.$emit('searchInputFocus', on)
  }

  submitSearch (event: KeyboardEvent) {
    if (!event.target) return
    const target = event.target as HTMLInputElement
    if (event.key === 'Tab') {
      this.shiftEngine(!event.shiftKey)
      this.getSuggests(target)
      event.preventDefault()
    }
    if (target.value.length === 0) {
      return
    }
    switch (event.key) {
      case 'Enter':
        if (this.selected !== -1 && this.selected < this.suggests.length) {
          gotoPage(this.currentEngine.url, this.suggests[this.selected], true)
        } else {
          gotoPage(this.currentEngine.url, target.value, true)
        }
        break
      case 'ArrowUp':
        if (this.suggests.length > 0) {
          if (this.selected - 1 < 0) {
            this.selected = this.suggests.length - 1
          } else {
            --this.selected
          }
          target.value = this.suggests[this.selected]
        }
        break
      case 'ArrowDown':
        if (this.suggests.length > 0) {
          if (this.selected + 1 >= this.suggests.length) {
            this.selected = 0
          } else {
            ++this.selected
          }
          target.value = this.suggests[this.selected]
        }
        break
      default:
        // console.log(event.key)
        break
    }
  }

  getSuggests (target: HTMLInputElement) {
    if (!target || target.value.length === 0) {
      this.hasSuggestions = false
      return
    }

    this.currentEngine.getSuggests(target.value, (result: string[]) => {
      this.suggests = result
      this.selected = -1
      if (this.suggests.length) {
        this.hasSuggestions = target.value.length !== 0
      }
    })
  }
}
</script>

<style scoped lang="scss">
#input {
  position: relative;
  display: flex;
  --input-height: 3.5em;
  --engine-box-width: 50px;
  --input-radius: 1.25em;
  height: var(--input-height);

  & > {
    height: 100%;
    box-sizing: border-box;
  }
}

#search-input-box {
  position: relative;
}

#search-input {
  top: 0;
  width: var(--input-width);
  padding: 1em;
  border-left: none;
  border-right: none;
  color: white;
  height: 100%;

  &::-webkit-search-cancel-button {
    display: none;
  }

  &:valid + i {
    scale: 1;
    opacity: 1;
  }

  &::placeholder {
    user-select: none;
  }
}

i {
  position: absolute;
  right: 0;
  top: 50%;
  width: 30px;
  height: 30px;
  transform: translateY(-50%);
  color: gray;
  cursor: pointer;
  scale: 0;
  opacity: 0;
  transform-origin: 50% 0;
  transition-property: opacity, scale;
  transition-duration: .2s;
  transition-timing-function: ease-out;
}

#engine-select {
  cursor: pointer;
  user-select: none;
  width: var(--engine-box-width);
  padding-left: 10px;
  border-right: none;
  border-radius: var(--input-radius) 0 0 var(--input-radius);
  background-color: #ffffff1a;

  &:hover {
    background-color: #ffffff66;
  }
}

#search-button {
  cursor: pointer;
  user-select: none;
  border-left: none;
  width: var(--engine-box-width);
  border-radius: 0 var(--input-radius) var(--input-radius) 0;
  background-color: #99999940;
  justify-content: center;
  color: #056de8;

  &:hover {
    background-color: #99999964;
  }
}
</style>
