const CONFIG = {
  // Company / branding
  companyName: "Sassy Cosmetic & Beauty Products",
  documentTitle: "Route Plan Review Report",
  footerText: "Confidential – For internal HR use only",

  // Colors (RGB 0–255)
  primary: [39, 71, 101],   // deep blue
  accent:  [209, 164, 91],  // gold
  ...

  // Page
  pageSize: "a4",           // or "letter"
  orientation: "portrait",  // or "landscape"
  margin: 14,

  // Table columns – reorder / rename / remove freely
  columns: [
    { key: "day",            header: "Day" },
    { key: "from",           header: "From" },
    { key: "to",             header: "To" },
    { key: "plannedArrival", header: "Arrival" },
    { key: "departure",      header: "Departure" },
    { key: "transportMode",  header: "Transport" },
    { key: "cost",           header: "Cost (Ksh)" },
  ],
}
