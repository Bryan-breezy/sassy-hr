import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import PageSkeleton from "../client/src/components/PageSkeleton"

describe("PageSkeleton", () => {
  it("renders the route-planning page layout while Home loads", () => {
    const html = renderToStaticMarkup(createElement(PageSkeleton, { page: "home" }))

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-label="Loading route planner"')
    expect(html).toContain("animate-pulse")
    expect(html.match(/animate-pulse/g)?.length).toBeGreaterThan(10)
  })

  it("renders the review-console layout while HR data loads", () => {
    const html = renderToStaticMarkup(createElement(PageSkeleton, { page: "hr" }))

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-label="Loading HR submissions"')
    expect(html).toContain("animate-pulse")
    expect(html.match(/animate-pulse/g)?.length).toBeGreaterThan(10)
  })
})
