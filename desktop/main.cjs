const { app, BaseWindow, WebContentsView, ipcMain, shell } = require("electron");
const { createWorker } = require("tesseract.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

let win;
let dashboard;
let tcgView;
let cardmarketView;
let authenticated = false;
let ocrWorker;

const TCG_HOSTS = new Set(["tcgplayer.com", "www.tcgplayer.com"]);
const CARDMARKET_HOSTS = new Set(["cardmarket.com", "www.cardmarket.com"]);

function localAuthFile() {
  return path.join(app.getPath("userData"), "local-password.json");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function readAuth() {
  try { return JSON.parse(fs.readFileSync(localAuthFile(), "utf8")); } catch { return null; }
}

function writeAuth(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  fs.writeFileSync(localAuthFile(), JSON.stringify({ salt, hash: hashPassword(password, salt) }), { mode: 0o600 });
}

function passwordsMatch(password) {
  const record = readAuth();
  if (!record || typeof password !== "string") return false;
  const supplied = Buffer.from(hashPassword(password, record.salt), "hex");
  const expected = Buffer.from(record.hash, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function tcgSearch(code) {
  return `https://www.tcgplayer.com/search/one-piece-card-game/product?Language=English&productLineName=one-piece-card-game&q=${encodeURIComponent(code)}&view=grid`;
}

function cardmarketSearch(code) {
  return `https://www.cardmarket.com/en/OnePiece/Products/Search?category=-1&searchString=${encodeURIComponent(code)}&searchMode=v2`;
}

function isAllowedMarketUrl(market, candidate) {
  try {
    const url = new URL(candidate);
    const permitted = market === "tcg" ? TCG_HOSTS : CARDMARKET_HOSTS;
    return url.protocol === "https:" && permitted.has(url.hostname);
  } catch { return false; }
}

function configureExternalView(view) {
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

function layout() {
  if (!win || win.isDestroyed()) return;
  const [width, height] = win.getContentSize();
  if (!authenticated) {
    dashboard.setBounds({ x: 0, y: 0, width, height });
    tcgView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    cardmarketView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    return;
  }
  const dashboardHeight = Math.min(430, Math.max(328, Math.round(height * 0.39)));
  const gap = 2;
  const half = Math.floor((width - gap) / 2);
  dashboard.setBounds({ x: 0, y: 0, width, height: dashboardHeight });
  tcgView.setBounds({ x: 0, y: dashboardHeight, width: half, height: height - dashboardHeight });
  cardmarketView.setBounds({ x: half + gap, y: dashboardHeight, width: width - half - gap, height: height - dashboardHeight });
}

function unlock() {
  authenticated = true;
  layout();
  dashboard.webContents.send("workspace:unlocked");
}

async function getOcrWorker() {
  if (!ocrWorker) {
    const cachePath = path.join(app.getPath("userData"), "ocr-cache");
    fs.mkdirSync(cachePath, { recursive: true });
    ocrWorker = await createWorker("eng", 1, { cachePath });
  }
  return ocrWorker;
}

async function captureMarket(market) {
  const view = market === "tcg" ? tcgView : cardmarketView;
  const image = await view.webContents.capturePage();
  let text = "";
  let ocrError = "";
  try {
    const worker = await getOcrWorker();
    const result = await worker.recognize(image.toPNG());
    text = result.data.text;
  } catch (error) {
    ocrError = error instanceof Error ? error.message : "OCR failed";
  }
  return { dataUrl: image.toDataURL(), text, ocrError, title: view.webContents.getTitle(), url: view.webContents.getURL() };
}

function createWindow() {
  win = new BaseWindow({ width: 1680, height: 1060, minWidth: 1100, minHeight: 740, title: "OP Market Compare — Local" });
  dashboard = new WebContentsView({ webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false } });
  tcgView = new WebContentsView({ webPreferences: { contextIsolation: true, nodeIntegration: false, partition: "persist:tcgplayer" } });
  cardmarketView = new WebContentsView({ webPreferences: { contextIsolation: true, nodeIntegration: false, partition: "persist:cardmarket" } });
  configureExternalView(tcgView);
  configureExternalView(cardmarketView);
  win.contentView.addChildView(dashboard);
  win.contentView.addChildView(tcgView);
  win.contentView.addChildView(cardmarketView);
  dashboard.webContents.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.on("resize", layout);
  win.on("closed", async () => {
    if (ocrWorker) await ocrWorker.terminate();
    for (const view of [dashboard, tcgView, cardmarketView]) if (!view.webContents.isDestroyed()) view.webContents.close();
  });
  layout();
}

ipcMain.handle("auth:status", () => ({ configured: Boolean(readAuth()) }));
ipcMain.handle("auth:setup", (_, password) => {
  if (readAuth()) return { ok: false, error: "A local password already exists." };
  if (typeof password !== "string" || password.length < 12) return { ok: false, error: "Use at least 12 characters." };
  writeAuth(password); unlock(); return { ok: true };
});
ipcMain.handle("auth:login", (_, password) => {
  if (!passwordsMatch(password)) return { ok: false, error: "Incorrect password." };
  unlock(); return { ok: true };
});
ipcMain.handle("market:load-slot", async (_, code) => {
  if (!authenticated || typeof code !== "string" || !code.trim()) return { ok: false };
  const normalized = code.trim().toUpperCase();
  await Promise.allSettled([tcgView.webContents.loadURL(tcgSearch(normalized)), cardmarketView.webContents.loadURL(cardmarketSearch(normalized))]);
  return { ok: true };
});
ipcMain.handle("market:navigate", async (_, { market, url }) => {
  if (!authenticated || !["tcg", "cardmarket"].includes(market) || !isAllowedMarketUrl(market, url)) return { ok: false, error: "Only the selected marketplace can be opened here." };
  await (market === "tcg" ? tcgView : cardmarketView).webContents.loadURL(url);
  return { ok: true };
});
ipcMain.handle("market:capture", async (_, market) => {
  if (!authenticated || !["tcg", "cardmarket"].includes(market)) return { error: "Locked" };
  return captureMarket(market);
});
ipcMain.handle("fx:eur-usd", async () => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/EUR");
    const data = await response.json();
    return { rate: Number(data?.rates?.USD) || null };
  } catch { return { rate: null }; }
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
app.on("activate", () => { if (!win || win.isDestroyed()) createWindow(); });
