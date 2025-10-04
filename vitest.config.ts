import { join } from "node:path"
import { defineConfig } from "vitest/config"

const root = import.meta.dirname

export default defineConfig({
  resolve: { alias: { "@": join(root, "src") } },
  test: { include: [join(root, "src/**/*.test.ts")] },
})
