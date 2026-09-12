# Merchandizer Route Plan

## Google Sheets database

The server uses Google Sheets as its runtime database. No `DATABASE_URL`, Google Cloud project, service account, or local MySQL server is required.

1. Create a Google Sheet.
2. Add these tabs with the exact header rows below:

`Users`

```text
id | openId | username | name | email | role | loginMethod | lastSignedIn | createdAt | passwordHash
```

`RoutePlans`

```text
id | submittedBy | weekStart | totalCost | status | submittedAt | updatedAt
```

`RoutePlanDays`

```text
id | routePlanId | day | from | to | plannedArrival | departure | transportMode | cost
```

3. Open **Extensions -> Apps Script** in the spreadsheet.
4. Copy the contents of `google-apps-script.gs` into the Apps Script editor.
5. Change `ACCESS_TOKEN` in the script to a long random value.
6. Click **Deploy -> New deployment**, choose **Web app**, set **Execute as: Me**, set **Who has access: Anyone**, then deploy and copy the web-app URL.
7. Configure the deployment environment from `.env.example`:

```text
GOOGLE_APPS_SCRIPT_URL=<copied-web-app-url>
GOOGLE_APPS_SCRIPT_TOKEN=<same-token-used-in-the-script>
JWT_SECRET=<long-random-secret>
ADMIN_USERNAME=<admin-username>
ADMIN_PASSWORD=<admin-password>
USER_CREDENTIALS=<optional username:password pairs>
NODE_ENV=production
```

The Apps Script runs as your Google account and writes to the attached spreadsheet. The server validates both Apps Script variables before it starts.

## Run

```bash
pnpm install
pnpm build
pnpm start
```
