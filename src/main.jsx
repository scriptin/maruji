var React = require('react');
var ReactDOM = require('react-dom');
var App = require('./App.jsx');
var Provider = require('react-redux').Provider;
var Redux = require('redux');
var app = require('./reducers.js');

var store = Redux.createStore(app);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);
