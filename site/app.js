// Töffcheck Startseite: Preis-Check, Modell-Ratgeber, Reifenalter und Warteliste.
import { manualCheck, exampleRows, num } from "./rechner.js";

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

const start = new URLSearchParams(location.search).get("modell");
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

  const mfk = $("mfk").value;
  if (mfk === "due") warn.push({ info: "MFK fällig oder unbekannt: Rechne mit Kosten für die Vorbereitung und mögliche Mängel. Trag sie unter C ein." });
  if (mfk === "fresh") warn.push({ info: "Frisch ab MFK ist ein Plus: Die Prüfung ist bestanden, Mängel sind behoben. Lass dir den Prüfbericht zeigen." });

  $("eff-row").hidden = true; tip.hidden = true; $("copy").disabled = true;
  if (r.status !== "ok") {
    badge.className = "badge none";
    badge.textContent = label(r.reason === "too_few" || r.reason === "km_missing" ? "Zu wenig Daten" : "Keine Bewertung");
    ["diff", "est", "range", "slope"].forEach(id => $(id).textContent = "–");
    $("verdict-text").textContent = r.message;
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
  const verdict = { good: "Guter Deal", fair: "Fair", high: "Zu teuer" }[r.verdict];
  badge.className = "badge " + { good: "good", fair: "fair", high: "bad" }[r.verdict];
  badge.textContent = label(verdict);
  $("verdict-text").textContent = isExample ? "Das ist nur eine Beispielrechnung. Trag dein Inserat und echte Vergleichsangebote ein."
    : r.verdict === "good" ? `${what} ${delta} unter dem fairen Preis. Schnell besichtigen und genau hinschauen, warum es so günstig ist.`
    : r.verdict === "high" ? `${what} ${delta} über dem fairen Preis. Mit deinen Vergleichsangeboten verhandeln.`
    : `${what} nah am fairen Preis (${d > 0 ? "+" : "−"}${delta}). Zustand und Belege entscheiden.`;
  $("mark").style.left = Math.min(100, Math.max(0, 50 + d * 200)) + "%";

  // Verhandlungshilfe: fairer Preis minus das, was nach dem Kauf noch ansteht
  if (!isExample && r.target !== null) {
    tip.hidden = false;
    tip.innerHTML = `Verhandlungsziel: <strong>${chf(r.target)}</strong>. Steig mit etwa <strong>${chf(r.opening)}</strong> ein und begründe es mit deinen Vergleichsangeboten${add ? " und den anstehenden Kosten" : ""}.`;
  } else if (!isExample && r.verdict !== "high") {
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
    location.origin + location.pathname + "?modell=" + (m ? m.id : "")
  ].join("\n");
  $("copy").disabled = false;
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
  const m = currentModel();
  const brand = m ? m.marke.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
  const links = [
    ["MotoScout24" + (m ? ` (${m.marke})` : ""), m ? `https://www.motoscout24.ch/de/s/mk-${brand}` : "https://www.motoscout24.ch/de/s"],
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
// Liest Preis, Kilometer und Jahrgang aus Text, den man selbst aus einem Inserat kopiert hat.
const toNum = s => parseFloat(s.replace(/[\s'’]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
function firstMatch(text, patterns, ok) {
  for (const re of patterns) {
    for (const hit of text.matchAll(re)) {
      const v = toNum(hit[1]);
      if (ok(v)) return { v, raw: hit[0] };
    }
  }
  return null;
}
function parseInserat(text) {
  const t = text.replace(/ /g, " ");
  const n = "(\\d{1,3}(?:[ '’.]\\d{3})+|\\d+)";
  const price = firstMatch(t, [
    new RegExp(`(?:CHF|SFr\\.?|Fr\\.)\\s*${n}`, "gi"),
    new RegExp(`${n}(?:[.,][-–]+|\\s*(?:CHF|Fr\\.))`, "gi"),
    new RegExp(`Preis\\D{0,15}${n}`, "gi")
  ], v => v >= 200 && v <= 300000);
  const km = firstMatch(t, [
    new RegExp(`${n}\\s*km\\b`, "gi"),
    new RegExp(`Kilometer(?:stand)?\\D{0,15}${n}`, "gi")
  ], v => v >= 0 && v <= 400000);
  let rest = t;
  [price, km].forEach(h => { if (h) rest = rest.replace(h.raw, " "); });
  const yearHit = rest.match(/(?:Inverkehrsetzung|Inv\.|Erstzulassung|Jahrgang|Baujahr|Modelljahr|EZ)\D{0,20}?(?:\d{1,2}[./]\s*)?((?:19|20)\d{2})/i)
    || rest.match(/\b(?:0?[1-9]|1[0-2])[./]((?:19|20)\d{2})\b/)
    || rest.match(/\b(19[7-9]\d|20[0-3]\d)\b/);
  const year = yearHit && +yearHit[1] <= THIS_YEAR + 1 ? +yearHit[1] : null;
  // Modell erkennen: Marke und eine Modellbezeichnung kommen im Text vor
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nt = norm(t);
  let model = null, best = 0;
  MODELLE.forEach(m => {
    if (!nt.includes(norm(m.marke))) return;
    const variants = m.modell.split("/").map(v => v.replace(/\(.*?\)/g, "").trim());
    const base = variants[0].split(" ")[0];
    // "Panigale 899 / 959 / V2" soll auch "Panigale V2" finden
    variants.flatMap(v => v.startsWith(base) ? [v] : [v, base + " " + v]).map(norm).forEach(v => {
      if (v.length >= 3 && nt.includes(v) && v.length > best) { model = m; best = v.length; }
    });
  });
  // Preis ohne CHF: die grösste übrige Zahl, die weder Jahrgang noch Teil des Modellnamens ist
  let priceV = price && price.v;
  if (!priceV) {
    const nums = [...rest.matchAll(new RegExp(n, "g"))].map(h => toNum(h[1]))
      .filter(v => v >= 1000 && v <= 300000 && v !== year && !(model && (model.modell + " " + model.motor).includes(String(v))));
    if (nums.length) priceV = Math.max(...nums);
  }
  return { price: priceV || null, km: km && km.v, year, model };
}
function pasteSummary(r) {
  const parts = [r.price ? chf(r.price) : null, r.km != null ? zahl(r.km) + " km" : null, r.year].filter(Boolean);
  return parts.length ? parts.join(" · ") : "";
}
$("paste-comp").onclick = () => {
  const r = parseInserat($("paste").value), out = $("paste-out");
  if (!r.price && r.km == null) { out.textContent = "Darin habe ich weder Preis noch Kilometer gefunden. Trag die Werte von Hand ein."; return; }
  removeExampleRows();
  const empty = [...$("comp-rows").children].find(row => [...row.querySelectorAll("input")].every(i => !i.value));
  const row = empty || addRow();
  const [p, k, y] = row.querySelectorAll("input");
  p.value = r.price || ""; k.value = r.km ?? ""; y.value = r.year || "";
  out.textContent = `Übernommen: ${pasteSummary(r)}. Prüf die Werte in der Tabelle.` + (!r.price ? " Der Preis fehlt noch." : r.km == null ? " Die Kilometer fehlen noch." : "");
  $("paste").value = "";
  (!r.price ? p : r.km == null ? k : row).focus?.();
  update();
};
$("paste-ad").onclick = () => {
  const r = parseInserat($("paste").value), out = $("paste-out");
  if (!r.price && r.km == null && !r.year && !r.model) { out.textContent = "Darin habe ich nichts erkannt. Trag die Werte von Hand ein."; return; }
  if (r.price) { $("ask").value = r.price; setAdReal("ask"); }
  if (r.km != null) { $("km").value = r.km; setAdReal("km"); }
  if (r.year) { $("year").value = r.year; setAdReal("year"); }
  if (r.model && r.model.id !== $("model").value) { $("model").value = r.model.id; onModelChange(); }
  out.textContent = `Oben übernommen: ${[r.model ? r.model.marke + " " + r.model.modell : null, pasteSummary(r)].filter(Boolean).join(" · ")}. Prüf die Werte.`;
  $("paste").value = "";
  update();
};

document.addEventListener("input", e => {
  if (!e.target.closest(".tool")) return;
  if (AD_FIELDS.includes(e.target.id)) setAdReal(e.target.id);
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
