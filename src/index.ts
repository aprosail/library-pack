import { loadOptions, PackOptions } from "@/config.ts"
import consola from "consola"

export async function pack(options: PackOptions) {
  consola.log(options)
}

export async function run(root?: string) {
  return pack(await loadOptions({ root }))
}
