# Symbo Privilege · implementation guide

Prepared 19 October 2026. Start here after extracting this package on Windows.

This package implements your Diwali card journey using **Netlify + Apps Script + your private Google Sheet**. It preserves the supplied black, green and warm yellow design, diya artwork and Symbo logo. No OTP is used. WhatsApp and calls go to **+91 86579 18455**.

**Status:** implementation files created and tested with local fictional fixtures. No Netlify site or Apps Script web app has been deployed by this package. No live customer requests have been submitted. The existing sheet has not been restructured by this task; you run the setup below to create its operational tabs.

## What is included

| File or folder | What it does |
| --- | --- |
| `public/` | Mobile-first customer page, form, review, confirmation and supplied artwork |
| `netlify/functions/privilege.mjs` | Private server connection from the page to Apps Script |
| `netlify.toml` | Hosting and function configuration, plus browser security headers |
| `apps-script/Code.gs` | Sheet setup, secure QR tokens, eligibility, request saving and duplicate protection |
| `apps-script/appsscript.json` | Timezone and minimal spreadsheet/UI permissions |
| `tools/make_qr.py` | Optional private CSV-to-QR-image generator |
| `tests/` | Automated tests using fictional records; no real data or cloud access |
| `IMPLEMENTATION-GUIDE.html` | Browser-friendly version of this guide |

## What you need first

- A Google account with **edit access** to the existing campaign spreadsheet and permission to deploy an Apps Script web app accessible to **Anyone**. Prefer a company-owned account for operations.
- A Netlify account and a private GitHub repository you can connect to it.
- A campaign owner and someone answering the concierge number.
- Final redemption expiry, service scope, availability, cancellation rules and approved terms/privacy wording before real invitations are activated.
- Optional: Node.js 22 or later to run the local checks/visual demo. Python is needed only for the optional QR-image helper.

You do not need a WhatsApp API account or an OTP provider. Use the included Netlify address initially. Custom domains may cost extra. Check the Netlify account's current free allowance and billing controls; this is a small campaign implementation, not an unlimited hosting promise.

## 1. Open the original Google Sheet

Open [Symbo Privilege — Diwali 2026](https://docs.google.com/spreadsheets/d/10zMXtm79Iri3OruEj7Z9Kz23iqbxygI1Od0tg2uKXFo/edit).

Your last verified structure is `Sheet1`, with four test entries first and 31 P1 contacts below. Keep those records. **Do not upload a recipient CSV or workbook into the website repository.**

The setup script copies the first six columns into a new `Recipients` tab once. `Sheet1` remains unchanged. After setup, **Recipients becomes the operational master**: later edits in Sheet1 will not automatically sync. Make recipient changes in Recipients thereafter.

## 2. Install the Apps Script files

1. In the spreadsheet, choose **Extensions → Apps Script**.
2. Open `apps-script/Code.gs` from this package in Notepad or a code editor.
3. Copy its complete contents into the Apps Script editor's `Code.gs`, replacing the default starter function. If this spreadsheet already contains an unrelated Apps Script project, preserve that project and add the campaign code as a separate script file after checking function-name conflicts.
4. In the editor's **Project Settings**, enable **Show appsscript.json manifest file in editor**.
5. Open the manifest and replace its content with `apps-script/appsscript.json` from the package. For a pre-existing project, merge timezone/runtime/scopes with its existing requirements rather than removing other scopes.
6. Save. Name the project **Symbo Privilege — Diwali 2026**.
7. Choose `setupCampaign` from the function dropdown and click **Run**.
8. Authorise with the company Google account that can edit the sheet. Complete Google's normal authorisation process. If Workspace policy blocks the deployment, ask your administrator to enable the approved route.
9. Return to the sheet and reload it.

**Expected result:** new tabs `Recipients`, `Requests`, `Settings`, plus a **Symbo Privilege** menu. The source `Sheet1` stays intact. Re-running setup does not overwrite populated recipient tabs or settings.

Setup also stores `SPREADSHEET_ID` and generates `BACKEND_SECRET` in **Apps Script → Project Settings → Script properties**. Keep the secret private; you will copy it to Netlify in step 6. It is deliberately absent from the downloaded package.

## 3. Prepare test records only

Open `Recipients`. The first six columns match the original sheet, followed by:

| Column | Test configuration / meaning |
| --- | --- |
| QRToken | Leave blank; generated once by the menu |
| AllowedServices | `ac,clean,pest,shoe,wash`; change per person if required |
| MaxRedemptions | `1` by default; number of service requests, not number of all five services |
| ValidUntil | Enter a future date in `YYYY-MM-DD`, using an actual agreed expiry for live records |
| Active | TRUE for the four test IDs, FALSE for real P1s initially |
| QRURL | Generated after the Netlify URL is known |
| CardIssued | Manual tracking field; does not activate or deactivate a card |

For all four `SYM-TEST-0001` through `SYM-TEST-0004` records, enter a **future test expiry**. Use your own callback mobile when testing the form. The fictional sample email addresses need not be replaced to test; this implementation does not send email or use registered email/mobile as authentication.

`Settings` starts with `CampaignMode=TEST`, `CampaignActive=TRUE`, `LaunchApproved=FALSE`. TEST rejects every real P1 even if someone accidentally switches that row's Active value to TRUE. Blank expiry blocks submission; the script does not invent a commercial expiry.

## 4. Deploy the Apps Script backend

1. In Apps Script, select **Deploy → New deployment**.
2. Choose the **Web app** deployment type.
3. Set **Execute as: Me**.
4. Set **Who has access: Anyone** (anonymous access, where your Workspace permits it).
5. Deploy and authorise if prompted.
6. Copy the **Web app URL ending `/exec`** into your private setup notes.

Do not use the `/dev` URL or the editor URL. An unauthenticated GET visit to `/exec` returns a small JSON message saying to use the concierge website; this is normal. The website sends authenticated POST requests through the Netlify Function. **Keep the Google Sheet private**; do not publish it to the web or share it with everyone.

## 5. Put the package in a private GitHub repository

The repository root must directly contain `public`, `netlify`, `netlify.toml` and `package.json`. Avoid an extra enclosing `symbo-privilege/` folder inside the repository root.

An easy Windows route is GitHub Desktop:

1. Install/open GitHub Desktop and sign in.
2. Choose **File → New repository**, name it `symbo-privilege` and select a local folder.
3. Copy the extracted package contents into that folder.
4. Commit the files.
5. Select **Publish repository** and keep it **private**.

Never copy real customer exports, QR token lists, secrets, the original pasted chat transcript or the source workbook into this repository. The original pasted transcript is not included in this package.

## 6. Connect and deploy Netlify

1. In Netlify, choose **Add new project / Import an existing project** and select the private GitHub repository.
2. Base directory: leave blank when the package is at the repository root.
3. Build command: leave blank. This plain HTML/JS site has no frontend build step.
4. Publish directory: `public`.
5. Functions directory: `netlify/functions` (already specified in `netlify.toml`).
6. Add the following environment variables in Netlify's project settings. Make them available to **Functions** in the production context (or all scopes if the UI only offers that choice).

| Environment variable | Exact value to copy |
| --- | --- |
| `APPS_SCRIPT_URL` | The Google Apps Script web-app URL ending `/exec` |
| `BACKEND_SECRET` | The generated value in Apps Script Project Settings → Script properties |

7. Deploy. After changing environment variables later, create a **new deploy** for them to take effect.
8. Check Netlify's Functions list: `privilege` should appear. The frontend calls `/api/privilege`.
9. Copy the production HTTPS address, for example the actual `your-project.netlify.app` URL Netlify gives you. Do not copy a Deploy Preview or branch URL for printed cards.

A static drag-and-drop upload of only `public/` will not deploy the server function. Use the Git-connected route above. The normal site root shows an invitation-only message; the cosmetic preview is `/?demo=1`. The preview uses a fictional recipient and never saves requests.

## 7. Generate personal invitation links

1. In the sheet's `Settings` tab, set `WebsiteURL` to the **final HTTPS Netlify origin**, with no path or query. A trailing slash is fine.
2. Choose **Symbo Privilege → 2. Generate missing tokens and QR links**.
3. The script fills `QRToken` and `QRURL` for existing recipients. IDs already present are preserved. Future blank IDs are generated once and remain stable when rows move.
4. Copy a **test recipient's QRURL** into a browser to test it.
5. Re-running link generation preserves tokens. Do not manually replace issued tokens. If you change the website domain later, the generated links change and existing printed cards will still point at the old domain.

Every QR uses a random 64-character token, not the sequential ID. The page displays the name and privileges linked to that token, but does not return the stored email or phone. There is no OTP: anyone holding an invitation link can act with its entitlement. Your concierge should verify identity before fulfilment. Treat QR URLs and print exports as private invitations.

## 8. Run the live acceptance test using the test IDs

Keep `CampaignMode=TEST` throughout this checklist. This is a real deployed test flow writing only to test records.

1. Open `SYM-TEST-0001`'s generated QRURL while signed out of Google, or in a private browser window. You should see the welcome name, ID, five choices and TEST banner.
2. Choose a service and option, then enter your own mobile and non-sensitive test address, valid pincode, future dates and a callback window. Use the form's review page to inspect the request.
3. Tick the consent checkbox and select **Request my privilege**.
4. Check that a new `Requests` row exists with `Status=New`, `TestRecord=TRUE` and a request reference matching the success screen.
5. Do not open WhatsApp yet. The request must already be in the sheet.
6. Open **Message your concierge** and check the destination and prefilled service/request/Privilege ID. Opening the link does not send the message; leave it unsent unless you intend to message the team.
7. Reopen that recipient's original QRURL. It should say the privilege has already been requested.
8. Test the other sample IDs for invalid consent, wrong phone, invalid pincode, inactive and expired invitations. An invalid or expired invitation must not create a request row.
9. To test restrictions, set a test row's AllowedServices to `ac,shoe`, reload its QRURL and verify only those services appear.
10. Test on an Android phone and an iPhone, including after scanning a printed sample. Check mobile layout, logo, dates, error messages and keyboard behaviour.

To retry the **same unchanged request after an uncertain save**, press the request button again. The backend reuses the prior reference if the first write succeeded. A second request with a new retry key is rejected once the allowance is used.

To repeat a finished test, increase **only that test recipient's MaxRedemptions** by one. Keep the earlier test request for traceability. Do not delete live requests to restore allowances.

**Verification provided in this package:** 16 local automated tests passed, covering setup preservation, token stability, eligibility, expiry, service restrictions, input validation, consent, campaign mode, idempotency, uncertain write recovery, formula escaping and proxy failures. These use in-memory Google service fixtures. They do not replace the deployed tests above. Browser layout and actual Google/Netlify deployment were not verified in this environment.

## 9. Prepare the 31 real P1 recipients

The source P1 list had no emails or mobile numbers, and 19 designations were blank. You can still accept requests because the form collects a callback mobile and the concierge manually verifies identity. Add verified contact details privately in `Recipients` where useful; there is no need to invent or publish them.

Before live launch:

- Set each approved person's AllowedServices, MaxRedemptions, actual ValidUntil and Active=TRUE.
- Confirm one service per person is the intended offer, along with dry/wet AC scope, BHK cleaning/pest scope, eligible shoes/car types, location, extras, cancellation/rescheduling and transferability rules.
- Replace/approve `TermsText` and `PrivacyText` in Settings. Include the appropriate legal entity/contact, how booking details reach the fulfilment partner, retention and customer rights information. These are draft operational text, not a legal approval.
- Enter an approved `PolicyVersion`, such as your internal approved revision identifier. The request records the version accepted.
- Set `CallbackPromise` to wording the team can meet. No four-hour or one-day guarantee is hardcoded.
- Choose `ServiceabilityMode=MANUAL` unless all five services share a confirmed pincode list. MANUAL makes clear that the concierge checks availability. ALLOWLIST requires a comma-separated `ServicePincodes` list and rejects all unlisted pincodes. Separate per-service geography is not implemented; use manual checks if coverage differs.
- Set `LaunchApproved=TRUE`, `CampaignMode=LIVE`, `CampaignActive=TRUE` only after the test checklist passes and these inputs are approved.

LIVE also accepts active test cards. You can set the four test rows' Active values to FALSE when testing is finished.

## 10. Produce the printed QR codes

Only print after the final production URL and test flow work.

Simplest route: give a trusted print vendor the **PrivilegeID, QRURL and expiry** for approved recipients only and ask them to generate unique QR artwork. Do not send mobile numbers, home addresses or other unnecessary data. Random tokens are bearer access credentials, so treat this print export as private.

Optional local generator on Windows:

1. In Google Sheets select `Recipients`, choose **File → Download → Comma-separated values (.csv, current sheet)**.
2. Save under a private `private-exports` folder outside your Git repository (or use the ignored folder name in the repo).
3. Install Python if you do not have it, then open PowerShell in the package folder.
4. Run:

```powershell
py -m pip install "qrcode[pil]"
py tools/make_qr.py private-exports/recipients.csv --out qr-output
```

By default this skips inactive records and all `SYM-TEST-` IDs. For a test proof run, add `--include-tests`. It makes a PNG per active recipient plus `qr-contact-sheet.html`. This sheet is a private QR proof/contact sheet, not final print-ready card artwork.

Use a solid black QR on white with its four-module quiet zone intact. Start around 30–35 mm at this URL length and verify on the **actual printed material**, especially reflective metal. Keep an opaque white QR panel; do not print the QR as a low-contrast green/gold gradient. At CR80 card size (85.60 × 53.98 mm), confirm space and printer bleed/safe margins with the vendor. The supplied design-direction ZIP remains your creative reference; this package does not claim to contain approved metal-card production artwork.

## 11. Operate the campaign

Filter `Requests` by **TestRecord=FALSE** and **Status=New**. Assign someone in AssignedTo, call from the designated concierge number, verify the recipient, confirm scope/location and book manually. Update the status through Contact attempted, Customer reached, Eligibility checked, Vendor assigned, Booking confirmed and Completed. Use Cancelled or Unable to fulfil for exceptions.

Set ConfirmedServiceDate and CompletedAt manually. The customer success page confirms only a saved request; it does not claim a booking is confirmed and does not provide a live booking-status tracker.

All saved requests, including cancelled requests, count towards MaxRedemptions. Only an authorised operator should increase the allowance after an approved exception. There are no automatic vendor bookings, emails, SMS, WhatsApp sends, request notifications or satisfaction surveys in this build. Someone must monitor the private Requests tab.

Pause new requests immediately by setting `Settings → CampaignActive=FALSE`. Restrict spreadsheet/script access to the people operating the campaign. Do not rename the operational tabs/headers or alter generated tokens during the campaign.

## 12. Common fixes

| What you see | What to check |
| --- | --- |
| Invitation-only message at root | Normal; use an actual QRURL, or `/?demo=1` for a visual-only preview |
| Invitation is not active yet | Real card in TEST mode; switch to LIVE only after launch preparation |
| Missing/invalid expiry | Fill ValidUntil with YYYY-MM-DD for that recipient |
| Backend is being set up | Netlify variables must exist in Functions scope; redeploy |
| Invalid backend response or cannot confirm save | Check /exec deployment, Anyone access, account permissions and Netlify Function logs; retry the unchanged request |
| AUTH error | Copy exactly the same BACKEND_SECRET from Apps Script properties into Netlify, then redeploy |
| Function route 404 | Confirm repository root, functions directory and Git-connected deployment; do not upload only public/ |
| Already requested | Find the request in Requests. For a test only, increase that test record's allowance |
| Pincode unavailable | Check MANUAL versus ALLOWLIST and the confirmed ServicePincodes value |
| App Script code change not reflected | Deploy → Manage deployments → Edit → New version → Deploy; keep the same /exec deployment URL |
| Sheet changes not reflected | Edit Recipients after setup, not Sheet1. Sheet configuration is read on every lookup/submit |
| Terms changed during form filling | Reload the original QR link and accept the current policy version |

If your organisation does not permit an anonymous Apps Script web app, this exact architecture needs an administrator-approved alternative backend. Do not make the recipient spreadsheet public to work around that restriction.

## Optional local checks

With Node.js 22 or later, in PowerShell at the package root:

```powershell
node --test tests/backend.test.mjs tests/proxy.test.mjs tests/setup.test.mjs
node tools/preview.mjs
```

Open the local demo URL printed by the second command. It is **visual-only** and never writes to Google Sheets. Stop it with Ctrl+C. The local test fixtures contain fictional records only.

## Official setup references

- [Google Apps Script web app deployment](https://developers.google.com/apps-script/guides/web)
- [Apps Script properties](https://developers.google.com/apps-script/guides/properties)
- [Apps Script lock service](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Apps Script Content Service and redirects](https://developers.google.com/apps-script/guides/content)
- [Netlify Functions](https://docs.netlify.com/build/functions/overview/)
- [Netlify function environment variables](https://docs.netlify.com/build/functions/environment-variables/)
- [Netlify pricing and allowances](https://www.netlify.com/pricing/)

These references were checked while preparing this guide. Menu labels and plan allowances can change; follow the equivalent controls shown in your accounts.
