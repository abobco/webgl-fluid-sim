const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

// webpack.config.js
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  //mode: 'development',
  context: path.resolve(__dirname, 'src'),
  entry: './main.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
    //publicPath: '/src/network/php'
  },
  node: {
    fs: "empty"
  },
  devServer: {
    contentBase: './dist',
    host: '10.0.0.43',
    // webpack dev server can't execute php requests, so send them to the lamp webserver
     proxy: {
      '**': {
          target: "http://www.studiostudios.net/particle-toy/database",
          changeOrigin: true
      }     
    }
  },
  devtool: 'inline-source-map',
  module: {
    rules:[
      {
        test: /\.(vert|frag)$/i,
        use: 'raw-loader'
      },
    ],
  },  
  plugins: [
    // new BundleAnalyzerPlugin(),
   // new CopyPlugin([ { from: 'network/php', to: path.resolve(__dirname, 'dist/php') } ])
  ],
};