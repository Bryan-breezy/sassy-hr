import { describe, expect, it } from "vitest"
import { LUNCH_ALLOWANCE_PER_DAY, computePlanCosts } from "@shared/planCost"

describe("computePlanCosts", () => {
  it("uses a fixed 150 Ksh lunch allowance", () => {
    expect(LUNCH_ALLOWANCE_PER_DAY).toBe(150)
  })

  it("adds nothing when no day has data", () => {
    expect(computePlanCosts([])).toEqual({ transportCost: 0, daysWithData: 0, lunchCost: 0, nightOutCost: 0, nightOutDays: [], totalCost: 0 })
  })

  it("adds one lunch allowance for a single day", () => {
    const result = computePlanCosts([{ day: "Monday", cost: "200" }])
    expect(result).toEqual({ transportCost: 200, daysWithData: 1, lunchCost: 150, nightOutCost: 0, nightOutDays: [], totalCost: 350 })
  })

  it("charges lunch per day, not per visit", () => {
    const result = computePlanCosts([
      { day: "Monday", cost: "100" },
      { day: "Monday", cost: "50.5" },
      { day: "Monday", cost: "" },
    ])
    expect(result.daysWithData).toBe(1)
    expect(result.lunchCost).toBe(150)
    expect(result.totalCost).toBe(300.5)
  })

  it("adds lunch for each day with data, even when transport is free", () => {
    const result = computePlanCosts([
      { day: "Monday", cost: 0 },
      { day: "Wednesday", cost: "abc" },
      { day: "Friday", cost: 300 },
    ])
    expect(result.daysWithData).toBe(3)
    expect(result.lunchCost).toBe(450)
    expect(result.totalCost).toBe(750)
  })

  it("adds an optional night out on top of transport and lunch", () => {
    const result = computePlanCosts([
      { day: "Tuesday", cost: 200, nightOutCost: 2500 },
      { day: "Tuesday", cost: 100, nightOutCost: 0 },
      { day: "Wednesday", cost: 50 },
    ])
    expect(result.transportCost).toBe(350)
    expect(result.lunchCost).toBe(300)
    expect(result.nightOutCost).toBe(2500)
    expect(result.nightOutDays).toEqual(["Tuesday"])
    expect(result.totalCost).toBe(3150)
  })

  it("treats a missing, blank, negative or invalid night out as nothing", () => {
    const result = computePlanCosts([
      { day: "Monday", cost: 0, nightOutCost: "" },
      { day: "Tuesday", cost: 0, nightOutCost: -500 },
      { day: "Wednesday", cost: 0, nightOutCost: "abc" },
      { day: "Thursday", cost: 0, nightOutCost: null },
    ])
    expect(result.nightOutCost).toBe(0)
    expect(result.nightOutDays).toEqual([])
    expect(result.totalCost).toBe(600)
  })
})
