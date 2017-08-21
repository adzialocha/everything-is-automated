/* eslint-disable no-use-before-define */

import styles from '../styles/index.scss' // eslint-disable-line no-unused-vars

import API from './network/API'
import Composition from './Composition'
import Network from './network'
import Settings from './Settings'
import View from './View'

const api = new API()
const composition = new Composition()
const settings = new Settings()
const view = new View()

const network = new Network({
  onOpen: () => {
    view.changeConnectionState(false, true)
    composition.start()
  },
  onClose: () => {
    view.changeConnectionState(false, false)
    composition.stop()
  },
  onOpenRemote: peerId => {
    view.addRemotePeer(peerId)
  },
  onCloseRemote: peerId => {
    view.removeRemotePeer(peerId)
  },
  onSyncTick: offset => {
    view.updateOffset(offset)
    view.tick()

    composition.instrument.syncTick()
  },
  onReceive: (peer, data) => {
    api.receive(peer, data)
  },
  onError: err => {
    view.addErrorMessage(err.message)
  },
})

api.setNetwork(network)

// Initialize
window.addEventListener('load', () => {
  view.changeConnectionState(false, false)
  view.updateSettings(settings.getConfiguration())
  view.changePattern(composition.getCurrentPattern())
})

// Expose some interfaces to the view
window.automaton = window.automaton || {
  network: {
    connect: event => {
      event.preventDefault()

      if (network.connect(settings.getConfiguration())) {
        view.changeConnectionState(true, false)
      }
    },
    disconnect: event => {
      event.preventDefault()

      view.changeConnectionState(true, true)
      network.disconnect()
    },
    send: (data) => {
      network.sendToAll(data)
    },
  },
  settings: {
    update: event => {
      const { id, value } = event.target
      settings.update(id, value)
    },
  },
  onChangePattern: event => {
    view.changePattern(event.target.value)
  },
  onKeyDownPattern: event => {
    if (event.keyCode === 13) {
      event.preventDefault()
      event.stopPropagation()

      const value = event.target.value

      if (composition.instrument.changePattern(value)) {
        view.commitPattern(value)
      }
    }

    return true
  },
}

// Main keyboard control strokes
window.addEventListener('keydown', (event) => {
  const { keyCode, shiftKey } = event

  // Press shift + number
  if (shiftKey) {
    view.changeView(keyCode - 49)
  }

  // Press enter
  if (keyCode === 13) {
    if (view.getCurrentView() === 'main-view') {
      view.focusPattern()
    }
  }
})
