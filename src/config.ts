import consola from "consola"
import { globSync } from "glob"
import { readFileSync } from "node:fs"
import { extname } from "node:path"
import { cwd } from "node:process"
import { TransformOptions, transform } from "oxc-transform"
import stripJsonComments from "strip-json-comments"
import yaml from "yaml"

/**
 * Options for transforming a single file.
 *
 * 1. Extends oxc-transform TransformOptions.
 * 2. Provides source and output directory configuration.
 * 3. Files will output relative to outdir as it was related to srcdir.
 */
export type FileOptions = TransformOptions & {
  /** Source directory, default to "src" inside cwd. */
  srcdir?: string

  /** Output directory, default to "out" inside cwd. */
  outdir?: string
}

/**
 * Configuration options for library packing.
 *
 * 1. Extends oxc-transform TransformOptions.
 * 2. Provides source and output directory configuration.
 * 3. Supports include/exclude glob patterns.
 */
export type PackOptions = FileOptions & {
  /** Includes glob patterns, default to ["**\/*"]. */
  includes?: string[]

  /**
   * Excludes glob patterns,
   * default to ["node_modules/**\/*", "**\/*.test.ts", "**\/test/**\/*"].
   */
  excludes?: string[]

  /** Whether to empty outdir before packing, default to false. */
  emptyOutdir?: boolean
}

/**
 * Resolves configuration options with default values.
 *
 * 1. Merges provided options with defaults.
 * 2. Sets srcdir to "src" if not provided.
 * 3. Sets outdir to "out" if not provided.
 * 4. Sets includes to ["**\/*"] if not provided.
 * 5. Sets excludes to ignore node_modules and test files/directories if not provided.
 * 6. Override typescript options to remove js comment by default.
 * 6. Override typescript options to enable declaration by default.
 */
export function resolveOptions(options: PackOptions): PackOptions {
  return {
    ...options,
    srcdir: options.srcdir || "src",
    outdir: options.outdir || "out",
    includes: options.includes || ["**/*.ts"],
    excludes: options.excludes || [
      "node_modules/**/*",
      "**/*.test.ts",
      "**/test/**/*",
    ],
    sourcemap: options.sourcemap || true,
    typescript: {
      ...options.typescript,
      declaration: options.typescript?.declaration || {
        sourcemap: options.typescript?.declaration?.sourcemap || true,
      },
    },
  }
}

/**
 * Detects configuration file in the specified directory.
 *
 * 1. Searches for library-pack.* files in JSON, YAML, and config formats.
 * 2. Supports JSON, JSONC, JSON5, YAML, YML, TS, JS, MTS, CJS, MJS extensions.
 * 3. Returns the first matching file found or undefined.
 */
export function detectOptionsFile(root?: string): string | undefined {
  if (!root) root = cwd()
  root = root.replaceAll("\\", "/")
  const globPatterns = [
    `${root}/library-pack.@(json|jsonc|json5|yaml|yml)`,
    `${root}/library-pack.config.@(ts|js|mts|cjs|mjs)`,
  ]
  return globSync(globPatterns)[0] || undefined
}

/**
 * Loads configuration from JSON/JSONC/JSON5 format.
 *
 * 1. Parses JSON with comments stripped.
 * 2. Validates and resolves options with defaults.
 * 3. Returns resolved PackOptions object.
 */
export function loadJsonOptions(code: string): PackOptions {
  const raw = JSON.parse(stripJsonComments(code)) as PackOptions
  return raw
}

/**
 * Loads configuration from YAML/YML format.
 *
 * 1. Parses YAML content.
 * 2. Validates and resolves options with defaults.
 * 3. Returns resolved PackOptions object.
 */
export function loadYamlOptions(code: string): PackOptions {
  const raw = yaml.parse(code) as PackOptions | null
  return raw || {}
}

/**
 * Configuration helper function for type safety.
 *
 * 1. Provides type checking for configuration objects.
 * 2. Returns the configuration object unchanged.
 * 3. Used in TypeScript/JavaScript config files.
 */
export function defineConfig(config: PackOptions): PackOptions {
  return config
}

/**
 * Loads configuration from JavaScript files.
 *
 * 1. Uses dynamic import to load JavaScript configuration.
 * 2. Supports both ES modules and CommonJS exports.
 * 3. Returns resolved PackOptions object.
 */
export async function loadJSOptions(file: string): Promise<PackOptions> {
  try {
    const config = await import(file)
    return config.default || config
  } catch (error) {
    consola.error(`Failed to load JavaScript config from ${file}:`, error)
    return {}
  }
}

/**
 * Loads configuration from TypeScript files.
 *
 * 1. Reads TypeScript file content.
 * 2. Transforms TypeScript to JavaScript using oxc-transform.
 * 3. Uses data URL to load transformed code without creating files.
 * 4. Returns resolved PackOptions object.
 */
export async function loadTSOptions(file: string): Promise<PackOptions> {
  try {
    const code = readFileSync(file, "utf-8")
    const result = transform(file, code)

    if (!result.code) {
      throw new Error("Failed to transform TypeScript to JavaScript")
    }

    // Create a data URL from the transformed JavaScript code
    const dataUrl =
      `data:text/javascript;` +
      `charset=utf-8,${encodeURIComponent(result.code)}`

    // Use dynamic import with data URL
    const config = await import(dataUrl)
    return config.default || config
  } catch (error) {
    consola.error(`Failed to load TypeScript config from ${file}:`, error)
    return {}
  }
}

/**
 * Loads configuration from file based on extension.
 *
 * 1. Reads file content based on file extension.
 * 2. Supports JSON, YAML, TypeScript, and JavaScript formats.
 * 3. Routes to appropriate loader function.
 * 4. Returns resolved PackOptions object.
 */
export async function loadOptionsFile(file: string): Promise<PackOptions> {
  const code = readFileSync(file, "utf-8")
  switch (extname(file)) {
    case ".json":
    case ".jsonc":
    case ".json5":
      return loadJsonOptions(code)

    case ".yaml":
    case ".yml":
      return loadYamlOptions(code)

    case ".ts":
    case ".mts":
      return await loadTSOptions(file)

    case ".js":
    case ".cjs":
    case ".mjs":
      return await loadJSOptions(file)

    default:
      return {}
  }
}

export type RunPathOptions = {
  file?: string
  root?: string
}

/**
 * Main function to load configuration options.
 *
 * 1. Detects configuration file if not provided.
 * 2. Loads configuration from detected or specified file.
 * 3. Returns resolved PackOptions object.
 * 4. Returns empty object if no configuration file found.
 */
export async function loadOptions(path?: RunPathOptions): Promise<PackOptions> {
  const file = path?.file || detectOptionsFile(path?.root)
  if (!file) return {} as PackOptions
  return await loadOptionsFile(file)
}
