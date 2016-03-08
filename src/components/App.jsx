import React from 'react'
import { connect } from 'react-redux'
import Header from './Header'
import StatusBar from './StatusBar'
import WorkingArea from './WorkingArea'

const App = ({ isLoading, status }) => (
  <div>
    <Header />
    <StatusBar />
    <WorkingArea />
  </div>
)

export default connect()(App)
