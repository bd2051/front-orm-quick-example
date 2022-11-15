const { resolve } = require( 'path' )
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: resolve( __dirname, 'public' )
  },
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: resolve( __dirname, '' )
    }
  },
  mode: 'development'
}