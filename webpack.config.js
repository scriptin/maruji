var webpack = require('webpack');

module.exports = {
  entry: './src/main.jsx',
  output: {
    path: 'build',
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.js', '.jsx']
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin(),
    new webpack.DefinePlugin({'process.env.NODE_ENV': '"development"'})
  ],
  module: {
    loaders: [
      { test: /\.jsx$/, loader: 'jsx-loader' }
    ]
  }
}
