// https://github.com/Updater/peer-deps-externals-webpack-plugin/pull/7
declare module "peer-deps-externals-webpack-plugin" {
  import {Compiler} from "webpack"

  class PeerDepsExternalsWebpackPlugin {
    apply(compiler: Compiler): void
  }

  export = PeerDepsExternalsWebpackPlugin
}

declare module "*.png" {
  const src: string
  export default src
}

declare module "*.svg" {
  import React from "react"
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  const src: string
  export default src
}
