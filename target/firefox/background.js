// Check if the extension has permission to access a given URL
function checkPermission(url) {
  return browser.permissions.contains({
    origins: [url]
  });
}

// Request permission from the user to access a given URL
function requestPermission(url) {
  return browser.permissions.request({
    origins: [url]
  });
}

// Perform a cross-origin request to a given URL
function crossOriginRequest(url) {
  // First check if we have permission
  checkPermission(url).then((hasPermission) => {
    if (hasPermission) {
      // We have permission, so we can fetch the URL directly
      fetch(url).then((response) => {
        // Do something with the response
      });
    } else {
      // We don't have permission, so we need to request it
      requestPermission(url).then((granted) => {
        if (granted) {
          // The user granted permission, so we can fetch the URL now
          fetch(url).then((response) => {
            // Do something with the response
          });
        } else {
          // The user denied permission, so we can't fetch the URL
          // Maybe show an error message or a fallback option
        }
      });
    }
  });
}

const urls = [
  "https://api.bing.com/*",
  "https://suggestqueries.google.com/*",
  "https://duckduckgo.com/*",
  "https://suggestion.baidu.com/*",
  "https://edith.xiaohongshu.com/*",
  "https://suggest.yandex.com/suggest-ff.cgi*",
  "https://en.wikipedia.org/w/api.php*",
  "https://kaifa.baidu.com/rest/v1/recommend/suggests*",
  "https://s.search.bilibili.com/main/suggest*",
  "https://scholar.google.com/*"
]

urls.forEach(crossOriginRequest)
