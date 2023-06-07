const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const ts = require("@rollup/plugin-typescript")

/**
 * @type {import("rollup").RollupOptions}
 */
const config = [
  {
    input: "./src/mods/background/service_worker/index.mts",
    cache: false,
    output: [{
      esModule: false,
      dir: "./public",
      format: "esm",
      exports: "none",
      preserveModules: false,
      sourcemap: true,
      entryFileNames: "service_worker.js",
    }],
    plugins: [commonjs(), nodeResolve({ preferBuiltins: false }), ts({ tsconfig: "./src/mods/background/service_worker/tsconfig.json" })],
    external: ["crypto", "net"]
  },
  {
    input: "./src/mods/background/content_script/index.ts",
    cache: false,
    output: [{
      dir: "./public",
      format: "esm",
      exports: "none",
      preserveModules: false,
      sourcemap: true,
      entryFileNames: "content_script.js",
    }],
    plugins: [commonjs(), nodeResolve({ preferBuiltins: false }), ts({ tsconfig: "./src/mods/background/content_script/tsconfig.json" })],
    external: ["crypto", "net"]
  },
]

module.exports = config