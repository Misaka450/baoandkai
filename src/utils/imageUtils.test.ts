import { describe, it, expect } from "vitest"
import {
  BoundedImageCache,
  getThumbnailUrl,
  getFullImageUrl,
  getOriginalImageUrl,
  sanitizeAvatarUrl,
  getOptimizedAvatarUrl
} from "./imageUtils"

describe("BoundedImageCache", () => {
  it("stores and retrieves cached keys up to maxCapacity", () => {
    const cache = new BoundedImageCache(2)
    cache.add("img1").add("img2")
    expect(cache.has("img1")).toBe(true)
    expect(cache.has("img2")).toBe(true)

    // Adding img3 should evict the oldest entry (img1)
    cache.add("img3")
    expect(cache.has("img1")).toBe(false)
    expect(cache.has("img2")).toBe(true)
    expect(cache.has("img3")).toBe(true)
  })

  it("refreshes LRU position when re-adding existing key", () => {
    const cache = new BoundedImageCache(2)
    cache.add("img1").add("img2")
    cache.add("img1")

    cache.add("img3")
    expect(cache.has("img1")).toBe(true)
    expect(cache.has("img2")).toBe(false)
    expect(cache.has("img3")).toBe(true)
  })
})

describe("image URL formatting functions", () => {
  it("formats thumbnail URLs correctly with /api/images/", () => {
    expect(getThumbnailUrl("/uploads/photos/test.jpg", 400)).toBe("/api/images/photos/test.jpg?w=400&q=80&f=webp")
    expect(getThumbnailUrl("", 400)).toBe("")
  })

  it("formats full image URLs correctly", () => {
    expect(getFullImageUrl("/uploads/photos/test.jpg", 1600)).toBe("/api/images/photos/test.jpg?w=1600&q=85&f=webp")
  })

  it("extracts original image URLs without query params", () => {
    expect(getOriginalImageUrl("/api/images/photos/test.jpg?w=400&q=80&f=webp")).toBe("/uploads/photos/test.jpg")
  })

  it("sanitizes avatar URLs and filters dicebear or data SVG", () => {
    expect(sanitizeAvatarUrl("https://api.dicebear.com/avatar.svg")).toBe("")
    expect(sanitizeAvatarUrl("data:image/svg+xml;base64,xxxx")).toBe("")
    expect(sanitizeAvatarUrl("/uploads/avatars/me.jpg")).toBe("/uploads/avatars/me.jpg")
    expect(sanitizeAvatarUrl("https://example.com/avatar.png")).toBe("https://example.com/avatar.png")
  })

  it("handles avatar optimization for local and remote avatars", () => {
    expect(getOptimizedAvatarUrl("/uploads/avatars/test.jpg", 80)).toBe("/api/images/avatars/test.jpg?w=80&q=80&f=webp")
    expect(getOptimizedAvatarUrl("https://api.dicebear.com/avatar.svg")).toBe("https://api.dicebear.com/avatar.svg")
  })
})
