const { defineConfig } = require('@vue/cli-service')
const path = require('path');
function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = defineConfig({
  publicPath: './',
  // assetsPublicPath: './',
  transpileDependencies: true,
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(
        args => {
          args[0].title = 'Vua导航'
          return args
        }
      )
    //配置 svg-sprite-loader
    const svgPath = 'src/assets/svg'
    // 第一步：让其他 svg loader 不要对 src/assets/icons 进行操作
    config.module
      .rule('svg')
      .exclude.add(resolve(svgPath))  //注意：路径要具体到存放的svg的路径下，不然会报错
      .end()
    // 第二步：使用svg-sprite-loader 对 src/icons 下的svg进行操作
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve(svgPath))    //注意：路径要具体到存放的svg的路径下，不然会报错
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      //定义规则 使用时 <svg class="icon"> <use xlink:href="#icon-svg文件名"></use>  </svg>
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
  }
})
