import axios from 'axios'
import fetchJSONP from 'fetch-jsonp'

// Whether to prohibit cross-domain.
// const forbidCors = true
const forbidCors = false

let controller: AbortController | undefined

/* eslint-disable */

interface EngineData {
  name: string
  icon: string
  logo: string
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
    logo: 'microsoft',
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
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://api.bing.com/qsonhs.aspx?q=${text}`, { signal: controller.signal })
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
    logo: 'google',
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
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://suggestqueries.google.com/complete/search?client=chrome&q=${text}`, { signal: controller.signal })
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
    logo: 'duckduckgo',
    url: 'https://duckduckgo.com/?q=',
    // getSuggests: baiduSuggests
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://duckduckgo.com/ac/?q=${text}&kl=wt-wt`, { signal: controller.signal })
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
    logo: 'baidu',
    url: 'https://www.baidu.com/s?wd=',
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://suggestion.baidu.com/su?action=opensearch&wd=${text}`, { signal: controller.signal })
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
    name: '豆瓣电影',
    icon: 'Douban',
    logo: 'douban',
    url: 'https://search.douban.com/movie/subject_search?search_text=',
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://movie.douban.com/j/subject_suggest?q=${text}`, { signal: controller.signal })
        .then(response => {
          const data = response?.data as []
          if (!data) return
          callback(data.map(item => item['title']))
        }, error => {
          console.log('Douban Suggests Error:', error.message)
        })
    }
  },
  {
    name: 'Yandex',
    icon: 'Yandex',
    logo: 'yandex',
    url: 'https://yandex.com/search/?text=',
    getSuggests: forbidCors ? baiduSuggests : (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://suggest.yandex.com/suggest-ff.cgi?part=${text}&uil=en&v=3&sn=5`, { signal: controller.signal })
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
    logo: 'qwant',
    url: 'https://www.qwant.com/?q=',
    getSuggests: (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://api.qwant.com/v3/suggest?q=${text}&locale=en_US&version=2`, { signal: controller.signal })
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
    logo: 'zhihu',
    url: 'https://www.zhihu.com/search?type=content&q=',
    getSuggests: (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://www.zhihu.com/api/v4/search/suggest?q=${text}`, { signal: controller.signal })
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
    logo: 'wikipedia',
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
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrsearch=${text}`, { signal: controller.signal })
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
    logo: 'github',
    url: 'https://github.com/search?type=repositories&q=',
    // getSuggests: baiduSuggests // https://kaifa.baidu.com/rest/v1/recommend/suggests?wd=rust
    getSuggests: forbidCors ? baiduSuggests: (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://kaifa.baidu.com/rest/v1/recommend/suggests?wd=${text}`, { signal: controller.signal })
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
    logo: 'bilibili',
    url: 'https://search.bilibili.com/all?keyword=',
    getSuggests: forbidCors ? baiduSuggests: (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://s.search.bilibili.com/main/suggest?func=suggest&suggest_type=accurate&term=${text}`, { signal: controller.signal })
        .then(response => {
          const result: string[] = []
          const data = response.data?.result?.tag
          if (!data) {
            console.log(data)
            return
          }
          for (const item of data) {
            result.push(item.value)
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
    logo: 'scholar',
    url: 'https://scholar.google.com/scholar?q=',
    getSuggests: (text, callback) => {
      controller?.abort()
      controller = new AbortController()
      axios.get(`https://scholar.google.com/scholar_complete?q=${text}`, { signal: controller.signal })
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
