const { merge } = require('webpack-merge');
const common = require('./webpack.example.config.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: false,
  devServer: {
    static: {
      directory: './example/', // Update this line to serve files from the root directory
    },
    compress: true,
    port: 8080,
  },
});
