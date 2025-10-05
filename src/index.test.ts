import { beforeEach, describe, expect, test, vi } from "vitest"
import { pack, run, transform } from "./index.js"

// Mock dependencies.
vi.mock("consola", () => ({
  default: {
    success: vi.fn(),
  },
}))

vi.mock("glob", () => ({
  glob: vi.fn(() => Promise.resolve([])),
}))

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(() => "const x: number = 1;"),
  writeFileSync: vi.fn(),
}))

vi.mock("oxc-transform", () => ({
  transformAsync: vi.fn(() =>
    Promise.resolve({
      code: "const x = 1;",
      declaration: "declare const x: number;",
      map: null,
      declarationMap: null,
    }),
  ),
}))

vi.mock("./utils.js", () => ({
  maybeWriteFile: vi.fn(),
  maybeEmptyDir: vi.fn(),
}))

vi.mock("./config.js", () => ({
  resolveOptions: vi.fn((options) => ({
    srcdir: options.srcdir || "src",
    outdir: options.outdir || "out",
    includes: options.includes || ["**/*.ts"],
    excludes: options.excludes || ["node_modules/**/*"],
    emptyOutdir: options.emptyOutdir || false,
  })),
  loadOptions: vi.fn(() =>
    Promise.resolve({
      srcdir: "src",
      outdir: "out",
      includes: ["**/*.ts"],
    }),
  ),
}))

describe("transform", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("basic transformation", async () => {
    const mockFile = "/project/src/test.ts"
    const mockOptions = {
      srcdir: "src",
      outdir: "out",
    }

    await expect(transform(mockFile, mockOptions)).resolves.not.toThrow()
  })
})

describe("pack", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("pack with options", async () => {
    const mockOptions = {
      srcdir: "src",
      outdir: "dist",
    }

    await expect(pack(mockOptions)).resolves.not.toThrow()
  })
})

describe("run", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("run with options", async () => {
    const mockOptions = {
      srcdir: "src",
      outdir: "dist",
    }

    await expect(run(mockOptions)).resolves.not.toThrow()
  })
})
