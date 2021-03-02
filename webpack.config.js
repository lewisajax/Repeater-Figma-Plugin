const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require('path');
const autoprefixer = require('autoprefixer');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  entry: {
    ui: './src/js/ui.ts', // The entry point for your UI code
    main: './src/js/main.ts', // The entry point for your plugin code
  },
  module: {
    rules: [
      {
          test: /\.(js|ts(x?))$/,
          exclude: /node_modules/,
          use: [
              'babel-loader',
              'ts-loader'
          ]
      },
      {
          test: /\.(s*)css$/,
          use: [
          "style-loader",
          "css-loader",
          {
              loader: 'postcss-loader',
              options: {
              ident: 'postcss',
              plugins: () => [autoprefixer()]
              }
          },
          "sass-loader"
          ],
      }
    ],
  },
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inlineSource: '.(css|js)$'
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new CleanWebpackPlugin()
  ],
})