const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  output: {
    path: path.resolve(__dirname, "./docs"),
    publicPath: "/",
    filename: "bundle.js"
  },
  devtool: "eval",
  devServer: {
    contentBase: path.join(__dirname, "./docs"),
    hot: true
  },
  stats: "errors-only",
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
  plugins: [
    new HtmlWebPackPlugin({
      template: path.join(__dirname, "./src/index.html"),
      filename: "index.html"
    }),
    new CopyPlugin([
      {
        from: path.join(__dirname, "./data/chart.json"),
        to: path.join(__dirname, "./docs/data/chart.json")
      },{
        from: path.join(__dirname, "./data/world-country-names.csv"),
        to: path.join(__dirname, "./docs/data/world-country-names.csv")
      }
    ])
  ],
  stats: {
    colors: true
  }
};
