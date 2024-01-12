<template>
  <router-view/>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import HomeView from './views/HomeView.vue'

@Options({
  components: {
    HomeView
  }
})
export default class App extends Vue {
  mounted (): void {
    // this.$router.push({ path: '/' })
    const app = document.getElementById('app')
    if (!app) return
    // check if the window's width is less than 720px
    if (window.innerWidth < 720) {
      app.style.backgroundImage = 'url(https://cloud.tsinghua.edu.cn/f/fa29af52426942c88ba5/?dl=1)'
      return
    }
    const images = [
      'https://cloud.tsinghua.edu.cn/f/805e90f9963d4547985a/?dl=1',
      'https://cloud.tsinghua.edu.cn/f/2d9fabd26a7b4163b770/?dl=1',
      'https://cloud.tsinghua.edu.cn/f/cdf726e5d5e44a85982e/?dl=1',
      'https://cloud.tsinghua.edu.cn/f/014e257f8d4d428b98f6/?dl=1',
      'https://cloud.tsinghua.edu.cn/f/80eb15b257574159a9e4/?dl=1',
      'https://cloud.tsinghua.edu.cn/f/9f9b4899305f40cf8d6a/?dl=1',
      'https://cloud.tsinghua.edu.cn/f/542dd08d0a3f40a39970/?dl=1'
    ]
    const random = Math.floor(Math.random() * images.length)
    app.style.backgroundImage = `url(${images[random]})`
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  font-size: 14px;

  position: absolute;
  width: 100%;
  height: 100%;
  background-color: darkslategray;
  display: grid;
  align-items: center;

  // background-image: url(https://source.unsplash.com/random);
  background-size: cover;
  background-position: center;

  --icon-size: 56px;
  --icon-row-size: 620px;
  --input-width: 480px;
  --engine-icon-gap: 18px;
  --side-bar-width: 300px;
  --side-bar-image-width: 256px;
  --side-bar-image-height: 144px;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

@media screen and (max-width: 720px) {
  #app {
    --icon-size: 48px;
    --icon-row-size: 300px;
    --input-width: 200px;
    --engine-icon-gap: 1px;
    --side-bar-width: 240px;
    --side-bar-image-width: 192px;
    --side-bar-image-height: 288px;
  }
}
</style>
