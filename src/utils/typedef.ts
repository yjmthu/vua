import axios from 'axios'

interface Bookmark {
  name: string
  url: string
}

interface FavoriteLink {
  text: string
  url: string
  icon: string
  color: string
}

interface BookmarkSync {
  host: string
  repoId: string
  folder: string
  fileName: string
}

function checkBookmark (sync: BookmarkSync, callback: (exsist: boolean) => void) {
  // https://cloud.seafile.com/api2/repos/{repo-id}/file/detail/?p=/foo.c
  // Get File Detail
  const link = `${sync.host}/api2/repos/${sync.repoId}/file/detail/?p=${encodeURIComponent(sync.folder + '/' + sync.fileName)}`
  axios.get(link).then((res) => {
    callback(res.data && res.data.type === 'file')
  }).catch((err) => {
    const result = false
    callback(result)
    console.log(err)
  })
}

function uploadBookmark (bookmarks: string, sync: BookmarkSync, overwrite: boolean) {
  // https://cloud.seafile.com/api2/repos/{repo-id}/upload-link/?p=/upload-dir
  // Get Upload Link
  const link = `${sync.host}/api2/repos/${sync.repoId}/upload-link/?p=${encodeURIComponent(sync.folder)}`
  axios.get(link).then((res) => {
    const uploadLink = res.data
    if (!uploadLink) return
    const data = new FormData()
    const fileName = sync.fileName
    data.append('file', new Blob([bookmarks], { type: 'application/json' }), fileName)
    data.append('parent_dir', sync.folder)
    data.append('replace', overwrite ? '1' : '0')
    axios.post(uploadLink, data).then((res) => {
      if (!res.data) return
      alert('上传成功！')
    }).catch((err) => {
      console.log(err)
      alert('上传失败！')
    })
  }).catch((err) => {
    console.log(err)
    // error_msg
    alert('无法获取上传文件！')
  })
}

function downloadBookmark (sync: BookmarkSync, callback: (bookmarks: Bookmark[]) => void) {
  // https://cloud.tsinghua.edu.cn/lib/ecf780d7-98ca-48ce-abf0-290cab3abece/file/{folder}/vua.bookmarks.json?dl=1

  // Get File Download Link
  const nameList = `${sync.folder}/${sync.fileName}`.split('/')
  const p = nameList.map((name) => encodeURIComponent(name)).join('/')

  const link = `${sync.host}/lib/${sync.repoId}/file${p}?dl=1`
  axios.get(link).then((res) => {
    if (res.status === 200) callback(res.data)
    else alert('状态码错误！')
  }).catch((err) => {
    console.log(err)
  })
}

export { Bookmark, BookmarkSync, FavoriteLink, checkBookmark, uploadBookmark, downloadBookmark }
