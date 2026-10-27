// Töffcheck Startseite: Preis-Check, Modell-Ratgeber, Reifenalter und Warteliste.
const $ = id => document.getElementById(id);
const chf = n => "CHF " + Math.round(n).toLocaleString("de-CH");
const zahl = n => Math.round(n).toLocaleString("de-CH");
const auf50 = n => Math.round(n / 50) * 50;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const EXAMPLE = [[9400, 3200, 2023], [8700, 9800, 2022], [9100, 5400, 2023], [8300, 14500, 2022]];
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
function addRow(price = "", km = "", year = "") {
  const i = ++rowId;
  const row = document.createElement("div");
  row.className = "comp-row";
  row.innerHTML = `<input type="number" inputmode="numeric" min="0" step="50" aria-label="Preis Angebot ${i}" value="${price}">
    <input type="number" inputmode="numeric" min="0" step="100" aria-label="Kilometer Angebot ${i}" value="${km}">
    <input type="number" inputmode="numeric" min="1970" max="${THIS_YEAR + 1}" aria-label="Jahrgang Angebot ${i}" placeholder="opt." value="${year}">
    <button type="button" class="icon-btn" aria-label="Angebot ${i} entfernen">×</button>`;
  row.querySelector("button").onclick = () => { row.remove(); update(); };
  $("comp-rows").appendChild(row);
  return row;
}
EXAMPLE.forEach(e => addRow(...e));

function comps() {
  return [...$("comp-rows").children].map(r => {
    const [p, k, y] = r.querySelectorAll("input");
    return { p: parseFloat(p.value), k: parseFloat(k.value), y: parseInt(y.value, 10), row: r };
  }).filter(c => c.p > 0 && c.k >= 0);
}

// Preis linear über den km-Stand schätzen; ohne sinkenden Trend: Median.
function estimate(cs, km) {
  const n = cs.length;
  const mk = cs.reduce((s, c) => s + c.k, 0) / n, mp = cs.reduce((s, c) => s + c.p, 0) / n;
  const sxx = cs.reduce((s, c) => s + (c.k - mk) ** 2, 0);
  const slope = sxx > 0 ? cs.reduce((s, c) => s + (c.k - mk) * (c.p - mp), 0) / sxx : 0;
  if (slope < 0) return { est: mp + slope * (km - mk), slope };
  const sorted = cs.map(c => c.p).sort((a, b) => a - b);
  const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return { est: med, slope: null };
}

const extras = () => [...document.querySelectorAll(".extra")].reduce((s, i) => s + (parseFloat(i.value) || 0), 0);

// ---------- Ergebnis ----------
let summary = "";
function update() {
  const cs = comps();
  const km = parseFloat($("km").value) || 0, ask = parseFloat($("ask").value) || 0, year = parseInt($("year").value, 10);
  const add = extras(), m = currentModel();
  const warn = [];
  cs.forEach(c => c.row.classList.remove("outlier"));
  $("n").textContent = cs.length;
  $("est-label").textContent = `Fairer Preis bei ${zahl(km)} km`;

  // Jahrgang passt nicht zum Modell
  if (m && year && (year < m.von || (m.bis && year > m.bis + 1)))
    warn.push(`Die ${m.modell} gibt es laut Ratgeber ${m.bis ? `von ${m.von} bis ${m.bis}` : `seit ${m.von}`}. Stimmt der Jahrgang? Vergleich ihn mit dem Fahrzeugausweis.`);

  const badge = $("badge");
  if (cs.length < 3 || !ask) {
    badge.className = "badge none"; badge.textContent = "Zu wenig Daten";
    ["diff", "est", "range", "slope"].forEach(id => $(id).textContent = "–");
    $("verdict-text").textContent = cs.length < 3 ? `Trag mindestens drei Vergleichsangebote ein (bis jetzt ${cs.length}).` : "Trag den verlangten Preis ein.";
    $("mark").style.left = "50%"; $("mark").classList.add("off");
    $("eff-row").hidden = true; $("deal-tip").hidden = true; $("copy").disabled = true;
    renderWarnings(warn);
    return;
  }

  const { est, slope } = estimate(cs, km);
  const eff = ask + add;
  const d = (eff - est) / est;
  const delta = chf(Math.abs(eff - est));
  $("mark").classList.remove("off");
  $("est").textContent = chf(est);
  $("range").textContent = chf(est * 0.92) + " – " + chf(est * 1.08);
  $("slope").textContent = slope === null ? "kein Trend" : chf(-slope * 1000);
  $("eff-row").hidden = !add; $("eff").textContent = chf(eff);
  const pct = (Math.abs(d) * 100).toFixed(1);
  $("diff").textContent = (pct === "0.0" ? "" : d > 0 ? "+" : "−") + pct.replace(".", ",") + " %";
  const what = add ? "Mit den anstehenden Kosten liegt das Angebot" : "Das Angebot liegt";

  let verdict;
  if (d <= -0.08) {
    verdict = "Guter Deal"; badge.className = "badge good";
    $("verdict-text").textContent = `${what} ${delta} unter dem fairen Preis. Schnell besichtigen und genau hinschauen, warum es so günstig ist.`;
  } else if (d >= 0.08) {
    verdict = "Zu teuer"; badge.className = "badge bad";
    $("verdict-text").textContent = `${what} ${delta} über dem fairen Preis. Mit deinen Vergleichsangeboten verhandeln.`;
  } else {
    verdict = "Fair"; badge.className = "badge fair";
    $("verdict-text").textContent = `${what} nah am fairen Preis (${d > 0 ? "+" : "−"}${delta}). Zustand und Belege entscheiden.`;
  }
  badge.textContent = verdict;
  $("mark").style.left = Math.min(100, Math.max(0, 50 + d * 200)) + "%";

  // Verhandlungshilfe: fairer Preis minus das, was nach dem Kauf noch ansteht
  const target = auf50(Math.min(ask, est - add));
  const tip = $("deal-tip");
  tip.hidden = false;
  if (target < ask - 50) {
    tip.innerHTML = `Verhandlungsziel: <strong>${chf(target)}</strong>. Steig mit etwa <strong>${chf(auf50(target * 0.95))}</strong> ein und begründe es mit deinen Vergleichsangeboten${add ? " und den anstehenden Kosten" : ""}.`;
  } else {
    tip.textContent = "Der Preis liegt schon im fairen Bereich oder darunter. Verhandeln kannst du trotzdem, wichtiger ist jetzt eine gründliche Besichtigung.";
  }

  // Hinweise zur Qualität der Daten
  if (slope === null) warn.push({ info: "Bei deinen Angeboten sinkt der Preis nicht mit den Kilometern. Töffcheck nimmt deshalb den mittleren Preis (Median)." });
  const ks = cs.map(c => c.k), kmin = Math.min(...ks), kmax = Math.max(...ks), spread = Math.max(kmax - kmin, 2000);
  if (km < kmin - spread * 0.25 || km > kmax + spread * 0.25)
    warn.push("Der Kilometerstand liegt weit ausserhalb deiner Vergleichsangebote. Die Schätzung ist dann unsicher. Such Angebote mit ähnlichem Kilometerstand.");
  // Ausreisser: Abstand zu einer robusten Linie (Theil-Sen), die sich von einzelnen Ausreissern kaum ziehen lässt
  const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const slopes = [];
  cs.forEach((a, i) => cs.slice(i + 1).forEach(b => { if (a.k !== b.k) slopes.push((b.p - a.p) / (b.k - a.k)); }));
  const rs = slopes.length ? median(slopes) : 0, rb = median(cs.map(c => c.p - rs * c.k));
  const outliers = cs.length < 4 ? [] : cs.filter(c => Math.abs(c.p - (rb + rs * c.k)) / (rb + rs * c.k) > 0.25);
  outliers.forEach(c => c.row.classList.add("outlier"));
  if (outliers.length) warn.push(`${outliers.length === 1 ? "Ein Angebot weicht" : outliers.length + " Angebote weichen"} stark von den anderen ab (rot markiert). Ist es wirklich vergleichbar, zum Beispiel gleiche Version und Ausstattung?`);
  if (year) {
    const far = cs.filter(c => c.y && Math.abs(c.y - year) > 2).length;
    if (far) warn.push(`${far === 1 ? "Ein Angebot ist" : far + " Angebote sind"} mehr als zwei Jahrgänge älter oder jünger. Das kann den fairen Preis verzerren.`);
  }
  const mfk = $("mfk").value;
  if (mfk === "due") warn.push({ info: "MFK fällig oder unbekannt: Rechne mit Kosten für die Vorbereitung und mögliche Mängel. Trag sie unter C ein." });
  if (mfk === "fresh") warn.push({ info: "Frisch ab MFK ist ein Plus: Die Prüfung ist bestanden, Mängel sind behoben. Lass dir den Prüfbericht zeigen." });
  renderWarnings(warn);

  const name = m ? `${m.marke} ${m.modell}` : "Anderes Modell";
  summary = [
    `Töffcheck: ${name}, ${year || "?"}, ${zahl(km)} km`,
    `Verlangt: ${chf(ask)}${add ? `, mit anstehenden Kosten ${chf(eff)}` : ""}`,
    `Fairer Preis: ${chf(est)} (Bereich ${chf(est * 0.92)} – ${chf(est * 1.08)})`,
    `Urteil: ${verdict} (${$("diff").textContent}), ${cs.length} Vergleichsangebote`,
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
  const rows = m ? [
    ["Baujahre", jahreText(m)],
    ["Art", TYPEN[m.typ].name],
    ["Motor", m.motor],
    ["Kategorie A beschränkt", (m.a2 ? '<span class="yes">Ja.</span> ' : "Nein. ") + esc(m.a2text || "")]
  ] : [["Art", TYPEN[typ].name]];
  $("spec").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${k.startsWith("Kategorie") ? v : esc(v)}</dd></div>`).join("");
}

function onModelChange() {
  const m = currentModel();
  const url = new URL(location.href);
  if (m) url.searchParams.set("modell", m.id); else url.searchParams.delete("modell");
  history.replaceState(null, "", url);
  document.title = m ? `${m.marke} ${m.modell} gebraucht kaufen: Preis-Check und Checkliste | Töffcheck` : "Töffcheck: Fairer Preis für gebrauchte Motorräder in der Schweiz";
  renderGuide(); update();
}

document.addEventListener("input", e => {
  if (e.target.closest(".tool")) { $("example-note").hidden = true; update(); }
});
$("model").addEventListener("change", onModelChange);
$("typ").addEventListener("change", () => { renderGuide(); update(); });
$("add-comp").onclick = () => { addRow().querySelector("input").focus(); update(); };
$("clear").onclick = () => {
  $("comp-rows").innerHTML = ""; for (let i = 0; i < 3; i++) addRow();
  $("ask").value = ""; $("km").value = ""; document.querySelectorAll(".extra").forEach(i => i.value = "");
  $("example-note").hidden = true; update();
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
