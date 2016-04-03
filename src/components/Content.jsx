import React from 'react'
import ErrorAlert from './ErrorAlert'
import QuestionArea from './QuestionArea'
import AnswerArea from './AnswerArea'

const Content = () => (
  <div className="container content flex-column-item-fill flex-column">
    <div className="row flex-column-item-fixed">
      <div className="col-md-12">
        <ErrorAlert />
      </div>
    </div>
    <div className="row flex-column-item-fill flex-row">
      <div className="col-md-6 flex-row-item-scrollable">
        <QuestionArea />
      </div>
      <div className="col-md-6 flex-row-item-scrollable">
        <AnswerArea />
      </div>
    </div>
  </div>
)

export default Content
