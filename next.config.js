const TerserPlugin = require("terser-webpack-plugin")
const path = require("path")
const fs = require("fs")
const { withImmutable, NextAsImmutable } = require("@hazae41/next-as-immutable")
const withMDX = require("@next/mdx")()

function* walkSync(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name > b.name ? 1 : -1)

  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(directory, file.name))
    } else {
      yield path.join(directory, file.name)
    }
  }
}

module.exports = withMDX(withImmutable({
  reactStrictMode: false, // TODO
  swcMinify: true,
  output: "export",
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  compiles: function* (wpconfig) {
    for (const absolute of walkSync("./public")) {
      const filename = path.basename(absolute)

      if (filename.startsWith("service_worker."))
        fs.rmSync(absolute, { force: true })
      if (filename === "content_script.js")
        fs.rmSync(absolute, { force: true })
      if (filename === "injected_script.js")
        fs.rmSync(absolute, { force: true })
      if (filename === "offscreen.js")
        fs.rmSync(absolute, { force: true })

      continue
    }

    yield compileServiceWorker(wpconfig)
    yield compileContentScript(wpconfig)
    yield compileInjectedScript(wpconfig)
    yield compileOffscreen(wpconfig)
  }
}))

async function compileServiceWorker(wpconfig) {
  await NextAsImmutable.compile({
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
      minimizer: [new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          }
        }
      })]
    }
  })
}

async function compileContentScript(wpconfig) {
  await NextAsImmutable.compile({
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
      minimizer: [new TerserPlugin()]
    }
  })
}

async function compileInjectedScript(wpconfig) {
  await NextAsImmutable.compile({
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
      minimizer: [new TerserPlugin()]
    }
  })
}

async function compileOffscreen(wpconfig) {
  await NextAsImmutable.compile({
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
      minimizer: [new TerserPlugin()]
    }
  })
}
