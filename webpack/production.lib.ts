import path from "path"
import webpack from "webpack"
import MiniCssExtractPlugin from "mini-css-extract-plugin"

import common from "./common"

const config: webpack.Configuration = {
  mode: "production",
  entry: path.join(common.rootPath, "src/index.tsx"),
  devtool: "source-map",
  output: {
    filename: "asharp.min.js",
    path: path.join(common.rootPath, "build"),
  },
  resolve: {
    extensions: common.resolveExts,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      ...common.rules,
    ],
  },
  plugins: [...common.plugins, new MiniCssExtractPlugin({filename: "asharp.min.css"})],
}

export default config
