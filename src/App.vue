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
