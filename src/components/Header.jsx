import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

const Header = ({ isLoading, status }) => (
  <nav className="navbar navbar-inverse navbar-static-top">
    <div className="container">
      <div className="navbar-header">
        <a className="navbar-brand" href="#">まる字（ma・ru・ji）</a>
      </div>
    </div>
  </nav>
)

export default connect()(Header)
