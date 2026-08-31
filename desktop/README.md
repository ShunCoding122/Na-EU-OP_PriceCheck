# Local desktop workbench

This is the local-first version of OP Market Compare. It opens a normal, user-controlled TCGplayer pane next to a normal, user-controlled Cardmarket pane.

## Workflow

1. Launch with `npm run desktop`.
2. Create a local password the first time. Only its hash is kept on this computer.
3. Enter one to four card numbers and click **Open** for the slot you want to work on.
4. Use the live marketplace panes below the controls to choose products. The two selections are intentionally independent.
5. On TCGplayer, show `Latest Sales` after opening `View More Data`; on Cardmarket, show the AVG7 area. Then click **Capture visible price**.
6. The desktop app takes a local screenshot and runs OCR on the displayed screen. It detects up to five TCGplayer dollar prices or Cardmarket AVG7, lets you correct the values, calculates the comparison, and retains your own history.
7. Scroll either marketplace pane to its graph and click **Capture visible chart** to place its screenshot in the local comparison card.

No background scans, stealth techniques, or scheduled navigation are included. The app only captures a page after you click its capture button.

## Local OCR

Tesseract OCR runs locally. On the first capture it may download/cache the English language model; subsequent captures use the cached local model. Make sure the intended price section is visible before capture, then correct any OCR mistake in the editable fields.

## Current scope

- Up to four independent comparison slots; duplicate a card number in slots to compare different versions.
- User-selected product pages, not automatic matching.
- Current EUR→USD rate can be refreshed through `open.er-api.com`; the rate remains editable.
- It is designed for a desktop/laptop. A normal browser website cannot embed the two marketplace sites as interactive panes because both deny cross-origin framing.

## Windows portable executable

The repository's **Build Windows desktop app** GitHub Action produces a portable x64 `.exe` after each desktop change. Download its `op-market-compare-windows-x64` artifact, extract it, then double-click `OP Market Compare Local.exe`.

To build it yourself on Windows:

```bash
npm ci
npm run desktop:package:win
```

The portable executable is written to `dist/`. It does not require a separate Node.js installation once built.
