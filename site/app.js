// Töffcheck Startseite: Preis-Check, Modell-Ratgeber, Reifenalter und Warteliste.
import { manualCheck, exampleRows, num } from "./rechner.js";
import { parseInserat } from "./inserat.js";
import { MODELLNAMEN, motoscoutLinks } from "./modellnamen.js";
import { parseDateText, parseMfkText, stripMfkText, parseFirstRegistration, assessMfk, mfkSummary, formatDate } from "./mfk.js";

const $ = id => document.getElementById(id);
const chf = n => "CHF " + Math.round(n).toLocaleString("de-CH");
const zahl = n => Math.round(n).toLocaleString("de-CH");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const CANTONS = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];
const THIS_YEAR = new Date().getFullYear();

// ---------- Modellauswahl ----------
function fillModels() {
  const groups = {};
  sortiert().forEach(m => (groups[m.marke] ||= []).push(m));
  $("model").innerHTML = Object.entries(groups).map(([marke, list]) =>
    `<optgroup label="${esc(marke)}">${list.map(m => `<option value="${m.id}">${esc(m.marke + " " + m.modell)}</option>`).join("")}</optgroup>`
  ).join("") + `<option value="andere">Anderes Modell</option>`;
  $("typ").innerHTML = Object.entries(TYPEN).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join("");
  $("model-count").textContent = MODELLE.length;
}
fillModels();
$("w-canton").innerHTML = CANTONS.map(c => `<option${c === "ZH" ? " selected" : ""}>${c}</option>`).join("");
$("mfk-canton").innerHTML += CANTONS.map(c => `<option>${c}</option>`).join("");

// Frühere Sammeleinträge: Alte Direktlinks führen zum ersten neuen Eintrag.
const OLD_IDS = { "suzuki-gsx-r600-750": "suzuki-gsx-r600" };
const rawStart = new URLSearchParams(location.search).get("modell");
const start = OLD_IDS[rawStart] ?? rawStart;
$("model").value = start === "andere" || MODELLE.some(m => m.id === start) ? start : "yamaha-r7";
const currentModel = () => MODELLE.find(m => m.id === $("model").value) || null;

// ---------- Vergleichsangebote ----------
let rowId = 0;
function addRow(price = "", km = "", year = "", example = false) {
  const i = ++rowId;
  const row = document.createElement("div");
  row.className = "comp-row";
  const cls = example ? ' class="is-example"' : "";
  row.innerHTML = `<input${cls} type="number" inputmode="numeric" min="0" step="50" aria-label="Preis Angebot ${i}" value="${price}">
    <input${cls} type="number" inputmode="numeric" min="0" step="100" aria-label="Kilometer Angebot ${i}" value="${km}">
    <input${cls} type="number" inputmode="numeric" min="1970" max="${THIS_YEAR + 1}" aria-label="Jahrgang Angebot ${i}" placeholder="opt." value="${year}">
    <button type="button" class="icon-btn" aria-label="Angebot ${i} entfernen">×</button>`;
  row.dataset.example = example ? "1" : "";
  row.querySelector("button").onclick = () => { row.remove(); update(); };
  $("comp-rows").appendChild(row);
  return row;
}

// Beispielwerte sind markiert und dürfen nie als echte Eingaben gelten.
const AD_FIELDS = ["year", "km", "ask"];
const exampleFields = new Set();
function markAdExample() {
  AD_FIELDS.forEach(id => { exampleFields.add(id); $(id).classList.add("is-example"); });
}
function setAdReal(id) {
  exampleFields.delete(id); $(id).classList.remove("is-example");
}
function removeExampleRows() {
  [...$("comp-rows").children].filter(r => r.dataset.example).forEach(r => r.remove());
  while ($("comp-rows").children.length < 3) addRow();
}
function removeExamples() {
  removeExampleRows();
  [...exampleFields].forEach(id => { $(id).value = ""; setAdReal(id); });
}
function setRowReal(row) {
  row.dataset.example = "";
  row.querySelectorAll("input").forEach(i => i.classList.remove("is-example"));
}

if (start && $("model").value === start) {
  AD_FIELDS.forEach(id => { $(id).value = ""; });
  for (let i = 0; i < 3; i++) addRow();
} else {
  exampleRows().forEach(e => addRow(e.price, e.km, e.year, true));
  markAdExample();
}

function comps() {
  return [...$("comp-rows").children].map(el => {
    const [p, k, y] = el.querySelectorAll("input");
    return { price: p.value, km: k.value, year: y.value, example: !!el.dataset.example, el };
  });
}

const extras = () => [...document.querySelectorAll(".extra")].reduce((s, i) => s + (parseFloat(i.value) || 0), 0);

// ---------- Ergebnis ----------
let summary = "";
function update() {
  const rows = comps(), m = currentModel();
  const km = num($("km").value), ask = num($("ask").value), year = num($("year").value), add = extras();
  const r = manualCheck({ rows, km, ask, extras: add, year, model: m ? { year_from: m.von, year_to: m.bis } : null });
  const isExample = r.isExample || exampleFields.size > 0;
  const warn = [...r.warnings];
  rows.forEach(c => c.el.classList.toggle("outlier", r.outliers.includes(c)));
  $("example-note").hidden = !isExample;
  $("n").textContent = r.usableCount;
  $("est-label").textContent = km !== null && km >= 0 ? `Fairer Preis bei ${zahl(km)} km` : "Fairer Preis";
  const label = text => (isExample ? `Beispiel: ${text}` : text);
  const badge = $("badge"), tip = $("deal-tip");

  const mfkResult = renderMfk();
  const mfkLine = mfkSummary(mfkResult);
  if (mfkLine) warn.push(mfkLine.warn ?? { info: mfkLine.info });

  $("eff-row").hidden = true; tip.hidden = true; $("copy").disabled = true;
  if (r.status !== "ok") {
    badge.className = "badge none";
    badge.textContent = label(r.reason === "too_few" || r.reason === "km_missing" ? "Zu wenig Daten"
      : r.reason === "unreliable_scatter" ? "Keine zuverlässige Bewertung" : "Keine Bewertung");
    ["diff", "est", "range", "slope"].forEach(id => $(id).textContent = "–");
    $("verdict-text").textContent = r.priceSpan
      ? `${r.message} Deine Angebote liegen zwischen ${chf(r.priceSpan.low)} und ${chf(r.priceSpan.high)}.` : r.message;
    $("mark").style.left = "50%"; $("mark").classList.add("off");
    renderWarnings(warn);
    return;
  }

  $("est").textContent = chf(r.est);
  $("range").textContent = chf(r.low) + " – " + chf(r.high);
  $("slope").textContent = r.slopePer1000 === null ? "kein Trend" : chf(r.slopePer1000);
  if (!r.verdict) {
    badge.className = "badge none"; badge.textContent = label("Kein Urteil");
    $("diff").textContent = "–";
    $("verdict-text").textContent = "Trag einen realistischen verlangten Preis ein, dann gibt es ein Urteil.";
    $("mark").style.left = "50%"; $("mark").classList.add("off");
    renderWarnings(warn);
    return;
  }

  const eff = r.effective, d = r.diff;
  const delta = chf(Math.abs(eff - r.est));
  $("mark").classList.remove("off");
  $("eff-row").hidden = !add; $("eff").textContent = chf(eff);
  const pct = (Math.abs(d) * 100).toFixed(1);
  $("diff").textContent = (pct === "0.0" ? "" : d > 0 ? "+" : "−") + pct.replace(".", ",") + " %";
  const what = add ? "Mit den anstehenden Kosten liegt das Angebot" : "Das Angebot liegt";
  const verdict = { suspect: "Auffällig tief", good: "Guter Deal", fair: "Fair", high: "Zu teuer" }[r.verdict];
  badge.className = "badge " + { suspect: "fair", good: "good", fair: "fair", high: "bad" }[r.verdict];
  badge.textContent = label(verdict);
  $("verdict-text").textContent = isExample ? "Das ist nur eine Beispielrechnung. Trag dein Inserat und echte Vergleichsangebote ein."
    : r.verdict === "suspect" ? `${what} ${delta} unter dem fairen Preis. Das ist kein normales Schnäppchen: Unfall, Mängel, fehlende Papiere oder Betrug sind möglich. Nichts im Voraus zahlen und genau prüfen.`
    : r.verdict === "good" ? `${what} ${delta} unter dem fairen Preis. Schnell besichtigen und genau hinschauen, warum es so günstig ist.`
    : r.verdict === "high" ? `${what} ${delta} über dem fairen Preis. Mit deinen Vergleichsangeboten verhandeln.`
    : `${what} nah am fairen Preis (${d > 0 ? "+" : "−"}${delta}). Zustand und Belege entscheiden.`;
  $("mark").style.left = Math.min(100, Math.max(0, 50 + d * 200)) + "%";

  // Verhandlungshilfe: fairer Preis minus das, was nach dem Kauf noch ansteht
  if (!isExample && r.target !== null) {
    tip.hidden = false;
    tip.innerHTML = `Verhandlungsziel: <strong>${chf(r.target)}</strong>. Steig mit etwa <strong>${chf(r.opening)}</strong> ein und begründe es mit deinen Vergleichsangeboten${add ? " und den anstehenden Kosten" : ""}.`;
  } else if (!isExample && (r.verdict === "good" || r.verdict === "fair")) {
    tip.hidden = false;
    tip.textContent = "Der Preis liegt schon im fairen Bereich oder darunter. Verhandeln kannst du trotzdem, wichtiger ist jetzt eine gründliche Besichtigung.";
  }
  renderWarnings(warn);

  if (isExample) return; // Beispielrechnungen lassen sich nicht als Ergebnis kopieren
  const name = m ? `${m.marke} ${m.modell}` : "Anderes Modell";
  summary = [
    `Töffcheck: ${name}, ${year || "?"}, ${zahl(km)} km`,
    `Verlangt: ${chf(ask)}${add ? `, mit anstehenden Kosten ${chf(eff)}` : ""}`,
    `Fairer Preis: ${chf(r.est)} (Bereich ${chf(r.low)} – ${chf(r.high)})`,
    `Urteil: ${verdict} (${$("diff").textContent}), ${r.usableCount} Vergleichsangebote`,
    ...(mfkLine ? [`MFK: ${mfkResult.label}, letzte MFK ${mfkResult.lastText}, Datenqualität: ${mfkResult.reliability.label}, keine amtliche Auskunft`] : []),
    location.origin + location.pathname + "?modell=" + (m ? m.id : "")
  ].join("\n");
  $("copy").disabled = false;
}

// ---------- MFK-Check ----------
// Aus dem Inserat übernommene Hinweise, die kein eigenes Eingabefeld haben.
const MFK_TEXT_EMPTY = { conflict: false, nextDue: null, ambiguous: false };
let mfkFromText = MFK_TEXT_EMPTY;
let mfkShown = "";
const ASTRA_VETERAN = "https://www.astra.admin.ch/dam/de/sd-web/5Xwv1p543cGt/Weisungen%20f%C3%BCr%20Veteranenfahrzeuge.pdf";
function renderMfk() {
  const dateOf = id => parseDateText($(id).value);
  const year = exampleFields.has("year") ? null : num($("year").value);
  const r = assessMfk({
    firstReg: dateOf("mfk-first"), lastMfk: dateOf("mfk-last"), claim: $("mfk").value, source: $("mfk-source").value, canton: $("mfk-canton").value, veteran: $("mfk-veteran").value,
    year: Number.isInteger(year) ? year : null, ...mfkFromText
  });
  const invalid = ["mfk-first", "mfk-last"].filter(id => $(id).value.trim() && !dateOf(id));
  const key = JSON.stringify([r, invalid]);
  if (key === mfkShown) return r;
  mfkShown = key; // Nur bei Änderungen neu zeichnen, damit abgehakte Fragen erhalten bleiben
  const list = items => `<ul class="mfk-list">${items.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const bad = invalid.length ? `<p class="note">Dieses Datum verstehe ich nicht: ${invalid.map(id => esc($(id).value.trim())).join(", ")}. Schreib es so: 04.2021 oder 2021.</p>` : "";
  if (r.status === "empty") { $("mfk-out").innerHTML = bad; return r; }
  // Grün gibt es nur, wenn jemand das Dokument gesehen hat
  const cls = r.risk === "low" && r.evidence !== "document" ? "none" : { low: "good", medium: "fair", high: "bad", unknown: "none" }[r.risk];
  const claimed = r.evidence === "seller" && r.lastMfk ? " (laut Angabe, nicht bestätigt)" : "";
  $("mfk-out").innerHTML = `${bad}<div><span class="badge ${cls}">${esc(r.label)}</span></div>
    <div class="mfk-axes">
      <div class="mfk-axis"><span>MFK-Risiko (Einschätzung)</span><strong>${esc(r.riskLabel)}</strong></div>
      <div class="mfk-axis ${r.reliability.level}"><span>Datenqualität</span><strong>${esc(r.reliability.label)}</strong><small>${esc(r.reliability.detail)}</small></div>
    </div>
    <dl class="figures">
      <div><dt>Erste Inverkehrsetzung</dt><dd>${esc(r.firstText)}</dd></div>
      <div><dt>Letzte MFK${claimed}</dt><dd>${esc(r.lastText)}</dd></div>
      <div><dt>Nächste Prüfung (${esc(r.next ? r.next.label : "Schätzung")})</dt><dd>${esc(r.next ? r.next.text : "nicht einschätzbar")}</dd></div>
    </dl>
    ${r.conflicts.length ? `<div><h4>Widersprüche</h4>${list(r.conflicts)}</div>` : ""}
    <div><h4>Einschätzung</h4>${list(r.assessment)}</div>
    <div><h4>Unsicherheiten</h4>${list(r.uncertainties)}</div>
    <div><h4>Fragen für die Besichtigung</h4><ul class="checks">${r.questions.map(q => `<li><label><input type="checkbox"><span>${esc(q)}</span></label></li>`).join("")}</ul></div>
    <p class="note">Keine amtliche Auskunft. Grundlage: <a href="https://www.fedlex.admin.ch/eli/cc/1995/4425_4425_4425/de#art_33" target="_blank" rel="noopener">Art. 33 VTS</a>, Regelfristen für Motorräder${r.veteran === "claimed" || r.veteran === "seen" ? `, und <a href="${ASTRA_VETERAN}" target="_blank" rel="noopener">ASTRA-Weisungen für Veteranenfahrzeuge</a> vom 10. Juli 2026` : ""}. Massgebend ist das Aufgebot des Strassenverkehrsamts.</p>`;
  return r;
}
function fillMfkFromText(text) {
  const p = parseMfkText(text), first = parseFirstRegistration(text);
  const hasMfk = p.claim !== "unknown" || p.lastMfk || p.nextDue || p.conflict || p.veteran !== "unknown";
  if (first) $("mfk-first").value = formatDate(first);
  if (hasMfk) {
    $("mfk").value = p.conflict ? "unknown" : p.claim;
    $("mfk-last").value = p.lastMfk ? formatDate(p.lastMfk) : "";
    $("mfk-source").value = "seller";
    $("mfk-veteran").value = p.veteran;
    mfkFromText = { conflict: p.conflict, nextDue: p.nextDue, ambiguous: p.ambiguous };
  }
  if (first || hasMfk) $("mfk-check").open = true;
  return !!(first || hasMfk);
}

// Mini-Leiste auf dem Handy: zeigt das Urteil, solange man im Formular ist und das Ergebnis nicht sieht
function syncMini() {
  $("mini-badge").className = $("badge").className;
  $("mini-badge").textContent = $("badge").textContent;
  $("mini-diff").textContent = $("diff").textContent === "–" ? "" : $("diff").textContent;
}
const seen = new Map();
const io = new IntersectionObserver(entries => {
  entries.forEach(e => seen.set(e.target, e.isIntersecting));
  $("mini").hidden = !(seen.get(document.querySelector(".tool")) && !seen.get(document.querySelector(".result")));
});
document.querySelectorAll(".tool, .result").forEach(el => io.observe(el));

function renderWarnings(list) {
  syncMini();
  $("warnings").innerHTML = list.map(w => typeof w === "string" ? `<li>${esc(w)}</li>` : `<li class="info">${esc(w.info)}</li>`).join("");
}

$("copy").onclick = async () => {
  const btn = $("copy");
  try { await navigator.clipboard.writeText(summary); btn.textContent = "Kopiert"; }
  catch { btn.textContent = "Kopieren ging nicht"; }
  setTimeout(() => btn.textContent = "Ergebnis kopieren", 1800);
};

// ---------- Ratgeber ----------
const checkItem = t => `<li><label><input type="checkbox"><span>${esc(t)}</span></label></li>`;
function renderGuide() {
  const m = currentModel();
  const typ = m ? m.typ : $("typ").value;
  $("typ-wrap").hidden = !!m;
  $("rat-marke").textContent = m ? m.marke : "Dein";
  $("rat-modell").textContent = m ? m.modell : TYPEN[typ].name;
  $("rat-kurz").textContent = m ? m.kurz : `Für dieses Modell gibt es noch keinen eigenen Eintrag. Unten stehen die typischen Punkte für ${TYPEN[typ].name === "Roller" ? "Roller" : "die Töff-Art " + TYPEN[typ].name}, und weiter unten die Checkliste für jeden Töff.`;
  $("rat-hinweis").hidden = !(m && m.hinweis);
  $("rat-hinweis").textContent = m && m.hinweis ? m.hinweis : "";
  $("proscons").hidden = !m;
  $("rat-plus").innerHTML = m ? m.plus.map(t => `<li>${esc(t)}</li>`).join("") : "";
  $("rat-minus").innerHTML = m ? m.minus.map(t => `<li>${esc(t)}</li>`).join("") : "";
  $("rat-check-title").hidden = !m;
  $("rat-check-title").textContent = m ? `Darauf achten bei der ${m.modell}` : "";
  $("rat-checks").innerHTML = m ? m.pruefen.map(checkItem).join("") : "";
  $("rat-typ-title").textContent = `Typisch für ${TYPEN[typ].name === "Roller" ? "Roller" : "die Töff-Art " + TYPEN[typ].name}`;
  $("rat-typ").innerHTML = TYPEN[typ].pruefen.map(checkItem).join("");
  $("rat-page").hidden = !m;
  if (m) $("rat-page").href = `modell/${m.id}/`;
  const rows = m ? [
    ["Baujahre", jahreText(m)],
    ["Art", TYPEN[m.typ].name],
    ["Motor", m.motor],
    ["Kategorie A beschränkt", (m.a2 === true ? '<span class="yes">Ja.</span> ' : m.a2 === false ? "Nein. " : "Unklar. Leistung im Fahrzeugausweis prüfen. ") + esc(m.a2text || "")]
  ] : [["Art", TYPEN[typ].name]];
  $("spec").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${k.startsWith("Kategorie") ? v : esc(v)}</dd></div>`).join("");
}

function onModelChange() {
  removeExamples();
  const m = currentModel();
  const url = new URL(location.href);
  if (m) url.searchParams.set("modell", m.id); else url.searchParams.delete("modell");
  history.replaceState(null, "", url);
  document.title = m ? `${m.marke} ${m.modell} gebraucht kaufen: Preis-Check und Checkliste | Töffcheck` : "Töffcheck: Fairer Preis für gebrauchte Motorräder in der Schweiz";
  $("find-q").value = suchbegriff(m); renderLinks();
  renderGuide(); update();
}

// ---------- Angebote suchen (nur Links, die Plattformen werden nicht ausgelesen) ----------
const suchbegriff = m => m ? `${m.marke} ${m.modell.split("/")[0].replace(/\(.*?\)/g, "").trim()}` : "";
function renderLinks() {
  const q = encodeURIComponent($("find-q").value.trim());
  const links = [
    ...motoscoutLinks(currentModel()).map(l => [l.label, l.url]),
    ["ricardo", `https://www.ricardo.ch/de/s/${q}`],
    ["tutti.ch", `https://www.tutti.ch/de/q/suche?query=${q}`],
    ["Facebook Marketplace", `https://www.facebook.com/marketplace/search/?query=${q}`]
  ];
  $("find-links").innerHTML = links.map(([name, url]) => `<a class="find-link" href="${url}" target="_blank" rel="noopener">${name} ↗</a>`).join("");
}
$("find-q").addEventListener("input", renderLinks);
$("find-q").value = suchbegriff(currentModel());
renderLinks();

// ---------- Inserat-Text übernehmen ----------
// Liest Angaben aus kopiertem Text. Übernommen wird erst, wenn man sie geprüft hat.
const readPaste = () => parseInserat($("paste").value, { models: MODELLE, names: MODELLNAMEN });
function showReview(target) {
  const out = $("paste-out"), box = $("paste-review");
  if (!$("paste").value.trim()) { box.hidden = true; out.textContent = "Kopier zuerst einen Inserat-Text ins Feld."; return; }
  const r = readPaste();
  out.textContent = "";
  box.dataset.target = target;
  const modelField = target === "ad" ? `<label class="span-2" for="rv-model">Modell<select id="rv-model">${$("model").innerHTML}</select></label>` : "";
  box.innerHTML = `<h4>Erkannt, bitte prüfen</h4>
    <div class="fields">${modelField}
      <label for="rv-price">Verkaufspreis <small>(CHF)</small><input id="rv-price" type="number" inputmode="numeric" min="0" step="50" value="${r.price ?? ""}"></label>
      <label for="rv-km">Kilometerstand<input id="rv-km" type="number" inputmode="numeric" min="0" step="100" value="${r.km ?? ""}"></label>
      <label for="rv-year">Jahrgang<input id="rv-year" type="number" inputmode="numeric" min="1950" max="${THIS_YEAR + 1}" value="${r.year ?? ""}"></label>
    </div>
    ${r.candidates.length > 1 ? `<div class="row-actions rv-choices">${r.candidates.map(v => `<button type="button" class="btn btn-small btn-ghost" data-price="${v}">${chf(v)} ist der Preis</button>`).join("")}</div>` : ""}
    ${r.hints.length ? `<ul class="rv-hints">${r.hints.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    ${r.ignored.length ? `<p class="note">Nicht als Verkaufspreis gezählt: ${r.ignored.map(i => `${chf(i.value)} (${esc(i.why)})`).join(", ")}.</p>` : ""}
    <div class="row-actions">
      <button type="button" class="btn btn-small btn-red" id="rv-apply">Übernehmen</button>
      <button type="button" class="btn btn-small btn-ghost" id="rv-cancel">Abbrechen</button>
    </div>`;
  if (target === "ad") $("rv-model").value = r.model ? r.model.id : $("model").value;
  box.hidden = false;
  box.scrollIntoView({ block: "nearest" });
}
function applyReview() {
  const box = $("paste-review"), text = $("paste").value, out = $("paste-out");
  const price = $("rv-price").value, km = $("rv-km").value, year = $("rv-year").value;
  if (box.dataset.target === "comp") {
    removeExampleRows();
    const empty = [...$("comp-rows").children].find(row => [...row.querySelectorAll("input")].every(i => !i.value));
    const row = empty || addRow();
    const [p, k, y] = row.querySelectorAll("input");
    p.value = price; k.value = km; y.value = year;
    (!price ? p : !km ? k : p).focus?.();
    out.textContent = !price ? "Übernommen. Der Preis fehlt noch." : !km ? "Übernommen. Die Kilometer fehlen noch." : "Als Vergleichsangebot übernommen.";
  } else {
    const model = $("rv-model").value;
    if (model !== $("model").value) { $("model").value = model; onModelChange(); }
    [["ask", price], ["km", km], ["year", year]].forEach(([id, v]) => { $(id).value = v; setAdReal(id); });
    const mfkFound = fillMfkFromText(text);
    out.textContent = (!price ? "Übernommen. Der Preis fehlt noch, trag ihn oben ein." : "Oben übernommen.") + (mfkFound ? " MFK-Angaben stehen unter D." : "");
  }
  box.hidden = true; box.innerHTML = "";
  $("paste").value = "";
  update();
}
$("paste-comp").onclick = () => showReview("comp");
$("paste-ad").onclick = () => showReview("ad");
$("paste-review").addEventListener("click", e => {
  const choice = e.target.closest("[data-price]");
  if (choice) { $("rv-price").value = choice.dataset.price; return; }
  if (e.target.id === "rv-apply") applyReview();
  if (e.target.id === "rv-cancel") { $("paste-review").hidden = true; $("paste-review").innerHTML = ""; }
});

document.addEventListener("input", e => {
  if (!e.target.closest(".tool")) return;
  if (AD_FIELDS.includes(e.target.id)) setAdReal(e.target.id);
  if (e.target.id === "mfk" || e.target.classList.contains("mfk-input")) mfkFromText = MFK_TEXT_EMPTY;
  const row = e.target.closest(".comp-row");
  if (row) setRowReal(row);
  update();
});
$("model").addEventListener("change", onModelChange);
$("typ").addEventListener("change", () => { renderGuide(); update(); });
$("add-comp").onclick = () => { addRow().querySelector("input").focus(); update(); };
$("clear").onclick = () => {
  $("comp-rows").innerHTML = ""; for (let i = 0; i < 3; i++) addRow();
  removeExamples();
  $("ask").value = ""; $("km").value = ""; document.querySelectorAll(".extra").forEach(i => i.value = "");
  $("mfk").value = "unknown"; $("mfk-first").value = ""; $("mfk-last").value = ""; $("mfk-source").value = "seller"; $("mfk-canton").value = ""; $("mfk-veteran").value = "unknown";
  mfkFromText = MFK_TEXT_EMPTY;
  update();
};
$("print").onclick = () => window.print();
if (start && $("model").value === start) onModelChange(); else { renderGuide(); update(); }

// ---------- Reifenalter ----------
$("dot").addEventListener("input", e => {
  const v = e.target.value.replace(/\D/g, ""), out = $("dot-out");
  e.target.value = v;
  if (v.length < 4) { out.textContent = ""; return; }
  const week = +v.slice(0, 2), year = 2000 + +v.slice(2);
  if (week < 1 || week > 53 || year > THIS_YEAR) { out.textContent = "Das ergibt kein gültiges Datum. Prüf die Ziffern nochmals."; return; }
  const made = new Date(year, 0, 1 + (week - 1) * 7);
  const months = Math.max(0, Math.round((Date.now() - made) / (1000 * 60 * 60 * 24 * 30.44)));
  const y = Math.floor(months / 12), mo = months % 12;
  const age = (y ? `${y} Jahr${y === 1 ? "" : "e"}` : "") + (y && mo ? " und " : "") + (mo || !y ? `${mo} Monat${mo === 1 ? "" : "e"}` : "");
  const verdict = months >= 72 ? "Das ist alt. Rechne mit neuen Reifen, auch wenn das Profil noch gut aussieht."
    : months >= 48 ? "Noch fahrbar, aber bald fällig. Achte auf Risse in der Flanke."
    : "Das ist in Ordnung.";
  out.textContent = `Hergestellt in Woche ${week} / ${year}, also etwa ${age} alt. ${verdict}`;
});

// ---------- Warteliste (Formspree) ----------
$("warteliste-form").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target, status = $("w-status"), btn = form.querySelector("button[type=submit]");
  const fail = msg => { status.textContent = msg; status.hidden = false; btn.disabled = false; };
  if (form.action.includes("FORMSPREE_ID")) return fail("Die Warteliste ist noch nicht freigeschaltet. Versuch es bald wieder.");
  btn.disabled = true; status.hidden = true;
  try {
    const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(res.status);
    location.href = "danke.html";
  } catch {
    fail("Das hat nicht geklappt. Prüf deine Verbindung und versuch es nochmals.");
  }
});
