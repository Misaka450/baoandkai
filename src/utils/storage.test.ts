import { describe, it, expect, beforeEach } from "vitest"
import { safeStorage } from "./storage"

describe("safeStorage utility", () => {
  beforeEach(() => {
    safeStorage.removeItem("test_key")
    safeStorage.removeItem("json_key")
  })

  it("stores and retrieves string items", () => {
    safeStorage.setItem("test_key", "hello_world")
    expect(safeStorage.getItem("test_key")).toBe("hello_world")

    safeStorage.removeItem("test_key")
    expect(safeStorage.getItem("test_key")).toBe(null)
  })

  it("stores and retrieves JSON objects safely", () => {
    const payload = { name: "Bao", count: 42, active: true }
    safeStorage.setJSON("json_key", payload)

    const retrieved = safeStorage.getJSON("json_key", { name: "fallback" })
    expect(retrieved).toEqual(payload)
  })

  it("returns fallback value when key does not exist or JSON is corrupt", () => {
    const fallback = { status: "empty" }
    expect(safeStorage.getJSON("non_existing_key", fallback)).toEqual(fallback)

    safeStorage.setItem("corrupt_key", "invalid-json-{")
    expect(safeStorage.getJSON("corrupt_key", fallback)).toEqual(fallback)
  })
})
