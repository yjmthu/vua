import axios from 'axios'

interface FavoriteBookmark {
  name: string
  url: string
}

interface DirectLink {
  name: string
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

interface SyncData {
  favorite: FavoriteBookmark[]
  bookmark: chrome.bookmarks.BookmarkTreeNode
  directLinks: DirectLink[] | null
}

async function checkBookmark (sync: BookmarkSync) {
  // https://cloud.seafile.com/api2/repos/{repo-id}/file/detail/?p=/foo.c
  // Get File Detail
  const link = `${sync.host}/api2/repos/${sync.repoId}/file/detail/?p=${encodeURIComponent(sync.folder + '/' + sync.fileName)}`
  const res = await axios.get(link)
  return (res?.data && res.data?.type === 'file')
}

async function uploadBookmark (syncData: string, sync: BookmarkSync, overwrite: boolean) {
  // https://cloud.seafile.com/api2/repos/{repo-id}/upload-link/?p=/upload-dir
  // Get Upload Link
  const link = `${sync.host}/api2/repos/${sync.repoId}/upload-link/?p=${encodeURIComponent(sync.folder)}`
  const uploadLink = (await axios.get(link))?.data
  if (!uploadLink) throw new Error('无法获取上传链接！')
  const data = new FormData()
  const fileName = sync.fileName
  data.append('file', new Blob([syncData], { type: 'application/json' }), fileName)
  data.append('parent_dir', sync.folder)
  data.append('replace', overwrite ? '1' : '0')

  const res2 = await axios.post(uploadLink, data)
  if (!res2.data) throw new Error('上传文件失败！')
}

async function downloadBookmark (sync: BookmarkSync): Promise<SyncData> {
  // https://cloud.tsinghua.edu.cn/lib/ecf780d7-98ca-48ce-abf0-290cab3abece/file/{folder}/vua.bookmarks.json?dl=1

  // Get File Download Link
  const nameList = `${sync.folder}/${sync.fileName}`.split('/')
  const p = nameList.map((name) => encodeURIComponent(name)).join('/')

  const link = `${sync.host}/lib/${sync.repoId}/file${p}?dl=1`
  const res = await axios.get(link)
  if (res.status === 200) {
    return res.data
  } else {
    throw new Error('状态码错误！')
  }
}

export { FavoriteBookmark, BookmarkSync, DirectLink, checkBookmark, uploadBookmark, downloadBookmark }
