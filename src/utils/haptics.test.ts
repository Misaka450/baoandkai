import { describe, it, expect, vi, beforeEach } from "vitest"
import { hapticFeedback } from "./haptics"

describe("haptics utility", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("calls navigator.vibrate with correct pattern when supported", () => {
    const vibrateMock = vi.fn().mockReturnValue(true)
    vi.stubGlobal("window", {})
    vi.stubGlobal("navigator", { vibrate: vibrateMock })

    hapticFeedback("light")
    expect(vibrateMock).toHaveBeenCalledWith(10)

    hapticFeedback("medium")
    expect(vibrateMock).toHaveBeenCalledWith(20)

    hapticFeedback("heavy")
    expect(vibrateMock).toHaveBeenCalledWith(40)

    hapticFeedback("success")
    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 20])
  })

  it("does not throw when navigator.vibrate is missing", () => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("navigator", {})
    expect(() => hapticFeedback("light")).not.toThrow()
  })

  it("safely catches any exceptions thrown by navigator.vibrate", () => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("navigator", {
      vibrate: () => {
        throw new Error("SecurityError: vibrate not allowed")
      }
    })
    expect(() => hapticFeedback("medium")).not.toThrow()
  })
})
