const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  output: {
    path: __dirname + "/docs",
    publicPath: "/uiuc_cs_498_ddv/",
    filename: "bundle.js"
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
    new CopyPlugin([
      { from: "./data/chart.json", to: "./data/chart.json" },
      {
        from: "./data/world-country-names.csv",
        to: "./data/world-country-names.csv"
      }
    ])
  ],
  devServer: {
    contentBase: "./docs"
  },
  devtool: "source-map"
};
