import { describe, it, expect, vi } from "vitest"
import { formatDate, debounce, mapPriority } from "./common"

describe("formatDate utility", () => {
  it("formats date into short format YYYY-MM-DD", () => {
    const result = formatDate("2026-08-05T12:00:00Z", "short")
    // Should match standard short pattern YYYY-MM-DD
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("formats date into dot format YYYY.MM.DD", () => {
    const result = formatDate("2026-08-05T12:00:00Z", "dot")
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
  })

  it("formats date into monthDay format", () => {
    const result = formatDate("2026-08-05T12:00:00Z", "monthDay")
    expect(result).toMatch(/\d+月\d+日/)
  })

  it("gracefully returns empty string for null, undefined, empty", () => {
    expect(formatDate(null)).toBe("")
    expect(formatDate(undefined)).toBe("")
    expect(formatDate("")).toBe("")
  })

  it("gracefully falls back for invalid date strings", () => {
    expect(formatDate("not-a-valid-date")).toBe("not-a-valid-date")
  })
})

describe("mapPriority utility", () => {
  it("maps numeric priorities to low, medium, and high", () => {
    expect(mapPriority(3)).toBe("high")
    expect(mapPriority(4)).toBe("high")
    expect(mapPriority(2)).toBe("medium")
    expect(mapPriority(1)).toBe("low")
    expect(mapPriority(0)).toBe("low")
  })
})

describe("debounce utility", () => {
  it("delays execution until wait time has passed", () => {
    vi.useFakeTimers()
    const mockFn = vi.fn()
    const debounced = debounce(mockFn, 100)

    debounced("arg1")
    debounced("arg2")
    debounced("arg3")

    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith("arg3")

    vi.useRealTimers()
  })
})
