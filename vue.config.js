const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const CopyWebpackPlugin = require("copy-webpack-plugin")
function resolve (dir) {
  return path.join(__dirname, dir)
}

const useFirefox = false

const firefoxFiles = [
  {
    from: path.resolve('target/firefox/manifest.json'),
    to: `${path.resolve('dist')}/manifest.json`
  },
  {
    from: path.resolve('target/firefox/background.js'),
    to: `${path.resolve('dist')}/background.js`
  },
]

const chromiumFiles = [
  {
    from: path.resolve('target/chromium/manifest.json'),
    to: `${path.resolve('dist')}/manifest.json`
  },
]

const copyFiles = [
  {
    from: path.resolve('target/shared/icons'),
    to: `${path.resolve('dist')}/icons`
  },
  // {
  //   from: path.resolve('target/shared/sample_rules.json'),
  //   to: `${path.resolve('dist')}/sample_rules.json`
  // },
].concat(useFirefox ? firefoxFiles: chromiumFiles)

// 复制插件
const plugins = [
   new CopyWebpackPlugin({
     patterns: copyFiles
   })
];

// 页面文件
// const pages = {
//   'app': {
//     entry: "src/main.ts",
//     template: 'public/index.html',
//     filename: 'app.html'
//   }
// };

module.exports = defineConfig({
  configureWebpack: {
    plugins
  },
  publicPath: '/',
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
