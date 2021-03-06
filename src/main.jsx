import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import App from './components/App'
import app from './reducers'
import { initApp } from './actions'

import 'expose?$!expose?jQuery!jquery'
import 'bootstrap-webpack'

const logger = createLogger()
const store = createStore(app, applyMiddleware(logger, thunkMiddleware))

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
)

store.dispatch(initApp({
  kanjiList: 'kanji-list.json',
  kanjiVocab: 'kanji-vocab.json',
  similarKanji: 'similar-kanji.json',
  kanjiSounds: 'kanji-sounds.json'
}))
