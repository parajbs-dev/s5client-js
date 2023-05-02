const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: './', // Update this line to serve files from the root directory
    },
    compress: true,
    port: 8080,
  },
});
