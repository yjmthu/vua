import axios from 'axios'

interface Bookmark {
  name: string
  url?: string
  icon?: string
  color?: string
}

interface FilePosition {
  host: string
  repoId: string
  folder: string
  fileName: string
}

interface FileDetail {
  // eslint-disable-next-line camelcase
  last_modifier_name: string
  // eslint-disable-next-line camelcase
  uploader_email: string
  // eslint-disable-next-line camelcase
  upload_time: string
  name: string
  permission: string
  // eslint-disable-next-line camelcase
  uploader_name: string
  // eslint-disable-next-line camelcase
  uploader_contact_email: string
  // eslint-disable-next-line camelcase
  last_modified: string
  mtime: number
  starred: boolean
  size: number
  type: string
  id: string
  // eslint-disable-next-line camelcase
  last_modifier_email: string
  // eslint-disable-next-line camelcase
  last_modifier_contact_email: string
}

/*
{
    "last_modifier_name": "\u8d85\u7ba1",
    "uploader_email": "03e7957e09ee43d9b57c9b2b4c741668@ifile.com",
    "upload_time": "2018-07-11T05:14:20+08:00",
    "name": "1.md",
    "permission": "rw",
    "uploader_name": "\u8d85\u7ba1",
    "uploader_contact_email": "03e7957e09ee43d9b57c9b2b4c741668@ifile.com",
    "last_modified": "2018-07-16T15:03:56+08:00",
    "mtime": 1531724636,
    "starred": false,
    "size": 2,
    "type": "file",
    "id": "86dd07538e51f8d437ecc25d9a48250041fef5a0",
    "last_modifier_email": "03e7957e09ee43d9b57c9b2b4c741668@ifile.com",
    "last_modifier_contact_email": "03e7957e09ee43d9b57c9b2b4c741668@ifile.com"
}
*/

// interface WallpaperData {
//   url: string
//   color: string
// }

interface SyncData {
  favorite: Bookmark[]
  bookmark: chrome.bookmarks.BookmarkTreeNode
  directLinks: Bookmark[] | null
  wallpaper?: string | null
}

async function getFileDetail (position: FilePosition): Promise<FileDetail | null> {
  // https://cloud.seafile.com/api2/repos/{repo-id}/file/detail/?p=/foo.c
  // Get File Detail
  const link = `${position.host}/api2/repos/${position.repoId}/file/detail/?p=${encodeURIComponent(position.folder + '/' + position.fileName)}`
  const res = await axios.get(link)
  return res?.data as FileDetail | null
}

async function uploadBookmark (fileContent: string, position: FilePosition, overwrite: boolean): Promise<boolean> {
  // https://cloud.seafile.com/api2/repos/{repo-id}/upload-link/?p=/upload-dir
  // Get Upload Link
  const link = `${position.host}/api2/repos/${position.repoId}/upload-link/?p=${encodeURIComponent(position.folder)}`
  const uploadLink = (await axios.get(link))?.data
  if (!uploadLink) {
    console.error('获取上传链接失败！')
    return false
  }
  const data = new FormData()
  const fileName = position.fileName
  data.append('file', new Blob([fileContent], { type: 'application/json' }), fileName)
  data.append('parent_dir', position.folder)
  data.append('replace', overwrite ? '1' : '0')

  const res2 = await axios.post(uploadLink, data)
  if (res2.status !== 200 || !res2.data) {
    console.error('上传文件失败！')
    return false
  }
  return true
}

async function downloadFile (position: FilePosition): Promise<SyncData | null> {
  // https://cloud.tsinghua.edu.cn/lib/ecf780d7-98ca-48ce-abf0-290cab3abece/file/{folder}/vua.bookmarks.json?dl=1

  // Get File Download Link
  const nameList = `${position.folder}/${position.fileName}`.split('/')
  const p = nameList.map((name) => encodeURIComponent(name)).join('/')

  const link = `${position.host}/lib/${position.repoId}/file${p}?dl=1`
  const res = await axios.get(link)
  if (res.status === 200) {
    return res.data
  }
  console.error('Download File Failed!')
  return null
}

export { FileDetail, FilePosition, Bookmark, getFileDetail, uploadBookmark, downloadFile }
