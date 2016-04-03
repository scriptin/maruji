import React from 'react'
import Header from './Header'
import Content from './Content'

require('../styles/app.less')

const App = () => (
  <div className="app flex-column">
    <Header />
    <Content />
  </div>
)

export default App
