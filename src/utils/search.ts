import fetchJSONP from 'fetch-jsonp'
// import axios from 'axios'

interface EngineData {
  name: string
  icon: string
  url: string
  getSuggests: (arg0: string, arg1: (data: string[]) => void) => void
}

function baiduSuggests (text: string, callback: (data: string[]) => void) {
  fetchJSONP(`http://suggestion.baidu.com/su?wd=${text}`, {
    // https://ac.duckduckgo.com/ac/?q=foobar&type=list&callback=jsonCallback&_=1600956892202
    // http://suggestion.baidu.com/su?wd=#content#&cb=window.baidu.sug
    jsonpCallback: 'cb' // 默认callback，改为cb
  })
    .then(response => response.json())
    .then(data => {
      const result: string[] = data.s
      callback(result)
    })
}

const engines: EngineData[] = [
  {
    name: '必应',
    icon: 'Bing',
    url: 'https://www.bing.com/search?q=',
    getSuggests: (text, callback) => {
      fetchJSONP(`https://api.bing.com/qsonhs.aspx?type=cb&q=${text}`, {
        jsonpCallback: 'cb' // 默认callback，改为cb
      })
        .then(response => response.json())
        .then(data => {
          const theAS = data.AS
          const result: string[] = []
          if (!theAS.FullResults) return
          for (const i of theAS.Results) {
            for (const j of i.Suggests) {
              result.push(j.Txt)
            }
          }
          callback(result)
        })
    }
  },
  {
    name: 'Google',
    icon: 'Google',
    url: 'https://www.google.com/search?q=',
    getSuggests: (text, callback) => {
      fetchJSONP(`http://suggestqueries.google.com/complete/search?client=youtube&q=${text}`, {
        jsonpCallback: 'jsonp' // 默认callback，改为cb
      })
        .then(response => response.json())
        .then(data => {
          const result: string[] = []
          if (data.length < 2 || !data[1].length) return
          for (const i of data[1]) {
            result.push(i[0])
          }
          callback(result)
        })
    }
  },
  {
    name: 'DuckDuckGo',
    icon: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    getSuggests: baiduSuggests
    /*
    getSuggests: (text, callback) => {
      fetchJSONP(`https://api.duckduckgo.com/?q=${text}&format=json`, {
        jsonpCallback: 'cb' // 默认callback，改为cb
      })
        .then(response => response.json())
        .then(data => {
          const result: string[] = []
          for (const i of data) {
            result.push(i.phrase)
          }
          callback(result)
        })
    }
    */
  },
  {
    name: 'Baidu',
    icon: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    getSuggests: baiduSuggests
  },
  {
    name: '小红书',
    icon: 'RedBook',
    url: 'https://www.xiaohongshu.com/search_result?keyword=',
    getSuggests: baiduSuggests
  },
  {
    name: 'Yandex',
    icon: 'Yandex',
    url: 'https://yandex.com/search/?text=',
    getSuggests: baiduSuggests
  },
  {
    name: 'Qwant',
    icon: 'Qwant',
    url: 'https://www.qwant.com/?q=',
    getSuggests: baiduSuggests
  }
]

export { engines }
