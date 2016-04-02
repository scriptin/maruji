import React from 'react'
import Header from './Header'
import ErrorAlert from './ErrorAlert'
import QuestionArea from './QuestionArea'
import AnswerArea from './AnswerArea'

const App = () => (
  <div>
    <Header />
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <ErrorAlert />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <QuestionArea />
        </div>
        <div className="col-md-6">
          <AnswerArea />
        </div>
      </div>
    </div>
  </div>
)

export default App
