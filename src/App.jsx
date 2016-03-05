var React = require('react');
var ReactRedux = require('react-redux');

var App = React.createClass({
  render: function () {
    return <div>Hello world</div>;
  }
});

module.exports = ReactRedux.connect()(App);
