# OP Market Compare

Local-first One Piece price-comparison workbench. Its primary product is the desktop app in [`desktop/`](desktop/README.md), not the hosted form.

## What the desktop app does

- Stores a password hash locally on the computer.
- Takes one to four card numbers; duplicate a number in multiple slots to compare different variants.
- Opens real, interactive TCGplayer and Cardmarket pages side-by-side inside a local desktop workspace.
- Lets the user choose the product and manually reveal the relevant price area.
- Captures the visible local screen on demand, uses local OCR to read up to five TCGplayer Latest Sales or a Cardmarket AVG7 value, calculates the comparison, converts EUR to USD, and stores a local history.
- Saves the visible price-chart captures alongside the comparison cards.

There are no scheduled scans, stealth settings, headless browsers, or background crawling. This app captures only after the user presses a capture button with the desired marketplace content already visible.

## Run the desktop workbench

```bash
npm install
npm run desktop
```

The first run asks the user to create the local password. On first OCR capture, the English OCR model is downloaded and cached locally.

## Optional web version

The Next.js app remains in the repository as a separate web companion. It requires `APP_PASSWORD` and `AUTH_SECRET` under `.env.local` and can be deployed later, but it cannot embed the two marketplaces as interactive side-by-side panes because the marketplaces deny cross-origin framing.

## Packaging later

Once the local workflow is proven, package the Electron app for macOS/Windows so it launches like a normal app instead of via `npm run desktop`.
