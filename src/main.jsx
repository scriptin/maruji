import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import app from './reducers'

import 'expose?$!expose?jQuery!jquery'
import 'bootstrap-webpack'

const store = createStore(app)

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
)
