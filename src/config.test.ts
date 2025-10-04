import { describe, expect, test } from "vitest"
import {
  defineConfig,
  loadJsonOptions,
  loadYamlOptions,
  resolveOptions,
} from "./config.js"

describe("jsonc options", () => {
  test("should parse basic json options", () => {
    const json =
      `{\n` +
      `  "srcdir": "source",\n` +
      `  "outdir": "dist",\n` +
      `  "includes": ["**/*.ts"],\n` +
      `  "excludes": ["node_modules/**/*", "test/**/*"]\n` +
      `}`

    const result = loadJsonOptions(json)
    expect(result).toEqual({
      srcdir: "source",
      outdir: "dist",
      includes: ["**/*.ts"],
      excludes: ["node_modules/**/*", "test/**/*"],
    })
  })

  test("should parse jsonc with comments", () => {
    const jsonc =
      `{\n` +
      `  // This is a comment\n` +
      `  "srcdir": "src",\n` +
      `  "outdir": "out",\n` +
      `  /* This is a block comment */\n` +
      `  "includes": ["**/*.ts", "**/*.tsx"]\n` +
      `}`

    const result = loadJsonOptions(jsonc)
    expect(result).toEqual({
      srcdir: "src",
      outdir: "out",
      includes: ["**/*.ts", "**/*.tsx"],
      excludes: ["node_modules/**/*"],
    })
  })

  test("should use default values when options are missing", () => {
    const json = `{}`

    const result = loadJsonOptions(json)
    expect(result).toEqual({
      srcdir: "src",
      outdir: "out",
      includes: ["**/*"],
      excludes: ["node_modules/**/*"],
    })
  })

  test("should handle partial options", () => {
    const json = `{\n` + `  "srcdir": "custom-src"\n` + `}`

    const result = loadJsonOptions(json)
    expect(result).toEqual({
      srcdir: "custom-src",
      outdir: "out",
      includes: ["**/*"],
      excludes: ["node_modules/**/*"],
    })
  })
})

describe("yaml options", () => {
  test("should parse basic yaml options", () => {
    const yaml =
      `srcdir: source\n` +
      `outdir: dist\n` +
      `includes:\n` +
      `  - "**/*.ts"\n` +
      `  - "**/*.tsx"\n` +
      `excludes:\n` +
      `  - "node_modules/**/*"\n` +
      `  - "test/**/*"`

    const result = loadYamlOptions(yaml)
    expect(result).toEqual({
      srcdir: "source",
      outdir: "dist",
      includes: ["**/*.ts", "**/*.tsx"],
      excludes: ["node_modules/**/*", "test/**/*"],
    })
  })

  test("should parse yaml with comments", () => {
    const yaml =
      `# This is a comment\n` +
      `srcdir: src\n` +
      `outdir: out\n` +
      `includes:\n` +
      `  - "**/*.ts"  # TypeScript files\n` +
      `  - "**/*.tsx" # TypeScript React files`

    const result = loadYamlOptions(yaml)
    expect(result).toEqual({
      srcdir: "src",
      outdir: "out",
      includes: ["**/*.ts", "**/*.tsx"],
      excludes: ["node_modules/**/*"],
    })
  })

  test("should use default values when yaml options are missing", () => {
    const yaml = ``

    const result = loadYamlOptions(yaml)
    expect(result).toEqual({
      srcdir: "src",
      outdir: "out",
      includes: ["**/*"],
      excludes: ["node_modules/**/*"],
    })
  })

  test("should handle partial yaml options", () => {
    const yaml = `srcdir: custom-src\n` + `includes:\n` + `  - "src/**/*"`

    const result = loadYamlOptions(yaml)
    expect(result).toEqual({
      srcdir: "custom-src",
      outdir: "out",
      includes: ["src/**/*"],
      excludes: ["node_modules/**/*"],
    })
  })

  test("should handle complex yaml structure", () => {
    const yaml =
      `srcdir: packages\n` +
      `outdir: build\n` +
      `includes:\n` +
      `  - "packages/*/src/**/*"\n` +
      `  - "libs/**/*.ts"\n` +
      `excludes:\n` +
      `  - "node_modules/**/*"\n` +
      `  - "**/*.test.ts"\n` +
      `  - "**/*.spec.ts"`

    const result = loadYamlOptions(yaml)
    expect(result).toEqual({
      srcdir: "packages",
      outdir: "build",
      includes: ["packages/*/src/**/*", "libs/**/*.ts"],
      excludes: ["node_modules/**/*", "**/*.test.ts", "**/*.spec.ts"],
    })
  })
})

describe("resolveOptions", () => {
  test("should resolve options with defaults", () => {
    const options = {
      srcdir: "custom-src",
      includes: ["src/**/*"],
    }

    const result = resolveOptions(options)
    expect(result).toEqual({
      srcdir: "custom-src",
      outdir: "out",
      includes: ["src/**/*"],
      excludes: ["node_modules/**/*"],
    })
  })

  test("should handle empty options", () => {
    const result = resolveOptions({})
    expect(result).toEqual({
      srcdir: "src",
      outdir: "out",
      includes: ["**/*"],
      excludes: ["node_modules/**/*"],
    })
  })
})

describe("defineConfig", () => {
  test("should return the config object unchanged", () => {
    const config = {
      srcdir: "src",
      outdir: "dist",
      includes: ["**/*.ts"],
    }

    const result = defineConfig(config)
    expect(result).toBe(config)
  })
})

describe("data url import", () => {
  test("should import configuration from data URL", async () => {
    const configCode =
      `export default {\n` +
      `  srcdir: "data-src",\n` +
      `  outdir: "data-out",\n` +
      `  includes: ["**/*.ts"],\n` +
      `  excludes: ["node_modules/**/*"]\n` +
      `}`

    const dataUrl =
      `data:text/javascript;charset=utf-8,` +
      `${encodeURIComponent(configCode)}`

    const config = await import(dataUrl)
    const { resolveOptions } = await import("./config.js")
    const options = resolveOptions(config.default || config)

    expect(options.srcdir).toBe("data-src")
    expect(options.outdir).toBe("data-out")
    expect(options.includes).toEqual(["**/*.ts"])
    expect(options.excludes).toEqual(["node_modules/**/*"])
  })

  test("should import configuration with defineConfig from data URL", async () => {
    // Create a data URL with JavaScript configuration using defineConfig.
    // Note: We can't import from relative paths in data URLs.
    // So we'll simulate defineConfig.
    const configCode =
      `// Simulate defineConfig function inline ` +
      `since we can't import from data URL\n` +
      `function defineConfig(config) { return config }\n` +
      `export default defineConfig({\n` +
      `  srcdir: "define-src",\n` +
      `  outdir: "define-out",\n` +
      `  includes: ["src/**/*"],\n` +
      `  excludes: ["test/**/*"]\n` +
      `})`
    const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(configCode)}`

    // Use dynamic import with data URL
    const config = await import(dataUrl)
    const { resolveOptions } = await import("./config.js")
    const options = resolveOptions(config.default || config)

    expect(options.srcdir).toBe("define-src")
    expect(options.outdir).toBe("define-out")
    expect(options.includes).toEqual(["src/**/*"])
    expect(options.excludes).toEqual(["test/**/*"])
  })
})
