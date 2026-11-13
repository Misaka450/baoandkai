import { describe, it, expect, beforeEach, vi } from "vitest"
import { openModal, closeModal, getModalCount, subscribeModalState } from "./modalState"

describe("modalState utility", () => {
  beforeEach(() => {
    while (getModalCount() > 0) {
      closeModal()
    }
  })

  it("tracks nested modal open/close counts accurately", () => {
    expect(getModalCount()).toBe(0)

    expect(openModal()).toBe(1)
    expect(openModal()).toBe(2)
    expect(getModalCount()).toBe(2)

    expect(closeModal()).toBe(1)
    expect(getModalCount()).toBe(1)

    expect(closeModal()).toBe(0)
    expect(getModalCount()).toBe(0)
  })

  it("never drops modalCount below zero", () => {
    expect(closeModal()).toBe(0)
    expect(getModalCount()).toBe(0)
  })

  it("notifies subscribers only transitioning open state at count boundaries", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeModalState(listener)

    expect(listener).toHaveBeenLastCalledWith(false)

    openModal()
    expect(listener).toHaveBeenLastCalledWith(true)

    openModal()
    expect(listener).toHaveBeenLastCalledWith(true)

    closeModal()
    expect(listener).toHaveBeenLastCalledWith(true)

    closeModal()
    expect(listener).toHaveBeenLastCalledWith(false)

    unsubscribe()
  })
})
