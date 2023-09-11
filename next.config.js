const webpack = require("webpack")
const TerserPlugin = require('terser-webpack-plugin')
const { copyFileSync, rmSync } = require("fs")
const Log = require("next/dist/build/output/log")
const path = require("path")

/**
 * @type {Promise<void> | undefined}
 */
let promise = undefined

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false, // TODO
  swcMinify: true,
  output: "export",
  generateBuildId: async () => {
    return "brume"
  },
  webpack(config, options) {
    config.module.rules.push({
      test: /\.tsx?$/,
      use: "ts-loader",
      exclude: /node_modules/,
    });

    if (options.isServer) return config

    rmSync("./.webpack", { force: true, recursive: true })

    promise = Promise.all([
      compileServiceWorker(config, options),
      compileContentScript(config, options),
      compileInjectedScript(config, options)
    ])

    return config
  },
  exportPathMap: async (map) => {
    await promise
    return map
  }
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
async function compile(name, config, options) {
  Log.wait(`compiling ${name}...`)

  const start = Date.now()

  const status = await new Promise(ok => webpack(config).run((_, status) => ok(status)))

  if (status?.hasErrors()) {
    Log.error(`failed to compile ${name}`)
    Log.error(status.toString({ colors: true }))
    throw new Error(`Compilation failed`)
  }

  Log.ready(`compiled ${name} in ${Date.now() - start} ms`)
  copyFileSync(`./.webpack/${config.output.filename}`, `./public/${config.output.filename}`)
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
async function compileServiceWorker(config, options) {
  await compile("service_worker", {
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
async function compileContentScript(config, options) {
  await compile("content_script", {
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
      minimize: false,
      minimizer: [new TerserPlugin()]
    }
  })
}

/**
 * @param {import("next/dist/server/config-shared").WebpackConfigContext} options
 */
async function compileInjectedScript(config, options) {
  await compile("injected_script", {
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
      minimize: false,
      minimizer: [new TerserPlugin()]
    }
  })
}

module.exports = nextConfig
