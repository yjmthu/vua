// let db: IDBDatabase | null = null

interface BackImage {
  url: string
  blob: Blob
}

class HugeStorage {
  databaseName = 'imageDB'
  version = 1
  db!: IDBDatabase
  storeName!: string
  keyPath = 'url'

  constructor (storeName: string) {
    this.storeName = storeName
  }

  openIndexedDB () {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version)

      request.onupgradeneeded = (event) => {
        const target = event.target as IDBOpenDBRequest
        const db = target.result as IDBDatabase
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.log('Creating object store')
          const store = db.createObjectStore(this.storeName, { keyPath: this.keyPath })
          store.createIndex(this.keyPath, this.keyPath, { unique: true })
        }
        resolve(db)
      }

      request.onsuccess = (event) => {
        const target = event.target as IDBOpenDBRequest
        resolve(target.result)
      }

      request.onerror = function () {
        reject(new Error('为什么不允许我的 web 应用使用 IndexedDB！'))
      }
    })
  }

  async getStore () {
    if (this.db === undefined) {
      this.db = await this.openIndexedDB()
    }
    return this.db.transaction([this.storeName], 'readwrite').objectStore(this.storeName)
  }

  async addUrl (url: string): Promise<Blob | null> {
    // this.getAllIdFromIndexedDB((urls) => {
    //   if (urls.includes(url)) {
    //     this.getDataFromIndexedDB(url, callback)
    //     return
    //   }
    //   this.clearIndexedDB(() => {
    //     this.saveToIndexedDB(url, callback)
    //   })
    // })

    const urls = await this.getAllKeyFromIndexedDB()
    if (urls.includes(url)) {
      return this.getDataFromIndexedDB(url)
    }

    await this.clearIndexedDB()
    return this.saveToIndexedDB(url)
  }

  async saveToIndexedDB (url: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    const store = await this.getStore()
    if (!store) return blob
    const imageEntry: BackImage = { blob, url }
    const request = store.put(imageEntry)
    return await new Promise<Blob>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(blob)
      }

      request.onerror = () => {
        reject(new Error('Failed to save data to indexedDB'))
      }
    })
  }

  async removeFromIndexedDB (id: string) {
    const store = await this.getStore()
    if (!store) return
    const request = store.delete(id)
    return await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to remove data from indexedDB'))
      }
    })
  }

  async getDataFromIndexedDB (key: string): Promise<Blob | null> {
    const store = await this.getStore()
    if (!store) return null

    return await new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = (event) => {
        const target = event.target as IDBRequest
        resolve(target.result.blob)
      }

      request.onerror = () => {
        reject(new Error('Failed to get data from indexedDB'))
      }
    })
  }

  async getAllKeyFromIndexedDB () {
    const store = await this.getStore()
    if (!store) {
      console.log('无法打卡本地store!')
      return []
    }
    return await new Promise<string[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = (event) => {
        const target = event.target as IDBRequest
        resolve(target.result.map((item: BackImage) => item.url))
      }
      request.onerror = () => {
        reject(new Error('Failed to get all id from indexedDB'))
      }
    })
  }

  async clearIndexedDB () {
    const store = await this.getStore()
    if (!store) return
    return await new Promise<void>((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to clear indexedDB'))
      }
    })
  }

  // const imageUrl = 'path/to/your/image.jpg'
  // const imageId = 'image1'

  // // 保存图片到IndexedDB
  // saveImageToIndexedDB(imageUrl, imageId)

  // // 从IndexedDB获取图片
  // getImageFromIndexedDB(imageId).then(blob => {
  //   const imgElement = document.createElement('img')
  //   imgElement.src = URL.createObjectURL(blob)
  //   document.body.appendChild(imgElement) // 将图片添加到页面中
  // })
}

export default HugeStorage
