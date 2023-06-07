const path = require("path")
const webpack = require("webpack")
const TerserPlugin = require('terser-webpack-plugin')
const { copyFileSync } = require("fs")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // TODO
  swcMinify: true,
  output: "export",
  webpack(config, options) {
    if (options.isServer) return config

    compileServiceWorker(config, options)
    compileContentScript(config, options)

    copyFileSync("./dist/service_worker.js", "./public/service_worker.js")
    copyFileSync("./dist/content_script.js", "./public/content_script.js")

    return config
  }
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compile(name, config, options) {
  webpack(config).run((_, status) => {
    if (status?.hasErrors()) {
      console.error(`> [PWA] Failed to build ${name}`)
      console.error(status.toString({ colors: true }))
      process.exit(-1)
    } else {
      console.info(`> [PWA] Successfully built ${name}`)
    }
  })
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compileServiceWorker(config, options) {
  compile("service_worker", {
    mode: "production",
    devtool: false,
    target: "webworker",
    resolve: config.resolve,
    resolveLoader: config.resolveLoader,
    module: config.module,
    entry: "./src/mods/background/service_worker/index.ts",
    output: {
      filename: "service_worker.js"
    },
    plugins: config.plugins,
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()]
    }
  })
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
function compileContentScript(config, options) {
  compile("content_script", {
    mode: "production",
    devtool: false,
    target: "webworker",
    resolve: config.resolve,
    resolveLoader: config.resolveLoader,
    module: config.module,
    entry: "./src/mods/background/content_script/index.ts",
    output: {
      filename: "content_script.js"
    },
    plugins: config.plugins,
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()]
    }
  })
}

module.exports = nextConfig
