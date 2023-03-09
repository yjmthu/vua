<template>
  <div id="input">
    <div>
      <input id="search-input" type="search" @keydown="submitSearch" @input="getSuggests">
      <svg @click="directSearch" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"></path>
      </svg>
    </div>
    <SuggestBox :suggests="suggests" :selected="selected" v-show="focused"/>
  </div>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import SuggestBox from './SuggestBox.vue'
import fetchJSONP from 'fetch-jsonp'

import { gotoPage } from '@/utils/public'

@Options({
  components: {
    SuggestBox
  }
})
export default class SearchBox extends Vue {
  suggests = new Array<string>()
  selected = -1
  focused = false

  // bingApi = axios.create({
  //   baseURL: '/bing',
  //   timeout: 2000
  // })

  mounted (): void {
    document.body.addEventListener('click', ev => {
      if (!ev.target) return
      const target = ev.target as HTMLElement
      if (target.id !== 'search-input') {
        if (target.classList.contains('suggest-item')) {
          gotoPage(target.innerHTML, true)
        }
        this.toggleSuggests(false)
      } else {
        const target = ev.target as HTMLInputElement
        this.toggleSuggests(target.value.length !== 0)
      }
    })
  }

  directSearch () {
    const el = document.getElementById('search-input') as HTMLInputElement | null
    if (el) gotoPage(el.value, false)
  }

  toggleSuggests (on: boolean) {
    if (on) {
      this.focused = true
    } else {
      this.focused = false
      this.selected = -1
    }
  }

  submitSearch (event: KeyboardEvent) {
    if (!event.target) return
    const target = event.target as HTMLInputElement
    if (target.value.length === 0) return
    switch (event.key) {
      case 'Enter':
        if (this.selected !== -1 && this.selected < this.suggests.length) {
          gotoPage(this.suggests[this.selected], true)
        } else {
          gotoPage(target.value, true)
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

  getSuggests (event: Event): void {
    if (!event.target) return
    const target = event.target as HTMLInputElement
    if (target.value.length === 0) {
      this.toggleSuggests(false)
      return
    }
    fetchJSONP(`https://api.bing.com/qsonhs.aspx?type=cb&q=${target.value}`, {
      jsonpCallback: 'cb' // 默认callback，改为cb
    })
      .then(response => response.json())
      .then(data => {
        const theAS = data.AS
        this.suggests = []
        this.selected = -1
        if (theAS.FullResults) {
          for (const i of theAS.Results) {
            for (const j of i.Suggests) {
              this.suggests.push(j.Txt)
            }
          }
          this.toggleSuggests(target.value.length !== 0)
        } else {
          console.log('空的搜索建议', data.AS)
        }
      })
  }
}
</script>

<style scoped lang="scss">
#input, input {
  position: relative;
}

input {
  box-sizing: border-box;
  width: 544px;
  /* height: 2.5em; */
  padding: 1em 4em 1em 1.25em;
  border-radius: 1.25em;
  border: none;
  color: white;
  background-color: transparent;
  backdrop-filter: blur(5px);
  outline: none;
  border: 2px solid rgba(200, 200, 200, 0.5);
}

@media screen and (max-width: 720px) {
  input {
    width: 320px;
  }
}

svg {
  cursor: pointer;
  position: absolute;
  right: 13px;
  top: 50%;
  width: 24px;
  height: 24px;
  color: white;
  transform: translateY(-50%);
}
</style>
