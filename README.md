# ChatDrill Playwright Automation

End-to-end test automation for the [ChatDrill](https://app.chatdrill.com/) admin panel, built with **Playwright** and **javaScript**. The suite performs data-driven bulk creation of **Leads** and **AI Knowledge articles** from CSV files and generates an HTML report for every run.

## Purpose

Manually creating dozens of records is slow and error-prone. This project automates it and doubles as a regression check for the following flows:

- Login (including the "Use here" multi-device session prompt)
- Leads: create a lead with name, phone, email, location, status, source and notes
- AI Knowledge: create an article with title, category and content, with the "visible to visitors" option enabled

## Test Coverage

| Module | Spec file | Data file | Test cases |
|---|---|---|---|
| Leads | `tests/add-leads.spec.ts` | `leads.csv` | 50 |
| AI Knowledge | `tests/add-articles.spec.ts` | `articles.csv` | 10 |

Each CSV row becomes its own test case, so every record appears individually (pass or fail) in the report.

## Tech Stack

- [Playwright Test](https://playwright.dev/) (`@playwright/test`)
- TypeScript
- Node.js
- `csv-parse` for reading test data

## Project Structure

```
chatdrill-lead/
├── tests/
│   ├── add-leads.spec.ts        # Bulk add leads from leads.csv
│   └── add-articles.spec.ts     # Bulk add AI Knowledge articles from articles.csv
├── leads.csv                    # Test data: 50 unique leads
├── articles.csv                 # Test data: 10 unique articles
├── playwright.config.ts         # Playwright configuration and reporters
├── package.json
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A ChatDrill account with access to Leads and AI Knowledge

## Setup

```bash
git clone https://github.com/Bibisha-sapkota/chatdrill-playwright-ai-knaowledge.git
cd chatdrill-playwright-ai-knaowledge
npm install
npx playwright install chromium
```

Update the `EMAIL` and `PASSWORD` constants at the top of each spec file with your own test account.

## Running the Tests

```bash
# Run everything
npx playwright test

# Run a single module
npx playwright test add-leads
npx playwright test add-articles

# List all detected tests without running them
npx playwright test --list

# Open the HTML report
npx playwright show-report
```

## Reports and Debugging

- **HTML report**: generated in `playwright-report/` after every run
- **Screenshots, video and trace**: kept automatically for failed tests in `test-results/`
- **Trace viewer**: `npx playwright show-trace test-results/<test-folder>/trace.zip`
- **Console log**: progress is printed per record, e.g. `✅ [1/10] Added: Refund policy (Billing)`

## Design Notes

- Tests run **serially with 1 worker** and share a single login session.
- Login handles the **"Use here"** screen that appears when the account is already open on another device.
- Test data is kept in CSV files, so new records can be added without touching the test code.

## Known Limitations

- Created records are not deleted automatically, so clean up test data after a run.
- Running the same data twice may trigger a duplicate-lead warning.
- Running while the account is open elsewhere logs that session out ("Use here" behavior).
- Locators rely on field placeholders and button labels, so UI text changes may require updates.

## Author

**Bibisha Sapkota**, QA Engineer
