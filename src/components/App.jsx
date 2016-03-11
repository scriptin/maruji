import React from 'react'
import Header from './Header'
import StatusBar from './StatusBar'
import QuestionArea from './QuestionArea'
import AnswerArea from './AnswerArea'

const App = ({ isLoading, status }) => (
  <div>
    <Header />
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <QuestionArea />
        </div>
        <div className="col-md-6">
          <StatusBar />
          <AnswerArea />
        </div>
      </div>
    </div>
  </div>
)

export default App
