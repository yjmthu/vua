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
      app.style.backgroundImage = 'url(https://cloud.tsinghua.edu.cn/f/40adf3c5aaee4fd6ac77/?dl=1)'
      return
    }
    const images = [
      // 'https://w.wallhaven.cc/full/9m/wallhaven-9mjoy1.png',
      'https://w.wallhaven.cc/full/v9/wallhaven-v92563.jpg',
      'https://w.wallhaven.cc/full/7p/wallhaven-7pm73y.png',
      'https://w.wallhaven.cc/full/9d/wallhaven-9dep2k.png',
      'https://w.wallhaven.cc/full/yx/wallhaven-yxwoml.jpg',
      'https://w.wallhaven.cc/full/jx/wallhaven-jxr75p.png',
      'https://w.wallhaven.cc/full/3l/wallhaven-3lg8g9.jpg',
      'https://w.wallhaven.cc/full/m3/wallhaven-m3r6w1.jpg',
      'https://w.wallhaven.cc/full/3z/wallhaven-3z87dv.jpg',
      'https://w.wallhaven.cc/full/k7/wallhaven-k7jyom.jpg',
      'https://w.wallhaven.cc/full/1k/wallhaven-1kqd71.jpg',
      'https://w.wallhaven.cc/full/9m/wallhaven-9mkgr1.png'
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
    // background-image: url(https://cloud.tsinghua.edu.cn/f/40adf3c5aaee4fd6ac77/?dl=1);
    --icon-size: 48px;
    --icon-row-size: 300px;
    --input-width: 200px;
    --engine-icon-gap: 1px;
  }
}
</style>
