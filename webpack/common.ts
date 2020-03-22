import path from "path"
import webpack from "webpack"
import {CleanWebpackPlugin} from "clean-webpack-plugin"

export const rootPath = path.resolve(__dirname, "..")
export const resolveExts = [".ts", ".tsx", ".js", ".json"]
export const rules: webpack.RuleSetRule[] = [
  {
    test: /\.tsx?$/,
    use: "babel-loader",
    exclude: /node_modules/,
  },
  {
    test: /\.(woff(2)?|ttf|eot|png)(\?v=\d+\.\d+\.\d+)?$/,
    use: "url-loader",
  },
  {
    test: /\.svg$/,
    use: ["@svgr/webpack", "url-loader"],
  },
  {enforce: "pre", test: /\.js$/, use: "source-map-loader"},
]
export const plugins: webpack.Plugin[] = [new CleanWebpackPlugin()]

export default {
  rootPath,
  rules,
  resolveExts,
  plugins,
}
