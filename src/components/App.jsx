import React from 'react'
import { connect } from 'react-redux'
import Header from './Header'
import StatusBar from './StatusBar'
import QuestionArea from './QuestionArea'
import AnswerArea from './AnswerArea'

const App = ({ isLoading, status }) => (
  <div>
    <Header />
    <QuestionArea />
    <StatusBar />
    <AnswerArea />
  </div>
)

export default connect()(App)
