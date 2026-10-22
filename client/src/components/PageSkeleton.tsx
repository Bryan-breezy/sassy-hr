import * as React from "react"
import { cn } from "@/lib/utils"

type PageSkeletonProps = { page?: "home" | "hr" }

function Pulse({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse motion-reduce:animate-none rounded-lg bg-current/10", className)} />
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#18352f]">
      <header className="sticky top-0 z-20 border-b border-[#dfe7df] bg-[#f6f7f4]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-8">
          <div className="flex min-w-0 flex-col gap-2">
            <Pulse className="h-4 w-56 sm:w-80" />
            <Pulse className="h-3 w-44 sm:w-60" />
          </div>
          <Pulse className="size-9 rounded-xl" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          <section className="order-2 lg:order-1">
            <Pulse className="h-10 w-full max-w-lg sm:h-14" />
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
              {Array.from({ length: 3 }, (_, index) => <Pulse key={index} className="h-24 rounded-2xl sm:h-28" />)}
            </div>
            <div className="mt-6 max-w-xl rounded-2xl border border-[#e5ebe3] bg-white p-4 sm:mt-8 sm:p-5">
              <Pulse className="h-3 w-44" />
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: 7 }, (_, index) => <Pulse key={index} className="h-10 w-12 rounded-xl" />)}
              </div>
            </div>
          </section>

          <section className="order-1 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_60px_rgba(37,68,52,.10)] lg:order-2">
            <div className="bg-[#143f37] p-6 sm:p-8">
              <Pulse className="h-3 w-32 bg-white/20" />
              <Pulse className="mt-3 h-7 w-40 bg-white/20" />
            </div>
            <div className="space-y-4 p-4 sm:p-8">
              <Pulse className="h-3 w-36" />
              <Pulse className="h-12 w-full rounded-xl" />
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="rounded-2xl border border-[#edf0eb] p-4">
                  <Pulse className="mb-4 h-4 w-24" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }, (_, field) => <Pulse key={field} className="h-10 rounded-xl" />)}
                  </div>
                </div>
              ))}
              <Pulse className="h-16 rounded-2xl" />
              <Pulse className="h-12 rounded-xl bg-[#a86743]/20" />
            </div>
          </section>
        </div>

        <section className="mt-12">
          <Pulse className="h-3 w-36" />
          <Pulse className="mt-2 h-8 w-56" />
          <div className="mt-5 space-y-px overflow-hidden rounded-3xl bg-white shadow-sm">
            {Array.from({ length: 2 }, (_, index) => <Pulse key={index} className="h-20 rounded-none" />)}
          </div>
        </section>
      </main>
    </div>
  )
}

function HRSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#223047] lg:grid lg:grid-cols-[260px_1fr]">
      <aside aria-hidden="true" className="hidden bg-[#1d2c3f] p-6 lg:block">
        <Pulse className="h-12 w-full bg-white/10" />
        <Pulse className="mt-10 h-3 w-24 bg-white/10" />
        <Pulse className="mt-4 h-10 w-full bg-white/10" />
        <Pulse className="mt-2 h-10 w-full bg-white/10" />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#e1e7ee] bg-white px-5 sm:px-10">
          <div className="space-y-2">
            <Pulse className="h-3 w-40" />
            <Pulse className="h-6 w-64" />
          </div>
          <Pulse className="h-9 w-28 rounded-xl" />
        </header>
        <main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 sm:p-8">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <Pulse key={index} className="h-28 rounded-2xl bg-white" />)}
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(380px,.9fr)_1.1fr]">
            <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_35px_rgba(29,44,63,.06)]">
              <div className="border-b border-[#e8edf2] p-5">
                <Pulse className="h-5 w-40" />
                <Pulse className="mt-2 h-3 w-64" />
              </div>
              <div className="space-y-3 border-b border-[#e8edf2] bg-[#fbfcfd] p-4">
                <Pulse className="h-10 rounded-xl" />
                <div className="flex gap-2">{Array.from({ length: 3 }, (_, index) => <Pulse key={index} className="h-8 w-20 rounded-lg" />)}</div>
              </div>
              {Array.from({ length: 4 }, (_, index) => <Pulse key={index} className="h-24 rounded-none border-b border-[#edf1f4] p-5" />)}
            </section>
            <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_35px_rgba(29,44,63,.06)]">
              <div className="border-b border-[#e8edf2] p-6">
                <Pulse className="h-8 w-64" />
                <Pulse className="mt-2 h-4 w-48" />
              </div>
              <div className="space-y-4 p-6">
                <Pulse className="h-24 rounded-xl bg-[#f4f7fa]" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => <Pulse key={index} className="h-36 rounded-xl" />)}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PageSkeleton({ page }: PageSkeletonProps) {
  const currentPage = page ?? (typeof window !== "undefined" && window.location.pathname.startsWith("/hr") ? "hr" : "home")
  const isHome = currentPage === "home"
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={isHome ? "Loading route planner" : "Loading HR submissions"}>
      <span className="sr-only">{isHome ? "Loading route planner" : "Loading HR submissions"}</span>
      {isHome ? <HomeSkeleton /> : <HRSkeleton />}
    </div>
  )
}
