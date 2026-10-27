const MODELS = {
  r7: { name: "Yamaha R7 (ab 2022)", note: "", items: [
    "Leistung im Fahrzeugausweis prüfen: Viele R7 in der Schweiz sind auf 35 kW für die Kategorie A beschränkt gedrosselt. Ist die Drosselung eingetragen, und kann sie zurückgebaut werden?",
    "Sturzspuren an Lenkerenden, Fussrasten, Kupplungs- und Bremshebel und an der Verkleidungsunterseite.",
    "Serviceheft und Herstellergarantie: Wurden die Services bei einem Händler gemacht?",
    "Kette und Ritzel: Bei Fahrschul- oder Einsteigerbikes oft vernachlässigt.",
    "Nachgerüstete Teile (Quickshifter, Auspuff) brauchen eine Typengenehmigung bzw. einen Eintrag."
  ]},
  pc37: { name: "Honda CBR600RR PC37 (2003–2006)", note: "Ab Modelljahr 2007 heisst die CBR600RR PC40. Eine PC37 mit Inverkehrsetzung 2007 ist meist ein 2006er-Modell, das später eingelöst wurde. Typenschild und Fahrzeugausweis vergleichen.", items: [
    "Regler und Gleichrichter: Ladespannung bei laufendem Motor messen (ca. 13,5–14,5 V). Hondas dieser Zeit sind dafür bekannt.",
    "Spuren von Rennstreckeneinsatz: Löcher für Sicherungsdraht, Rennverkleidung, fehlende Originalteile.",
    "Kaltstart anhören: Rasseln aus dem Motor kann auf die Steuerkette oder den Spanner hindeuten.",
    "Lenkkopflager und Gabel: Rasten in der Mitte, Öl an den Gabelrohren.",
    "Repsol-Lack original oder foliert? Original-Repsol hält den Wert besser."
  ]},
  sp1: { name: "Honda VTR1000 SP-1 / RC51 (2000–2001)", note: "Die SP-1 ist das Joey-Dunlop-TT-Bike von 2000. Der Nachfolger SP-2 (2002–2006) sieht ähnlich aus. Für den Sammlerwert zählt, welche Version es ist und wie original sie ist.", items: [
    "Originalität: Originalauspuff, Originalverkleidung und Originalfarbe vorhanden? Umbauten drücken den Sammlerwert.",
    "Regler und Gleichrichter, wie bei allen Hondas dieser Zeit: Ladespannung messen.",
    "Ventilspiel-Kontrollen mit Belegen nachweisen lassen.",
    "Startverhalten kalt und warm: Unruhiger Leerlauf deutet oft auf eine verstellte Einspritzung oder Drosselklappen-Synchronisation hin.",
    "Rahmen und Schwinge auf Sturz- oder Richtspuren prüfen, besonders bei früherem Rennstreckeneinsatz."
  ]},
  d848: { name: "Ducati 848 / 848 EVO (2008–2013)", note: "", items: [
    "Zahnriemenwechsel mit Datum belegen. Ducati schreibt ein Intervall nach Zeit und nach Kilometern vor, auch wenn das Bike kaum gefahren wurde.",
    "Desmo-Service und Ventilspiel: Rechnungen einer Ducati-Fachwerkstatt verlangen.",
    "Die 848 hat eine Nasskupplung. Rasseln wie bei einer Trockenkupplung (1098) ist hier nicht normal.",
    "Elektrik: Regler, Batterie und Kabelbaum nahe am Motor auf Hitzeschäden prüfen.",
    "Umbauten wie Termignoni-Auspuff oder Steuergerät-Mapping brauchen einen Eintrag."
  ]},
  other: { name: "Anderes Modell", note: "", items: [
    "Fahrzeugausweis: Stimmen Rahmennummer, Leistung und Einträge mit dem Bike überein?",
    "Wann war die letzte MFK, und was wurde dort bemängelt?",
    "Servicebelege und Anzahl Vorbesitzer.",
    "Sturzspuren an Hebeln, Fussrasten, Lenkerenden und Verkleidung.",
    "Reifenalter (DOT-Nummer), Kette, Bremsbeläge."
  ]}
};
const EXAMPLE = [[9400, 3200], [8700, 9800], [9100, 5400], [8300, 14500]];
const CANTONS = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];

const $ = id => document.getElementById(id);
const chf = n => "CHF " + Math.round(n).toLocaleString("de-CH");

$("model").innerHTML = Object.entries(MODELS).map(([k, m]) => `<option value="${k}">${m.name}</option>`).join("");
$("w-canton").innerHTML = CANTONS.map(c => `<option${c === "ZH" ? " selected" : ""}>${c}</option>`).join("");

let rowId = 0;
function addRow(price = "", km = "") {
  const row = document.createElement("div");
  row.className = "comp-row";
  const i = ++rowId;
  row.innerHTML = `<input type="number" min="0" step="50" aria-label="Preis Angebot ${i}" id="cp${i}" value="${price}">
    <input type="number" min="0" step="100" aria-label="Kilometer Angebot ${i}" id="ck${i}" value="${km}">
    <button type="button" class="icon" aria-label="Angebot entfernen">×</button>`;
  row.querySelector("button").onclick = () => { row.remove(); update(); };
  $("comp-rows").appendChild(row);
}
EXAMPLE.forEach(([p, k]) => addRow(p, k));

function comps() {
  return [...$("comp-rows").children].map(r => {
    const [p, k] = r.querySelectorAll("input");
    return { p: parseFloat(p.value), k: parseFloat(k.value) };
  }).filter(c => c.p > 0 && c.k >= 0);
}

// Preis linear über den km-Stand schätzen; ohne sinnvollen Trend: Median.
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

function update() {
  const cs = comps(), km = parseFloat($("km").value) || 0, ask = parseFloat($("ask").value) || 0;
  $("n").textContent = cs.length;
  const pill = $("pill");
  if (cs.length < 3 || !ask) {
    pill.className = "pill none"; pill.textContent = "Zu wenig Daten";
    $("diff").textContent = "–"; $("est").textContent = "–"; $("range").textContent = "–"; $("slope").textContent = "–";
    $("verdict-text").textContent = cs.length < 3 ? "Trag mindestens drei Vergleichsangebote ein." : "Trag den verlangten Preis ein.";
    $("mark").style.left = "50%";
  } else {
    const { est, slope } = estimate(cs, km);
    const d = (ask - est) / est;
    $("est").textContent = chf(est);
    $("range").textContent = chf(est * 0.92) + " – " + chf(est * 1.08);
    $("slope").textContent = slope === null ? "kein Trend" : chf(-slope * 1000);
    $("diff").textContent = (d > 0 ? "+" : "") + (d * 100).toFixed(1) + " %";
    const delta = chf(Math.abs(ask - est));
    if (d <= -0.08) { pill.className = "pill good"; pill.textContent = "Guter Deal"; $("verdict-text").textContent = `${delta} unter dem fairen Preis. Schnell besichtigen, und genau hinschauen, warum es so günstig ist.`; }
    else if (d >= 0.08) { pill.className = "pill bad"; pill.textContent = "Zu teuer"; $("verdict-text").textContent = `${delta} über dem fairen Preis. Mit den Vergleichsangeboten verhandeln.`; }
    else { pill.className = "pill fair"; pill.textContent = "Fair"; $("verdict-text").textContent = `Nah am fairen Preis (${d > 0 ? "+" : "−"}${delta}). Zustand und Belege entscheiden.`; }
    $("mark").style.left = Math.min(100, Math.max(0, 50 + d * 250)) + "%";
  }
  const mfk = $("mfk").value;
  $("mfk-note").textContent = mfk === "fresh" ? "Frisch ab MFK ist ein Plus: Die Prüfung ist bestanden, Mängel wurden behoben."
    : mfk === "due" ? "MFK fällig oder unbekannt: Rechne mit Kosten für Vorbereitung und mögliche Mängel, und nimm das in die Verhandlung mit."
    : "";
  const m = MODELS[$("model").value];
  $("list-model").textContent = m.name;
  $("model-note").hidden = !m.note; $("model-note").textContent = m.note;
  $("checklist").innerHTML = m.items.map(t => `<li><span>${t}</span></li>`).join("");
}

// Warteliste per Formspree senden, danach auf die Danke-Seite.
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

document.addEventListener("input", e => { if (e.target.closest(".tool")) { $("example-note").hidden = true; update(); } });
$("add-comp").onclick = () => { addRow(); update(); };
$("clear").onclick = () => { $("comp-rows").innerHTML = ""; for (let i = 0; i < 3; i++) addRow(); $("ask").value = ""; $("example-note").hidden = true; update(); };
update();
