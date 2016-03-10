import React from 'react'
import { connect } from 'react-redux'
import Header from './Header'
import StatusBar from './StatusBar'
import QuestionArea from './QuestionArea'

const App = ({ isLoading, status }) => (
  <div>
    <Header />
    <QuestionArea />
    <StatusBar />
  </div>
)

export default connect()(App)
