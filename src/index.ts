import {
  FileOptions,
  loadOptions,
  PackOptions,
  resolveOptions,
  RunPathOptions,
} from "@/config.ts"
import consola from "consola"
import { glob } from "glob"
import { readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, extname, join, relative, resolve } from "node:path"
import { cwd } from "node:process"
import { SourceMap, transformAsync } from "oxc-transform"
import { maybeEmptyDir, maybeWriteFile } from "./utils.ts"

/**
 * Transform a source file using oxc-transformer, output js, dts, and maps.
 *
 * The output file(s) will be at the same relative path to the outdir
 * in options as the source file related to srcdir.
 * The source map will be force enabled.
 *
 * @param file path to the source file, excepted to be absolute.
 * @param options options for the transformation using oxc-transformer.
 */
export async function transform(file: string, options: FileOptions) {
  const srcdir = resolve(options.srcdir || "src")
  const outdir = resolve(options.outdir || "out")
  const outfile = join(outdir, relative(srcdir, file))
  const outfileDir = dirname(outfile)
  const outname = basename(outfile, extname(outfile))
  const outBase = join(outfileDir, outname)

  const code = readFileSync(file, "utf-8")
  const result = await transformAsync(file, code, options)

  function resolveSourceMap(raw?: SourceMap) {
    if (!raw) return undefined
    const sources = raw?.sources!.map((s) => relative(outfileDir, s))
    return JSON.stringify({
      ...raw,
      sources: sources,
      sourcesContent: undefined,
    } satisfies SourceMap)
  }

  writeFileSync(`${outBase}.js`, result.code)
  maybeWriteFile(`${outBase}.d.ts`, result.declaration)
  maybeWriteFile(`${outBase}.js.map`, resolveSourceMap(result.map))
  maybeWriteFile(`${outBase}.d.ts.map`, resolveSourceMap(result.declarationMap))
  consola.success(`Transformed ${file}`)
}

/**
 * Pack source files according to the options.
 * @param options options for the packing.
 */
export async function pack(options: PackOptions) {
  const resolvedOptions = resolveOptions(options)
  const files = await glob(resolvedOptions?.includes || [], {
    cwd: resolvedOptions.srcdir,
    ignore: resolvedOptions.excludes,
    nodir: true,
    absolute: true,
  })

  if (resolvedOptions.emptyOutdir) maybeEmptyDir(resolvedOptions.outdir)
  await Promise.all(files.map((file) => transform(file, resolvedOptions)))
}

/**
 * Run the packing process with options,
 * also the entrypoint of the executable of this package.
 * When options
 *
 * @param options options for the packing or configuration file loading.
 */
export async function run(options?: PackOptions & RunPathOptions) {
  if (options?.file || options?.root) {
    return await pack(await loadOptions(options))
  } else if (!options || Object.keys(options).length === 0) {
    return await pack(await loadOptions({ root: cwd() }))
  } else return await pack(options!)
}
