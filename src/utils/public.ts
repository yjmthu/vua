const regex = /^(?:(http|https|ftp):\/\/)((?:[\w-]+\.)+[a-z0-9]+)((?:\/[^/?#]*)+)?(\?[^#]+)?(#.+)?$/i

function gotoPage (text: string, smart: boolean) {
  const url = `http://${text}`
  let href = null
  if (regex.test(text)) {
    href = text
  } else if (smart && regex.test(url)) {
    href = url
  } else {
    href = `https://cn.bing.com/search?q=${text}`
  }

  if (href) {
    // window.location.href = href
    window.open(href)
  }
}

export { gotoPage }
