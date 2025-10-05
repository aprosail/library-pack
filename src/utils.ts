import {
  existsSync,
  PathOrFileDescriptor,
  readdirSync,
  rmSync,
  statSync,
  WriteFileOptions,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"

export function maybeWriteFile(
  file: PathOrFileDescriptor,
  data?: string,
  options?: WriteFileOptions,
) {
  if (data === undefined) return
  writeFileSync(file, data, options)
}

export function maybeEmptyDir(dir?: string) {
  if (dir && existsSync(dir) && statSync(dir).isDirectory()) {
    for (const item of readdirSync(dir)) {
      rmSync(join(dir, item), { recursive: true })
    }
  }
}
