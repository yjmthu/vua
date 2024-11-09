<template>
  <div id="main">
    <div id="logo" ref="logo" @click="toggleFavrotite"></div>
    <DirectLinks ref="directLinks"
      :tabAsync="tabAsync"/>
    <SearchBox
      @engineChanged="changeEngineLogo"/>
    <FavoriteBox v-show="showFavorite"
      :tabAsync="tabAsync"
      @toggleVisbility="toggleFavrotite" @updateDirectLinks="updateDirectLinks"/>
    <SideBar></SideBar>
  </div>
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

@media screen and (max-width: 720px) {
  #logo {
    width: 210px;
    height: 35px;
    margin-bottom: 16px;
  }
}
</style>
