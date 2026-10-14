import { ROUTE_PLAN_PDF_CONFIG as CONFIG } from "./routePlanPdfTemplate"

export type RoutePlanPdfRoute = {
  day: string
  from: string
  to: string
  plannedArrival: string
  departure: string
  transportMode: string
  cost: number | string
}

export type RoutePlanPdfPlan = {
  id: number
  submittedBy: number
  weekStart: string
  totalCost: string | number
  status: "submitted" | "reviewed"
  submittedAt?: string
  merchandizerName?: string | null
  merchandizerEmail?: string | null
  dailyRoutes?: RoutePlanPdfRoute[]
}

export type RoutePlanPdfOptions = {
  /** When the plan was reviewed. Defaults to now (used for the auto-download on review). */
  reviewedOn?: Date | string
}

type LoadedLogo = { dataUrl: string; width: number; height: number }

/** Fetches the logo and reads its natural size so it can be drawn without distortion. */
async function loadLogo(src: string): Promise<LoadedLogo | null> {
  try {
    const response = await fetch(src)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error("Logo could not be decoded"))
      img.src = dataUrl
    })
    return { dataUrl, ...size }
  } catch {
    return null
  }
}

function formatDateTime(value: Date | string | undefined) {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
}

function formatMoney(value: string | number | undefined) {
  const parsed = Number(value)
  return (Number.isFinite(parsed) ? parsed : 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function routePlanPdfFileName(plan: RoutePlanPdfPlan) {
  const who = plan.merchandizerName || plan.merchandizerEmail || `merchandiser_${plan.submittedBy}`
  // For an email fallback use just the part before "@", and cap the length so file names stay manageable.
  const base = who.includes("@") ? who.split("@")[0] : who
  const safe = base.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase().slice(0, 40)
  return `route_plan_${safe}_${plan.weekStart}.pdf`
}

/**
 * Builds the branded route-plan review PDF and triggers the browser download.
 * jsPDF is imported lazily so it stays out of the main bundle until HR actually needs it.
 */
export async function downloadRoutePlanPdf(plan: RoutePlanPdfPlan, options: RoutePlanPdfOptions = {}) {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadLogo(CONFIG.logo.src),
  ])

  const doc = new jsPDF({ unit: "mm", format: CONFIG.pageSize, orientation: CONFIG.orientation })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = CONFIG.margin
  const [pr, pg, pb] = CONFIG.primary
  const [ar, ag, ab] = CONFIG.accent

  const merchandiser =
    plan.merchandizerName || plan.merchandizerEmail || `Merchandiser #${plan.submittedBy}`
  const routes = plan.dailyRoutes ?? []

  // ---- Header: logo (kept in proportion inside the configured box) + titles ----
  let textX = margin
  let logoHeight = 0
  if (logo) {
    const scale = Math.min(CONFIG.logo.width / logo.width, CONFIG.logo.height / logo.height)
    const w = logo.width * scale
    logoHeight = logo.height * scale
    doc.addImage(logo.dataUrl, "PNG", margin, margin, w, logoHeight)
    textX = margin + w + 6
  }

  doc.setTextColor(pr, pg, pb)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(CONFIG.companyName, textX, margin + 8)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(90, 104, 118)
  doc.text(CONFIG.documentTitle, textX, margin + 15)

  // Sit the rule just under whichever is taller: the drawn logo or the two title lines.
  const ruleY = margin + Math.max(logoHeight, 18) + 4
  doc.setDrawColor(ar, ag, ab)
  doc.setLineWidth(0.8)
  doc.line(margin, ruleY, pageWidth - margin, ruleY)

  // ---- Merchandiser details ----
  const isReviewed = plan.status === "reviewed"
  const details: [string, string][] = [
    ["Merchandiser", merchandiser],
    ["Email", plan.merchandizerEmail || "-"],
    ["Merchandiser ID", String(plan.submittedBy)],
    ["Week commencing", plan.weekStart],
    ["Submitted on", formatDateTime(plan.submittedAt)],
    [isReviewed ? "Reviewed on" : "Status", isReviewed ? formatDateTime(options.reviewedOn ?? new Date()) : "Pending review"],
  ]

  const colGap = 8
  const colWidth = (pageWidth - margin * 2 - colGap) / 2
  const detailsTop = ruleY + 9
  const rowHeight = 12
  details.forEach(([label, value], i) => {
    const x = margin + (i % 2) * (colWidth + colGap)
    const y = detailsTop + Math.floor(i / 2) * rowHeight
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(108, 120, 135)
    doc.text(label.toUpperCase(), x, y)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(27, 43, 61)
    const lines: string[] = doc.splitTextToSize(value, colWidth)
    // Keep each detail on one line; mark it with an ellipsis if it had to be cut.
    doc.text(lines.length > 1 ? `${(lines[0] ?? "").trimEnd()}…` : (lines[0] ?? ""), x, y + 5.5)
  })

  const tableTop = detailsTop + Math.ceil(details.length / 2) * rowHeight + 2

  // ---- Route table ----
  const columns = CONFIG.columns
  const costIndex = columns.findIndex((c) => c.key === "cost")
  // Total row: label spans every column before "cost", then the total, then any trailing columns blank.
  const footRow =
    costIndex > 0
      ? [
          { content: "Total estimated cost", colSpan: costIndex, styles: { halign: "right" as const } },
          formatMoney(plan.totalCost),
          ...Array<string>(columns.length - costIndex - 1).fill(""),
        ]
      : undefined
  autoTable(doc, {
    startY: tableTop,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [columns.map((c) => c.header)],
    body: routes.length
      ? routes.map((route) =>
          columns.map((c) => {
            const value = (route as Record<string, unknown>)[c.key]
            return c.key === "cost" ? formatMoney(value as number | string) : String(value ?? "")
          })
        )
      : [[{ content: "No route days recorded", colSpan: columns.length, styles: { halign: "center" } }]],
    foot: footRow ? [footRow] : undefined,
    showFoot: "lastPage",
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, lineColor: [215, 221, 227], lineWidth: 0.2, textColor: [34, 48, 71] },
    headStyles: { fillColor: [pr, pg, pb], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [244, 247, 250], textColor: [pr, pg, pb], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 252, 253] },
    columnStyles: costIndex >= 0 ? { [costIndex]: { halign: "right" } } : undefined,
  })

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(215, 221, 227)
    doc.setLineWidth(0.2)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(108, 120, 135)
    doc.text(CONFIG.footerText, margin, pageHeight - 7)
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 7, { align: "right" })
  }

  doc.save(routePlanPdfFileName(plan))
}
