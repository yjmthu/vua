<template>
  <div id="main">
    <div id="logo" ref="logo" @click="toggleFavrotite"></div>
    <DirectLinks ref="directLinks"
      :tabAsync="tabAsync"
      @linkChanged="linkChanged"/>
    <SearchBox
      @engineChanged="changeEngineLogo"/>
    <FavoriteBox ref="favoriteBox"
      v-show="showFavorite"
      :tabAsync="tabAsync"
      @showMessage="showMessage"
      @toggleVisbility="toggleFavrotite"
      @updateDirectLinks="updateDirectLinks"/>
    <SideBar></SideBar>
  </div>
  <small v-show="message" :style="{'background-color': messageColor}"> {{ message }}</small>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
// import HelloWorld from '@/components/HelloWorld.vue' // @ is an alias to /src
import SideBar from '@/components/SideBar.vue'
import SearchBox from '@/components/SearchBox.vue'
import FavoriteBox from '@/components/FavoriteBox.vue'
import DirectLinks from '@/components/DirectLinks.vue'
import TabAsync from '@/utils/tabsync'

@Options({
  components: {
    SearchBox,
    FavoriteBox,
    DirectLinks,
    SideBar
  }
})
export default class HomeView extends Vue {
  showFavorite = false
  message = ''
  messageColor = 'black'
  tabAsync = new TabAsync()

  updateDirectLinks () {
    (this.$refs.directLinks as DirectLinks).readDirectLinks()
  }

  toggleFavrotite () {
    this.showFavorite = !this.showFavorite
  }

  changeEngineLogo (logoName: string) {
    // console.log(`changeEngineLogo: ${logoName}`)
    const logo = this.$refs.logo as HTMLElement
    logo.style.backgroundImage = `url(./icons/${logoName}.svg)`
  }

  linkChanged () {
    const favoriteBox = this.$refs.favoriteBox as FavoriteBox
    favoriteBox.uploadBookmarks()
  }

  messageId: number | null = null
  showMessage (message: string, color: string) {
    this.messageColor = color
    this.message = message

    if (this.messageId !== null) {
      clearTimeout(this.messageId)
    }

    this.messageId = setTimeout(() => {
      this.message = ''
      this.messageId = null
    }, 3000)
  }
}
</script>

<style scoped lang="scss">
#logo {
  width: 360px;
  height: 120px;
  margin-bottom: 20px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: bottom;
}

#main {
  position: relative;
  top: -10%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

small {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  padding: 6px 12px;
  margin: 10px;
  line-height: 16px;
  font-size: 14px;
  border-radius: 14px;
  color: white;
}

@media screen and (max-width: 720px) {
  #main {
    top: -15%;
  }
  #logo {
    width: 210px;
    height: 60;
    margin-bottom: 16px;
  }
}
</style>
