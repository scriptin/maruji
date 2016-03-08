import React from 'react'
import { connect } from 'react-redux'
import Header from './Header'
import StatusBar from './StatusBar'

const App = ({ isLoading, status }) => (
  <div>
    <Header />
    <StatusBar />
  </div>
)

export default connect()(App)
