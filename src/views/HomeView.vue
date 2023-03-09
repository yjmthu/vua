<template>
  <div id="main">
    <div id="logo" @click="toggleFavrotite"></div>
    <SearchBox/>
    <FavoriteBox v-show="showFavorite" @toggleVisbility="toggleFavrotite"/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
// import HelloWorld from '@/components/HelloWorld.vue' // @ is an alias to /src
import SearchBox from '@/components/SearchBox.vue'
import FavoriteBox from '@/components/FavoriteBox.vue'

@Options({
  components: {
    SearchBox,
    FavoriteBox
  }
})
export default class HomeView extends Vue {
  showFavorite = false

  toggleFavrotite () {
    this.showFavorite = !this.showFavorite
  }
}
</script>

<style scoped lang="scss">
#logo {
  width: 360px;
  height: 60px;
  margin-bottom: 16px;
  background-image: url(../assets/icons/microsoft.svg);
  background-size: cover;
  background-position: center;
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
    margin-bottom: 10px;
  }
}
</style>
