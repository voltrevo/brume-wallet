const webpack = require("webpack")
const TerserPlugin = require('terser-webpack-plugin')
const { copyFileSync, rmSync, rmdirSync } = require("fs")
const Log = require("next/dist/build/output/log")
const path = require("path")

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false, // TODO
  swcMinify: true,
  output: "export",
  productionBrowserSourceMaps: true,
  webpack(config, options) {
    if (options.isServer) return config

    rmSync("./.webpack", { force: true, recursive: true })

    compileServiceWorker(config, options)
    compileContentScript(config, options)
    compileInjectedScript(config, options)

    return config
  }
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compile(name, config, options) {
  Log.wait(`compiling ${name}...`)

  const start = Date.now()

  webpack(config).run((_, status) => {
    if (status?.hasErrors()) {
      Log.error(`failed to compile ${name}`)
      Log.error(status.toString({ colors: true }))
    } else {
      Log.ready(`compiled ${name} in ${Date.now() - start} ms`)
      copyFileSync(`./.webpack/${config.output.filename}`, `./public/${config.output.filename}`)
    }
  })
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compileServiceWorker(config, options) {
  compile("service_worker", {
    devtool: false,
    target: "webworker",
    mode: config.mode,
    resolve: config.resolve,
    resolveLoader: config.resolveLoader,
    module: config.module,
    plugins: config.plugins,
    entry: "./src/mods/background/service_worker/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "service_worker.js"
    },
    optimization: {
      minimize: false,
      minimizer: [new TerserPlugin()]
    }
  })
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compileContentScript(config, options) {
  compile("content_script", {
    devtool: false,
    target: "webworker",
    mode: config.mode,
    resolve: config.resolve,
    resolveLoader: config.resolveLoader,
    module: config.module,
    plugins: config.plugins,
    entry: "./src/mods/background/content_script/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "content_script.js"
    },
    optimization: {
      minimize: config.mode === "production",
      minimizer: [new TerserPlugin()]
    }
  })
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compileInjectedScript(config, options) {
  compile("injected_script", {
    devtool: false,
    target: "web",
    mode: config.mode,
    resolve: config.resolve,
    resolveLoader: config.resolveLoader,
    module: config.module,
    plugins: config.plugins,
    entry: "./src/mods/background/injected_script/index.ts",
    output: {
      path: path.join(process.cwd(), ".webpack"),
      filename: "injected_script.js"
    },
    optimization: {
      minimize: config.mode === "production",
      minimizer: [new TerserPlugin()]
    }
  })
}

module.exports = nextConfig
