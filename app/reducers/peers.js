import { createSelector } from 'reselect'
import { ipcRenderer } from 'electron'
// ------------------------------------
// Constants
// ------------------------------------
export const CONNECT_PEER = 'CONNECT_PEER'
export const CONNECT_SUCCESS = 'CONNECT_SUCCESS'
export const CONNECT_FAILURE = 'CONNECT_FAILURE'

export const DISCONNECT_PEER = 'DISCONNECT_PEER'
export const DISCONNECT_SUCCESS = 'DISCONNECT_SUCCESS'
export const DISCONNECT_FAILURE = 'DISCONNECT_FAILURE'

export const SET_PEER_FORM = 'SET_PEER_FORM'

export const SET_PEER = 'SET_PEER'

export const GET_PEERS = 'GET_PEERS'
export const RECEIVE_PEERS = 'RECEIVE_PEERS'

// ------------------------------------
// Actions
// ------------------------------------
export function connectPeer() {
  return {
    type: CONNECT_PEER
  }
}

export function connectFailure() {
  return {
    type: CONNECT_FAILURE
  }
}

export function disconnectPeer() {
  return {
    type: DISCONNECT_PEER
  }
}

export function disconnectFailure() {
  return {
    type: DISCONNECT_FAILURE
  }
}

export function setPeerForm(form) {
  return {
    type: SET_PEER_FORM,
    form
  }
}

export function setPeer(peer) {
  return {
    type: SET_PEER,
    peer
  }
}

export function getPeers() {
  return {
    type: GET_PEERS
  }
}

// Send IPC event for peers
export const fetchPeers = () => async (dispatch) => {
  dispatch(getPeers())
  ipcRenderer.send('lnd', { msg: 'peers' })
}

// Receive IPC event for peers
export const receivePeers = (event, { peers }) => dispatch => dispatch({ type: RECEIVE_PEERS, peers })

// Send IPC event for connecting to a peer
export const connectRequest = ({ pubkey, host }) => (dispatch) => {
  dispatch(connectPeer())
  ipcRenderer.send('lnd', { msg: 'connectPeer', data: { pubkey, host } })
}

// Send IPC receive for successfully connecting to a peer
export const connectSuccess = (event, peer) => dispatch => dispatch({ type: CONNECT_SUCCESS, peer })

// Send IPC send for disconnecting from a peer
export const disconnectRequest = ({ pubkey }) => (dispatch) => {
  dispatch(disconnectPeer())
  ipcRenderer.send('lnd', { msg: 'disconnectPeer', data: { pubkey } })
}

// Send IPC receive for successfully disconnecting from a peer
export const disconnectSuccess = (event, { pubkey }) => dispatch => dispatch({ type: DISCONNECT_SUCCESS, pubkey })

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [DISCONNECT_PEER]: state => ({ ...state, disconnecting: true }),
  [DISCONNECT_SUCCESS]: (state, { pubkey }) => (
    { ...state, disconnecting: false, peer: null, peers: state.peers.filter(peer => peer.pub_key !== pubkey) }
  ),
  [DISCONNECT_FAILURE]: state => ({ ...state, disconnecting: false }),

  [CONNECT_PEER]: state => ({ ...state, connecting: true }),
  [CONNECT_SUCCESS]: (state, { peer }) => (
    { ...state, connecting: false, peerForm: { pubkey: '', host: '', isOpen: false }, peers: [...state.peers, peer] }
  ),
  [CONNECT_FAILURE]: state => ({ ...state, connecting: false }),

  [SET_PEER_FORM]: (state, { form }) => ({ ...state, peerForm: Object.assign({}, state.peerForm, form) }),

  [SET_PEER]: (state, { peer }) => ({ ...state, peer }),

  [GET_PEERS]: state => ({ ...state, peersLoading: true }),
  [RECEIVE_PEERS]: (state, { peers }) => ({ ...state, peersLoading: false, peers })
}

const peersSelectors = {}
const peerSelector = state => state.peers.peer

peersSelectors.peerModalOpen = createSelector(
  peerSelector,
  peer => (!!peer)
)

export { peersSelectors }

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  peersLoading: false,
  peers: [],
  peer: null,
  peerForm: {
    isOpen: false,
    pubkey: '',
    host: ''
  },
  connecting: false,
  disconnecting: false
}

export default function peersReducer(state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
