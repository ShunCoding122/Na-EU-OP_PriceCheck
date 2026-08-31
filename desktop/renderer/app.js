const MAX_SLOTS = 4;
const storageKey = "op-market-compare-local-v1";
let configured = false;
let unlocked = false;
let active = 0;
let eurUsd = 1.09;
let slots = loadSlots();

function blankMarket() { return { name: "", url: "", capture: "", chart: "", ocr: "", sales: ["", "", "", "", ""], avg7: "" }; }
function blankSlot() { return { code: "", tcg: blankMarket(), cardmarket: blankMarket(), history: [] }; }
function loadSlots() { try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (Array.isArray(saved) && saved.length === MAX_SLOTS) return saved; } catch {} return Array.from({ length: MAX_SLOTS }, blankSlot); }
function persist() { localStorage.setItem(storageKey, JSON.stringify(slots.map(slot => ({ ...slot, tcg: { ...slot.tcg, capture: "", chart: "" }, cardmarket: { ...slot.cardmarket, capture: "", chart: "" } })))); }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
function usd(value) { return `$${Number(value || 0).toFixed(2)}`; }
function eur(value) { return `€${Number(value || 0).toFixed(2)}`; }
function tcgAverage(slot) { const nums = slot.tcg.sales.map(Number).filter(value => Number.isFinite(value) && value > 0); return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; }
function textPrices(text) { const marker = text.toLowerCase().lastIndexOf("latest sales"); const slice = marker >= 0 ? text.slice(marker) : text; return Array.from(slice.matchAll(/\$\s*([0-9]+(?:[,.][0-9]{1,2})?)/g)).map(match => match[1].replace(",", "")).slice(0, 5); }
function cardmarketAvg7(text) { const match = text.match(/(?:avg\s*7|7\s*[- ]?days?\s*average(?:\s*price)?)[^€0-9]{0,80}(?:€\s*)?([0-9]+(?:[,.][0-9]{1,2})?)/i) ?? text.match(/€\s*([0-9]+(?:[,.][0-9]{1,2})?)/); return match?.[1]?.replace(",", "") || ""; }
function linePoints(values) { if (!values.length) return ""; const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1; return values.map((value, index) => `${12 + index * (276 / Math.max(values.length - 1, 1))},${94 - ((value - min) / range) * 72}`).join(" "); }

function renderAuth() {
  const action = configured ? "Unlock" : "Create local password";
  document.querySelector("#app").innerHTML = `<section class="auth"><p class="eyebrow">LOCAL-ONLY WORKSPACE</p><h1>OP Market Compare</h1><p>${configured ? "Enter the password stored on this computer." : "Create a password for this computer. It is saved as a secure hash and never leaves this device."}</p><form id="auth-form"><label>Password<input id="password" type="password" minlength="12" autofocus required /></label><p id="auth-error" class="error"></p><button>${action}</button></form></section>`;
  document.querySelector("#auth-form").addEventListener("submit", async event => { event.preventDefault(); const password = document.querySelector("#password").value; const result = configured ? await window.workspace.login(password) : await window.workspace.setupPassword(password); if (!result.ok) document.querySelector("#auth-error").textContent = result.error; });
}

function screenshot(src, alt) { return src ? `<img class="shot" src="${src}" alt="${alt}" />` : `<p class="hint">No capture yet.</p>`; }
function renderMarket(slot, market) {
  const data = slot[market]; const isTcg = market === "tcg"; const price = isTcg ? tcgAverage(slot) : Number(data.avg7 || 0); const label = isTcg ? "TCGplayer · USD" : "Cardmarket · EUR";
  const values = isTcg ? `<div class="sales">${data.sales.map((value, index) => `<label>Sale ${index + 1}<input data-market="tcg" data-sale="${index}" value="${escapeHtml(value)}" inputmode="decimal" placeholder="0.00" /></label>`).join("")}</div>` : `<label>Detected AVG7 (€)<input data-market="cardmarket" data-field="avg7" value="${escapeHtml(data.avg7)}" inputmode="decimal" placeholder="0.00" /></label>`;
  return `<article class="market-card"><span>${label}</span><label>Chosen product name<input data-market="${market}" data-field="name" value="${escapeHtml(data.name)}" placeholder="Fills from page title on capture" /></label><label>Current selected URL<input data-market="${market}" data-field="url" value="${escapeHtml(data.url)}" placeholder="Captured from the panel" /></label><div class="capture-actions"><button data-action="capture-price" data-market="${market}">Capture visible price</button><button class="ghost" data-action="capture-chart" data-market="${market}">Capture visible chart</button></div>${values}<strong class="metric">${isTcg ? "Average " + usd(price) : eur(price)}</strong>${screenshot(data.chart || data.capture, `${label} local capture`)}</article>`;
}
function renderWorkspace() {
  const slot = slots[active]; const tcg = tcgAverage(slot); const cm = Number(slot.cardmarket.avg7 || 0); const cmUsd = cm * eurUsd; const spread = tcg - cmUsd; const tcgPoints = linePoints(slot.history.map(item => item.tcg)); const cmPoints = linePoints(slot.history.map(item => item.cm));
  document.querySelector("#app").innerHTML = `<header><div><p class="eyebrow">LOCAL CAPTURE WORKBENCH</p><h1>OP Market Compare</h1></div><div class="fx">EUR → USD <input id="fx" value="${eurUsd}" inputmode="decimal" /><button id="refresh-fx" class="ghost">Refresh</button></div></header><p class="how">1. Enter up to four numbers. 2. Open a slot. 3. Use the real TCGplayer/Cardmarket panes below to choose a result. 4. Put Latest Sales or AVG7 on screen, then capture it.</p><section class="slots">${slots.map((item, index) => `<label class="slot ${index === active ? "selected" : ""}"><span>Card ${index + 1}</span><input data-slot-code="${index}" value="${escapeHtml(item.code)}" placeholder="ST15-005" /><button data-action="open-slot" data-slot="${index}">Open</button></label>`).join("")}</section><section class="market-grid">${renderMarket(slot, "tcg")}${renderMarket(slot, "cardmarket")}</section><section class="result"><article><span>TCGplayer average</span><strong>${usd(tcg)}</strong><small>${slot.tcg.sales.filter(Boolean).length}/5 sales</small></article><article><span>Cardmarket AVG7</span><strong>${eur(cm)}</strong><small>${usd(cmUsd)} converted</small></article><article class="${spread >= 0 ? "positive" : "negative"}"><span>TCG − Cardmarket</span><strong>${spread >= 0 ? "+" : "−"}${usd(Math.abs(spread))}</strong><small>Selections stay independent</small></article><button id="save-point">Save comparison point</button></section><section class="history"><div><strong>TCGplayer captured history</strong><svg viewBox="0 0 300 110"><line x1="12" y1="94" x2="288" y2="94" /><polyline points="${tcgPoints}" /></svg></div><div><strong>Cardmarket captured history</strong><svg viewBox="0 0 300 110"><line x1="12" y1="94" x2="288" y2="94" /><polyline points="${cmPoints}" /></svg></div></section>`;
  bindWorkspaceEvents();
}

function bindWorkspaceEvents() {
  document.querySelectorAll("[data-slot-code]").forEach(input => input.addEventListener("input", event => { slots[Number(event.target.dataset.slotCode)].code = event.target.value.toUpperCase(); persist(); }));
  document.querySelectorAll("[data-action='open-slot']").forEach(button => button.addEventListener("click", async () => { active = Number(button.dataset.slot); const code = slots[active].code.trim(); renderWorkspace(); if (code) await window.workspace.loadSlot(code); }));
  document.querySelectorAll("[data-field]").forEach(input => input.addEventListener("input", event => { slots[active][event.target.dataset.market][event.target.dataset.field] = event.target.value; persist(); renderWorkspace(); }));
  document.querySelectorAll("[data-sale]").forEach(input => input.addEventListener("input", event => { slots[active].tcg.sales[Number(event.target.dataset.sale)] = event.target.value; persist(); renderWorkspace(); }));
  document.querySelectorAll("[data-action='capture-price'],[data-action='capture-chart']").forEach(button => button.addEventListener("click", () => capture(button.dataset.market, button.dataset.action === "capture-chart")));
  document.querySelector("#fx").addEventListener("input", event => { eurUsd = Number(event.target.value) || 0; persist(); renderWorkspace(); });
  document.querySelector("#refresh-fx").addEventListener("click", refreshFx);
  document.querySelector("#save-point").addEventListener("click", () => { const slot = slots[active]; slot.history.push({ at: new Date().toISOString(), tcg: tcgAverage(slot), cm: Number(slot.cardmarket.avg7 || 0) }); slot.history = slot.history.slice(-30); persist(); renderWorkspace(); });
}

async function capture(market, chart) {
  const button = document.querySelector(`[data-action='${chart ? "capture-chart" : "capture-price"}'][data-market='${market}']`); button.textContent = "Reading local screenshot…"; button.disabled = true;
  const result = await window.workspace.capture(market); const data = slots[active][market];
  if (result.error) { button.textContent = result.error; button.disabled = false; return; }
  data.name = data.name || result.title; data.url = result.url; data.ocr = result.text; if (chart) data.chart = result.dataUrl; else { data.capture = result.dataUrl; if (market === "tcg") data.sales = textPrices(result.text).concat(Array(5).fill("")).slice(0, 5); else data.avg7 = cardmarketAvg7(result.text); }
  persist(); renderWorkspace();
}

async function refreshFx() { const result = await window.workspace.eurUsd(); if (result.rate) { eurUsd = result.rate; persist(); renderWorkspace(); } }

async function init() { const status = await window.workspace.authStatus(); configured = status.configured; renderAuth(); window.workspace.onUnlocked(() => { unlocked = true; renderWorkspace(); }); }
init();
