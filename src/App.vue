<template>
  <!-- <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </nav> -->
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
  // mounted (): void {
  //   this.$router.push({ path: '/' })
  // }
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

  background-image: url(https://source.unsplash.com/random);
  background-size: cover;
  background-position: center;
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
    background-image: url(https://cloud.tsinghua.edu.cn/f/40adf3c5aaee4fd6ac77/?dl=1);
  }
}
</style>
