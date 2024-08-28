const path = require("path")
const { withNextAsImmutable } = require("@hazae41/next-as-immutable")
const { withNextSidebuild, NextSidebuild } = require("@hazae41/next-sidebuild")
const withMDX = require("@next/mdx")()

module.exports = withMDX(withNextAsImmutable(withNextSidebuild({
  reactStrictMode: false, // TODO
  output: "export",
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  sidebuilds: function* (wpconfig) {
    yield compileServiceWorker(wpconfig)
    yield compileContentScript(wpconfig)
    yield compileInjectedScript(wpconfig)
    yield compileOffscreen(wpconfig)
  },
  env: {
    VERSION: process.env.npm_package_version
  }
})))

async function compileServiceWorker(wpconfig) {
  await NextSidebuild.compile({
    name: "service_worker",
    devtool: false,
    target: "webworker",
    mode: wpconfig.mode,
    resolve: wpconfig.resolve,
    resolveLoader: wpconfig.resolveLoader,
    module: wpconfig.module,
    plugins: wpconfig.plugins,
    entry: "./src/mods/background/service_worker/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "./service_worker.js"
    },
    optimization: {
      minimize: true,
      minimizer: wpconfig.optimization.minimizer
    }
  })
}

async function compileContentScript(wpconfig) {
  await NextSidebuild.compile({
    name: "content_script",
    devtool: false,
    target: "webworker",
    mode: wpconfig.mode,
    resolve: wpconfig.resolve,
    resolveLoader: wpconfig.resolveLoader,
    module: wpconfig.module,
    plugins: wpconfig.plugins,
    entry: "./src/mods/background/content_script/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "./content_script.js"
    },
    optimization: {
      minimize: true,
      minimizer: wpconfig.optimization.minimizer
    }
  })
}

async function compileInjectedScript(wpconfig) {
  await NextSidebuild.compile({
    name: "injected_script",
    devtool: false,
    target: "web",
    mode: wpconfig.mode,
    resolve: wpconfig.resolve,
    resolveLoader: wpconfig.resolveLoader,
    module: wpconfig.module,
    plugins: wpconfig.plugins,
    entry: "./src/mods/background/injected_script/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "./injected_script.js"
    },
    optimization: {
      minimize: true,
      minimizer: wpconfig.optimization.minimizer
    }
  })
}

async function compileOffscreen(wpconfig) {
  await NextSidebuild.compile({
    name: "offscreen",
    devtool: false,
    target: "web",
    mode: wpconfig.mode,
    resolve: wpconfig.resolve,
    resolveLoader: wpconfig.resolveLoader,
    module: wpconfig.module,
    plugins: wpconfig.plugins,
    entry: "./src/mods/background/offscreen/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "./offscreen.js"
    },
    optimization: {
      minimize: true,
      minimizer: wpconfig.optimization.minimizer
    }
  })
}
