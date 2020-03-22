import path from "path"
import webpack from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"

import common from "./common"

const config: webpack.Configuration = {
  mode: "development",
  entry: path.join(common.rootPath, "src/index.tsx"),
  devtool: "eval",
  devServer: {
    contentBase: path.resolve(__dirname, "..", "build"),
    compress: true,
    port: 3000,
  },
  resolve: {
    extensions: common.resolveExts,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      ...common.rules,
    ],
  },
  plugins: [...common.plugins, new HtmlWebpackPlugin({template: "./src/demo.html"})],
}

export default config
