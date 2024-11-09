class TabAsync {
  static channelName = 'tab-async'
  channel: BroadcastChannel

  otherTabCount = 0
  tabId = 0

  constructor () {
    this.channel = new BroadcastChannel(TabAsync.channelName)
    this.channel.postMessage('OPEN_TAB')
    this.channel.onmessage = this.onMessage.bind(this)

    window.onbeforeunload = () => {
      this.destroy()
    }
  }

  isMaster () {
    return this.tabId === 0
  }

  becomeMaster () {
    this.channel.postMessage(`MASTER ${this.tabId}`)
    this.tabId = 0
  }

  destroy () {
    this.channel.postMessage(`CLOASE_TAB ${this.tabId}`)
    this.channel.close()
  }

  onMessage (event: MessageEvent) {
    if (event.data === 'OPEN_TAB') {
      this.tabId += 1
      this.otherTabCount += 1
      this.channel.postMessage('EXSIST_TAB')
      console.log('New tab opened', this.tabId)
    } else if (event.data.startsWith('CLOASE_TAB')) {
      const tabId = parseInt(event.data.split(' ')[1])
      if (tabId < this.tabId) {
        this.tabId -= 1
      }
      console.log('Tab closed', this.tabId)
      this.otherTabCount -= 1
    } else if (event.data.startsWith('MASTER')) {
      if (this.tabId === 0) {
        this.tabId = parseInt(event.data.split(' ')[1])
        console.log('Lost master', this.tabId)
      }
    } else if (event.data === 'EXSIST_TAB') {
      if (this.tabId === 0) {
        this.otherTabCount += 1
      }
    }
  }
}

export default TabAsync
