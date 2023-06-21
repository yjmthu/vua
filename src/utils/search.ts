import axios from 'axios'
import fetchJSONP from 'fetch-jsonp'

// const forbidCors = true
const forbidCors = false

/* eslint-disable */

interface EngineData {
  name: string
  icon: string
  url: string
  getSuggests: (arg0: string, arg1: (data: string[]) => void) => void
}

function baiduSuggests (text: string, callback: (data: string[]) => void) {
  fetchJSONP(`https://suggestion.baidu.com/su?wd=${text}`, {
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
    getSuggests: forbidCors ? (text, callback) => {
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
    } : (text, callback) => {
      axios.get(`https://api.bing.com/qsonhs.aspx?q=${text}`)
        .then(response => {
          const theAS = response?.data?.AS
          if (!theAS || !theAS.FullResults) return

          const result: string[] = []
          for (const i of theAS.Results) {
            for (const j of i.Suggests) {
              result.push(j.Txt)
            }
          }
          callback(result)
        }, error => {
          console.log('Bing Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Google',
    icon: 'Google',
    url: 'https://www.google.com/search?q=',
    getSuggests: forbidCors ? (text, callback) => {
      fetchJSONP(`https://suggestqueries.google.com/complete/search?client=youtube&q=${text}`, {
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
    } : (text, callback) => {
      axios.get(`https://suggestqueries.google.com/complete/search?client=chrome&q=${text}`)
        .then(response => {
          const data = response?.data
          if (!data || data.length < 2 || !data[1].length) return
          callback(data[1])
        }, error => {
          console.log('Google Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'DuckDuckGo',
    icon: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    // getSuggests: baiduSuggests
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      axios.get(`https://duckduckgo.com/ac/?q=${text}&kl=wt-wt`)
        .then(response => {
          const data = response.data
          const result: string[] = []
          for (const i of data) {
            result.push(i.phrase)
          }
          callback(result)
        }, error => {
          console.log('DuckDuckGo Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Baidu',
    icon: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      axios.get(`https://suggestion.baidu.com/su?action=opensearch&wd=${text}`)
        .then(response => {
          const data = response?.data[1]
          if (!data) return
          callback(data)
        }, error => {
          console.log('Baidu Suggests Error:', error.message)
        })
    }
  },
  {
    name: '小红书',
    icon: 'RedBook',
    url: 'https://www.xiaohongshu.com/search_result?keyword=',
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      axios.get(`https://edith.xiaohongshu.com/api/sns/web/v1/sug/recommend?keyword=${text}`)
        .then(response => {
          const data = response?.data?.data?.sug_items
          if (!data) return
          const result: string[] = []
          for (const item of data) {
            result.push(item.text)
          }
          callback(result)
        }, error => {
          console.log('Yandex Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Yandex',
    icon: 'Yandex',
    url: 'https://yandex.com/search/?text=',
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      axios.get(`https://suggest.yandex.com/suggest-ff.cgi?part=${text}&uil=en&v=3&sn=5`)
        .then(response => {
          const data = response.data
          if (!data || data.length < 2) return
          callback(data[1])
        }, error => {
          console.log('Yandex Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Qwant',
    icon: 'Qwant',
    url: 'https://www.qwant.com/?q=',
    getSuggests: (text, callback) => {
      axios.get(`https://api.qwant.com/v3/suggest?q=${text}&locale=en_US&version=2`)
        .then(response => {
          const data = response.data.data.items
          if (!data) return
          const result: string[] = []
          for (const item of data) {
            result.push(item.value)
          }
          callback(result)
        }, error => {
          console.log('Qwant Suggests Error:', error.message)
        })
    }
  },
  {
    name: '知乎',
    icon: 'ZhiHu',
    url: 'https://www.zhihu.com/search?type=content&q=',
    getSuggests: (text, callback) => {
      axios.get(`https://www.zhihu.com/api/v4/search/suggest?q=${text}`)
        .then(response => {
          const data = response.data.suggest
          const result: string[] = []
          for (const key in data) {
            result.push(data[key].query)
          }
          callback(result)
        }, error => {
          console.log('ZhiHu Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Wikipedia',
    icon: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Special:Search?search=',
    getSuggests: forbidCors ? (text, callback) => {
      fetchJSONP(`https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrsearch=${text}`, {
        jsonpCallback: 'callback' // 默认callback，改为cb
      })
        .then(response => response.json())
        .then(data => {
          const result: string[] = []
          data = data.query
          if (!data || !data.pages) return
          data = data.pages
          for (const i in data) {
            result.push(data[i].title)
          }
          callback(result)
        })
    } : (text, callback) => {
      axios.get(`https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrsearch=${text}`)
        .then(response => {
          const result: string[] = []
          const data = response?.data?.query?.pages
          if (!data) return
          for (const i in data) {
            result.push(data[i].title)
          }
          callback(result)
        }, error => {
          console.log('Wikipedia Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'GitHub',
    icon: 'GitHub',
    url: 'https://github.com/search?type=repositories&q=',
    // getSuggests: baiduSuggests // https://kaifa.baidu.com/rest/v1/recommend/suggests?wd=rust
    getSuggests: forbidCors ? baiduSuggests: (text, callback) => {
      axios.get(`https://kaifa.baidu.com/rest/v1/recommend/suggests?wd=${text}`)
        .then(response => {
          const data = response.data.data
          if (data && data.length) callback(data)
        }, error => {
          console.log('GitHub Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'BiliBili',
    icon: 'BiliBili',
    url: 'https://search.bilibili.com/all?keyword=',
    getSuggests: forbidCors ? baiduSuggests: (text, callback) => {
      axios.get(`https://s.search.bilibili.com/main/suggest?func=suggest&suggest_type=accurate&term=${text}`)
        .then(response => {
          const result: string[] = []
          const data = response.data
          for (const key in data) {
            result.push(data[key].name)
          }
          callback(result)
        }, error => {
          console.log('BiliBili Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Scholar',
    icon: 'GoogleScholar',
    url: 'https://scholar.google.com/scholar?q=',
    getSuggests: (text, callback) => {
      axios.get(`https://scholar.google.com/scholar_complete?q=${text}`)
        .then(response => {
          const data = response.data.l
          if (data && data.length) callback(data)
        }, error => {
          console.log('Google Scholar Suggests Error:', error.message)
        })
    }
  }
]

export { engines }
