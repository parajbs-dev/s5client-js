const path = require('path');

module.exports = {
  entry: './libs/s5client-js/src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 's5client.js',
    library: {
      name: 's5client',
      type: 'umd',
    },
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
};
