import path from "path"
import webpack from "webpack"
import {CleanWebpackPlugin} from "clean-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import HtmlWebpackPlugin from "html-webpack-plugin"

import common from "./common"
import production from "./production.lib"

const config: webpack.Configuration = {
  ...production,
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({filename: "asharp.min.css"}),
    new HtmlWebpackPlugin({template: path.join(common.rootPath, "src/demo.html")}),
  ],
}

export default config
