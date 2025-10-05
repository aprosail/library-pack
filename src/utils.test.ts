import { beforeEach, describe, expect, test, vi } from "vitest"
import {
  existsSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "./test/mocks.js"
import { maybeEmptyDir, maybeWriteFile } from "./utils.js"

// Mock dependencies.
vi.mock("node:fs", () => ({
  existsSync,
  statSync,
  readdirSync,
  rmSync,
  writeFileSync,
}))

describe("maybeWriteFile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("write file with data", () => {
    const file = "test.txt"
    const data = "Hello, World!"
    const options = { encoding: "utf-8" as const }

    maybeWriteFile(file, data, options)

    expect(writeFileSync).toHaveBeenCalledWith(file, data, options)
  })

  test("skip write when data undefined", () => {
    const file = "test.txt"

    maybeWriteFile(file, undefined)

    expect(writeFileSync).not.toHaveBeenCalled()
  })

  test("write file with empty string", () => {
    const file = "test.txt"
    const data = ""

    maybeWriteFile(file, data)

    expect(writeFileSync).toHaveBeenCalledWith(file, data, undefined)
  })

  test("write file with default options", () => {
    const file = "config.json"
    const data = '{"key": "value"}'

    maybeWriteFile(file, data)

    expect(writeFileSync).toHaveBeenCalledWith(file, data, undefined)
  })
})

describe("maybeEmptyDir", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("empty existing directory", () => {
    const dir = "/path/to/dir"
    const items = ["file1.txt", "file2.js", "subdir"]

    existsSync.mockReturnValue(true)
    statSync.mockReturnValue({ isDirectory: () => true })
    readdirSync.mockReturnValue(items)

    maybeEmptyDir(dir)

    expect(existsSync).toHaveBeenCalledWith(dir)
    expect(statSync).toHaveBeenCalledWith(dir)
    expect(readdirSync).toHaveBeenCalledWith(dir)
    expect(rmSync).toHaveBeenCalledTimes(3)
  })

  test("skip when dir undefined", () => {
    maybeEmptyDir(undefined)

    expect(existsSync).not.toHaveBeenCalled()
    expect(statSync).not.toHaveBeenCalled()
    expect(readdirSync).not.toHaveBeenCalled()
    expect(rmSync).not.toHaveBeenCalled()
  })

  test("skip when dir not exists", () => {
    const dir = "/nonexistent/dir"

    existsSync.mockReturnValue(false)

    maybeEmptyDir(dir)

    expect(existsSync).toHaveBeenCalledWith(dir)
    expect(statSync).not.toHaveBeenCalled()
    expect(readdirSync).not.toHaveBeenCalled()
    expect(rmSync).not.toHaveBeenCalled()
  })

  test("skip when not directory", () => {
    const dir = "/path/to/file.txt"

    existsSync.mockReturnValue(true)
    statSync.mockReturnValue({ isDirectory: () => false })

    maybeEmptyDir(dir)

    expect(existsSync).toHaveBeenCalledWith(dir)
    expect(statSync).toHaveBeenCalledWith(dir)
    expect(readdirSync).not.toHaveBeenCalled()
    expect(rmSync).not.toHaveBeenCalled()
  })

  test("handle empty directory", () => {
    const dir = "/empty/dir"

    existsSync.mockReturnValue(true)
    statSync.mockReturnValue({ isDirectory: () => true })
    readdirSync.mockReturnValue([])

    maybeEmptyDir(dir)

    expect(existsSync).toHaveBeenCalledWith(dir)
    expect(statSync).toHaveBeenCalledWith(dir)
    expect(readdirSync).toHaveBeenCalledWith(dir)
    expect(rmSync).not.toHaveBeenCalled()
  })
})
