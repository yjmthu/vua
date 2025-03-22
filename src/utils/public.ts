const regex = /^(?:(http|https|ftp):\/\/)((?:[\w-]+\.)+[a-z0-9]+)((?:\/[^/?#]*)+)?(\?[^#]+)?(#.+)?$/i

function gotoPage (text: string, callback: (text: string) => string) {
  window.open(callback(encodeURIComponent(text)))
}

function smartGotoPage (text: string, callback: (text: string) => string) {
  if (regex.test(text)) {
    window.open(text)
  } else {
    window.open(callback(encodeURIComponent(text)))
  }
}

export { gotoPage, smartGotoPage }
