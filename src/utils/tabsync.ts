interface TabMessage {
  name: string
  data?: number | string
}

interface CallBack {
  [key: string]: () => void
}

class TabAsync {
  static channelName = 'tab-async'
  private _channel: BroadcastChannel

  callbacks: CallBack = {}
  otherTabCount = 0
  tabId = 0

  constructor () {
    this._channel = new BroadcastChannel(TabAsync.channelName)
    this.postMessage({ name: 'OPEN_TAB' })
    this._channel.onmessage = this.onMessage.bind(this)

    window.onbeforeunload = () => {
      this.destroy()
    }
  }

  postMessage (message: TabMessage) {
    this._channel.postMessage(message)
  }

  isMaster () {
    return this.tabId === 0
  }

  addListener (name: string, callback: () => void) {
    this.callbacks[name] = callback
  }

  becomeMaster () {
    this.postMessage({ name: 'REQUEST_MASTER', data: this.tabId })
    this.tabId = 0
  }

  destroy () {
    this.postMessage({ name: 'CLOASE_TAB', data: this.tabId })
    this._channel.close()
  }

  onMessage (event: MessageEvent) {
    const msg = event.data as TabMessage

    if (msg.name === 'OPEN_TAB') {
      this.tabId += 1
      this.otherTabCount += 1
      this.postMessage({ name: 'EXSIST_TAB' })
      console.log('New tab opened', this.tabId)
    } else if (msg.name === 'CLOASE_TAB') {
      const tabId = msg.data as number
      if (tabId < this.tabId) {
        this.tabId -= 1
      }
      console.log('Tab closed', this.tabId)
      this.otherTabCount -= 1
    } else if (msg.name === 'REQUEST_MASTER') {
      if (this.tabId === 0) {
        this.tabId = msg.data as number
        console.log('Lost master', this.tabId)
      }
    } else if (msg.name === 'EXSIST_TAB') {
      if (this.tabId === 0) {
        this.otherTabCount += 1
      }
    }

    if (this.callbacks[msg.name]) {
      this.callbacks[msg.name]()
    }
  }
}

export default TabAsync
