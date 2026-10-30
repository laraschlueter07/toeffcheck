// MFK-Check: liest Angaben aus Inseraten und schätzt den Prüfstatus ein. Reine Logik, ohne KI und ohne Netz.
// Grundlage: Art. 33 Abs. 2 Bst. c VTS (SR 741.41), geprüft auf Fedlex, Stand 1. Oktober 2026.
// Veteranen: ASTRA-Weisungen für Veteranenfahrzeuge vom 10. Juli 2026, in Kraft seit 1. August 2026.
// Das Ergebnis ist nie eine amtliche Auskunft: Massgebend ist das Aufgebot des Strassenverkehrsamts.

export const MFK_RULE = { firstMonths: 60, firstLatestMonths: 72, secondMonths: 36, thenMonths: 24 };
const RECENT_MONTHS = 6, SOON_MONTHS = 6, FRESH_CLAIM_MAX = 12, VETERAN_YEARS = 30;

const ym = (y, m) => y * 12 + (m - 1);
const fromYm = v => ({ year: Math.floor(v / 12), month: (v % 12) + 1 });
const nowYm = d => ym(d.getFullYear(), d.getMonth() + 1);
const spanOf = d => (d.month ? [ym(d.year, d.month), ym(d.year, d.month)] : [ym(d.year, 1), ym(d.year, 12)]);
const pad = n => String(n).padStart(2, "0");
export const formatDate = d => (d ? (d.month ? `${pad(d.month)}.${d.year}` : String(d.year)) : "");
const formatYm = v => formatDate(fromYm(v));
const formatSpan = (a, b) => (a === b ? formatYm(a) : `${formatYm(a)} bis ${formatYm(b)}`);

const MONTHS = { jan: 1, januar: 1, feb: 2, februar: 2, mar: 3, mär: 3, märz: 3, maerz: 3, apr: 4, april: 4, mai: 5, jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, nov: 11, november: 11, dez: 12, dezember: 12 };
const DATE = String.raw`(?:(?:\d{1,2}\.)?(?:0?[1-9]|1[0-2])[./-](?:19|20)?\d{2}|(?:19|20)\d{2}|(?:jan|januar|feb|februar|märz|maerz|mär|mar|apr|april|mai|juni|jun|juli|jul|aug|august|sept|sep|september|okt|oktober|nov|november|dez|dezember)\.?\s+(?:19|20)?\d{2})(?!\d)`;

const fullYear = (yy, now) => {
  if (yy >= 100) return yy;
  return yy > (now.getFullYear() % 100) + 10 ? 1900 + yy : 2000 + yy;
};

// Versteht 04.2021, 4/21, 12.04.2021, 2021 und «Mai 2025». Sonst null.
export function parseDateText(value, now = new Date()) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.((?:19|20)?\d{2})$/);
  if (m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12) return { year: fullYear(+m[3], now), month: +m[2] };
  m = s.match(/^(\d{1,2})[./-]((?:19|20)?\d{2})$/);
  if (m && +m[1] >= 1 && +m[1] <= 12) return { year: fullYear(+m[2], now), month: +m[1] };
  m = s.match(/^((?:19|20)\d{2})-(\d{1,2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { year: +m[1], month: +m[2] };
  m = s.match(/^((?:19|20)\d{2})$/);
  if (m) return { year: +m[1], month: null };
  m = s.match(/^([a-zäö]+)\.?\s+((?:19|20)?\d{2})$/);
  if (m && MONTHS[m[1]]) return { year: fullYear(+m[2], now), month: MONTHS[m[1]] };
  return null;
}

const R = {
  next: [
    new RegExp(String.raw`(?:mfk|vorführung|prüfung)\s*(?:ist\s+)?(?:gültig\s+)?(?:bis|fällig)(?:\s+(?:am|im|per))?\s*:?\s*(${DATE})`, "gi"),
    new RegExp(String.raw`nächste\s+(?:mfk|vorführung|prüfung)\s*:?\s*(?:am|im|per)?\s*(${DATE})`, "gi")
  ],
  last: [
    new RegExp(String.raw`(?:letzte\s+|zuletzt\s+)?(?:frische?\s+|neu\s+)?(?:ab\s+)?(?:mfk|vorgeführt)\s*(?:(?:neu|frisch|gemacht|bestanden|vom|von|am|im|per)\s+|[:,-]\s*)*(${DATE})`, "gi"),
    new RegExp(String.raw`(${DATE})\s+(?:frisch\s+)?ab\s+mfk`, "gi")
  ],
  offered: [
    /(?:auf\s+wunsch|gegen\s+aufpreis|optional|nach\s+absprache|wird|werden|kann|könnte|vor\s+(?:abholung|übergabe|auslieferung|verkauf)|bei\s+(?:kauf|abholung|übergabe))[^.;\n]{0,30}?(?:mfk|vorgeführt|vorführung)\b[^.;\n]{0,12}/gi,
    /\b(?:mfk|vorführung)\b[^.;\n]{0,15}(?:auf\s+wunsch|gegen\s+aufpreis|möglich|machbar|inklusive|wird\s+(?:noch\s+)?gemacht)/gi
  ],
  none: /(?:ohne|keine?)\s+(?:gültige\s+|frische\s+)?(?:mfk|vorführung)|nicht\s+(?:frisch\s+)?(?:ab\s+mfk|vorgeführt|geprüft)|unvorgeführt|mfk\s+(?:ist\s+)?(?:abgelaufen|nicht\s+(?:bestanden|gültig|gemacht))/gi,
  due: /mfk\s+(?:ist\s+)?(?:über)?fällig|(?:über)?fällige\s+mfk|mfk[-\s]aufgebot|aufgebot\s+(?:liegt|erhalten)/gi,
  asIs: /\bab\s+platz\b/gi,
  fresh: /(?:frisch|neu)\s+ab\s+mfk|frische?r?\s+mfk|frisch\s+vorgeführt|\bmfk\s+(?:ist\s+)?(?:neu|frisch|gemacht|bestanden)\b|\bab\s+mfk\b/gi,
  valid: /\bmfk\s+(?:ist\s+)?(?:ok|gültig|aktuell|i\.?\s*o\.?)(?![a-zäöü])/gi
};

// «Oldtimer» oder ein hohes Alter sind kein Veteranenstatus. Der Status muss ausdrücklich genannt sein.
const VETERAN = {
  no: /(?:kein(?:e|en)?|nicht(?:\s+mehr)?(?:\s+als)?|ohne)\s+veteran(?:en)?(?:fahrzeug|status|eintrag|zulassung)?\b/i,
  maybe: /\bveteran\w*[\s-]*(?:tauglich|fähig|würdig|berechtigt|möglich|machbar)|\b(?:bald|künftig|demnächst|könnte|kann|wäre|wird|ab\s+(?:19|20)\d{2})\b[^.;\n]{0,25}\bveteran|\bveteran\w*\s+(?:beantragen|werden)\b/i,
  yes: /\bveteran(?:en)?(?:fahrzeug|status|eintrag|zulassung)?\b|\b(?:ziffer|code)\s*180\b/i
};
const parseVeteran = t => (VETERAN.no.test(t) ? "no" : VETERAN.maybe.test(t) ? "unknown" : VETERAN.yes.test(t) ? "claimed" : "unknown");

// Verkäuferangaben aus einem Inserat. Nichts davon ist ein Nachweis.
export function parseMfkText(text, now = new Date()) {
  let t = String(text ?? "").replace(/ /g, " ");
  const out = { claim: "unknown", lastMfk: null, nextDue: null, conflict: false, ambiguous: false, veteran: parseVeteran(t), source: "seller", found: [] };
  const claims = new Set();
  const take = (rx, name) => {
    const had = t.search(rx) >= 0;
    rx.lastIndex = 0;
    if (had) { claims.add(name); t = t.replace(rx, " "); }
    rx.lastIndex = 0;
  };
  // Reihenfolge ist wichtig: «nicht ab MFK» und «auf Wunsch ab MFK» dürfen nicht als «ab MFK» gelten.
  R.offered.forEach(rx => take(rx, "offered"));
  take(R.none, "none");
  const nextDates = [], lastDates = [];
  // Bei der letzten MFK bleibt der Text stehen («frisch ab MFK 05.2025»). «MFK fällig 03.2027» ist nur ein Termin, keine Aussage.
  const collect = (rx, list, keepText) => {
    t = t.replace(rx, (m, d) => { const p = parseDateText(d, now); if (p) list.push(p); return !p ? m : keepText ? m.replace(d, " ") : " "; });
  };
  R.next.forEach(rx => collect(rx, nextDates, false));
  R.last.forEach(rx => collect(rx, lastDates, true));
  take(R.due, "due");
  take(R.asIs, "asIs");
  take(R.fresh, "fresh");
  take(R.valid, "valid");

  const current = nowYm(now);
  const past = lastDates.filter(d => spanOf(d)[0] <= current);
  const future = lastDates.filter(d => spanOf(d)[0] > current);
  // «MFK 05.2028» kann nicht die letzte Prüfung sein, gemeint ist vermutlich die nächste.
  if (future.length) { out.ambiguous = true; nextDates.push(...future); }
  const newest = list => list.reduce((a, d) => (!a || spanOf(d)[1] > spanOf(a)[1] ? d : a), null);
  out.lastMfk = newest(past);
  out.nextDue = newest(nextDates);

  const positive = claims.has("fresh") || claims.has("valid");
  const negative = claims.has("none") || claims.has("due");
  out.conflict = (positive && negative) || (claims.has("asIs") && claims.has("fresh"));
  out.claim = claims.has("none") ? "none" : claims.has("due") ? "due" : claims.has("asIs") ? "as_is"
    : claims.has("offered") ? "offered" : claims.has("fresh") ? "fresh" : claims.has("valid") ? "valid" : "unknown";
  out.found = [...claims];
  return out;
}

// Entfernt MFK-Angaben, damit ihre Daten nicht als Jahrgang oder Preis gelesen werden.
export function stripMfkText(text) {
  let t = String(text ?? "");
  [...R.next, ...R.last].forEach(rx => { t = t.replace(rx, " "); rx.lastIndex = 0; });
  return t;
}

const FIRST_REG = new RegExp(String.raw`(?:1\.\s*|erste\s+)?(?:inverkehrsetzung|inv\.|erstzulassung|\bez\b)\s*:?\D{0,10}?(${DATE})`, "i");
// Nur die erste Inverkehrsetzung, nicht das Modell- oder Baujahr.
export function parseFirstRegistration(text, now = new Date()) {
  const m = String(text ?? "").match(FIRST_REG);
  return m ? parseDateText(m[1], now) : null;
}

const LABELS = {
  empty: "Noch keine Angaben", conflict: "Angaben widersprüchlich", none: "Ohne MFK", as_is: "Ab Platz", due: "Als fällig angegeben",
  offered: "MFK nur angekündigt", overdue: "Möglicherweise überfällig", soon: "Bald fällig", recent: "Frische MFK", ok: "Vorerst nicht fällig",
  claim_fresh: "Laut Angabe frisch, ohne Datum", claim_valid: "Laut Angabe gültig, ohne Datum", first_not_yet: "Erste Prüfung noch nicht fällig",
  first_window: "Erste Prüfung steht an", date_missing: "Letzte MFK unbekannt", unknown: "MFK unbekannt",
  veteran: "Veteran laut Angabe, Frist unklar"
};
const FROM_DATE = new Set(["recent", "ok", "soon", "overdue"]);
const RISK = { low: "tief", medium: "mittel", high: "hoch", unknown: "unklar" };
// Wie zuverlässig die Angaben sind. Unabhängig vom Risiko, und keine Stufe bedeutet «amtlich bestätigt».
const RELIABILITY = {
  none: { level: "none", label: "Keine Angabe", detail: "" },
  conflict: { level: "conflict", label: "Widersprüchlich", detail: "Die Angaben passen nicht zusammen. Nichts davon ist bestätigt." },
  year_only: { level: "year_only", label: "Nur Jahrgang", detail: "Es liegt nur der Jahrgang vor. Bestätigt ist nichts." },
  unconfirmed: { level: "unconfirmed", label: "Nicht bestätigt", detail: "Die Angabe stammt nur aus dem Inserat oder vom Verkäufer. Auch ein plausibles Datum ist kein Nachweis, und Töffcheck hat es nicht überprüft." },
  seen: { level: "seen", label: "Von dir gesehen, nicht amtlich", detail: "Du hast das Dokument selbst gesehen. Amtlich bestätigt ist es dadurch nicht." }
};
const RISK_BY_STATUS = {
  empty: "unknown", conflict: "high", none: "high", as_is: "high", due: "high", offered: "medium", overdue: "high", soon: "medium", recent: "low", ok: "low",
  claim_fresh: "medium", claim_valid: "medium", first_not_yet: "low", first_window: "medium", date_missing: "medium", unknown: "medium", veteran: "unknown"
};

// input: { firstReg, lastMfk, nextDue, claim, source, canton, year, conflict, ambiguous, veteran, now }
// veteran: unknown | no | claimed (nur angegeben) | seen (im Fahrzeugausweis gesehen)
export function assessMfk(input = {}) {
  const now = input.now || new Date(), cur = nowYm(now);
  let first = input.firstReg || null, last = input.lastMfk || null;
  const claim = input.claim || "unknown", conflicts = [], uncertainties = [], questions = [], assessment = [];
  // Der Jahrgang ist nur ein Notbehelf. Ein künftiges Modelljahr sagt nichts über die MFK aus.
  const usingYear = !first && Number.isInteger(input.year) && ym(input.year, 1) <= cur;
  const veteran = input.veteran || "unknown", veteranStated = veteran === "claimed" || veteran === "seen";
  const empty = !first && !usingYear && !last && !input.nextDue && claim === "unknown" && !input.conflict && !veteranStated;
  if (usingYear) first = { year: input.year, month: null };

  if (input.conflict) conflicts.push("Die Angaben im Inserat widersprechen sich, zum Beispiel «frisch ab MFK» und «ohne MFK».");
  if (first && spanOf(first)[0] > cur) { conflicts.push("Die erste Inverkehrsetzung liegt in der Zukunft."); first = null; }
  if (last && spanOf(last)[0] > cur) { conflicts.push("Die angegebene letzte MFK liegt in der Zukunft."); last = null; }
  if (first && last && spanOf(last)[1] < spanOf(first)[0]) { conflicts.push("Die letzte MFK liegt vor der ersten Inverkehrsetzung."); last = null; }
  if (!usingYear && first && Number.isInteger(input.year) && input.year !== first.year) conflicts.push(`Jahrgang ${input.year} und erste Inverkehrsetzung ${first.year} passen nicht zusammen.`);

  // Höchstmögliches Alter: Das Alter allein macht aber noch keinen Veteranen.
  const ageMax = first ? cur - spanOf(first)[0] : null, overThirty = ageMax !== null && ageMax >= VETERAN_YEARS * 12;
  if (veteranStated && ageMax !== null && !overThirty) conflicts.push(`Veteranenstatus und ${usingYear ? "Jahrgang" : "erste Inverkehrsetzung"} ${formatDate(first)} passen nicht zusammen: Vorausgesetzt sind mehr als 30 Jahre.`);

  const sinceLast = last ? cur - spanOf(last)[1] : null;
  if (claim === "fresh" && last && sinceLast > FRESH_CLAIM_MAX) conflicts.push(`«Frisch ab MFK» passt nicht zu einer letzten MFK von ${formatDate(last)}.`);
  if (claim === "none" && last && sinceLast < MFK_RULE.thenMonths) conflicts.push(`«Ohne MFK» passt nicht zu einer letzten MFK von ${formatDate(last)}.`);
  if (claim === "due" && last && sinceLast <= RECENT_MONTHS) conflicts.push(`«Fällig» passt nicht zu einer letzten MFK von ${formatDate(last)}.`);

  // Nächste Prüfung schätzen. Ein Zeitraum statt eines falschen genauen Datums.
  // Mit Veteranenstatus gibt es keine Schätzung: Die Weisungen erlauben längere Fristen, nennen aber keine für den einzelnen Töff.
  let next = null;
  if (last && !veteranStated) {
    const [lastFrom, lastTo] = spanOf(last);
    let minI = MFK_RULE.thenMonths, maxI = MFK_RULE.secondMonths;
    if (first) {
      const ageAtLast = lastTo - spanOf(first)[0];
      if (ageAtLast < 84) minI = MFK_RULE.secondMonths;
      else if (ageAtLast >= 96) maxI = MFK_RULE.thenMonths;
      if (ageAtLast < MFK_RULE.firstMonths) uncertainties.push("Die letzte MFK war vor dem regulären ersten Termin. Eine freiwillige Prüfung ist möglich, der nächste Termin ist deshalb besonders unsicher.");
      if (minI !== maxI) uncertainties.push("Aus den Daten geht nicht eindeutig hervor, ob es die erste oder eine spätere Prüfung war. Deshalb gibt es einen längeren Zeitraum.");
    } else {
      uncertainties.push("Ohne erste Inverkehrsetzung ist unklar, ob als Nächstes drei oder zwei Jahre gelten.");
    }
    next = { from: lastFrom + minI, to: lastTo + maxI, kind: "estimated" };
  } else if (input.nextDue) {
    const [a, b] = spanOf(input.nextDue);
    next = { from: a, to: b, kind: "claimed" };
    if (input.ambiguous) uncertainties.push(`Im Inserat steht ${formatDate(input.nextDue)}. Das liegt in der Zukunft, gemeint ist vermutlich die nächste Prüfung.`);
  } else if (first && !veteranStated) {
    const [a, b] = spanOf(first);
    if (cur <= b + MFK_RULE.firstLatestMonths) next = { from: a + MFK_RULE.firstMonths, to: b + MFK_RULE.firstLatestMonths, kind: "estimated" };
  }

  let status;
  if (empty) status = "empty";
  else if (conflicts.length) status = "conflict";
  else if (claim === "none") status = "none";
  else if (claim === "as_is") status = "as_is";
  else if (claim === "due") status = "due";
  else if (claim === "offered" && !last) status = "offered";
  else if (veteranStated) status = last && cur - spanOf(last)[0] <= RECENT_MONTHS ? "recent" : !last && claim === "fresh" ? "claim_fresh" : "veteran";
  else if (last || (next && next.kind === "claimed")) {
    // Nur mit Jahr zählt der früheste mögliche Monat, sonst wäre «MFK 2026» im Dezember noch «frisch».
    if (last && cur - spanOf(last)[0] <= RECENT_MONTHS) status = "recent";
    else if (next.to < cur) status = "overdue";
    else if (next.from <= cur + SOON_MONTHS) status = "soon";
    else status = "ok";
  } else if (claim === "fresh") status = "claim_fresh";
  else if (claim === "valid") status = "claim_valid";
  else if (first) {
    if (next && spanOf(first)[1] + MFK_RULE.firstMonths > cur) status = "first_not_yet";
    else if (next) status = "first_window";
    else status = "date_missing";
  } else status = "unknown";

  const evidence = empty ? "none" : (input.source === "document" && last) || (veteran === "seen" && !last) ? "document" : "seller";
  const risk = RISK_BY_STATUS[status];
  const reliability = RELIABILITY[empty ? "none" : status === "conflict" ? "conflict" : evidence === "document" ? "seen"
    : usingYear && !last && !input.nextDue && claim === "unknown" && !veteranStated ? "year_only" : "unconfirmed"];
  // Ein gutes Risiko gilt nur unter Vorbehalt, solange niemand die Angabe gesehen hat.
  const riskLabel = risk === "low" && evidence !== "document" ? "tief, falls die Angabe stimmt" : RISK[risk];
  const label = status === "veteran" && veteran === "seen" ? "Veteran laut Fahrzeugausweis, Frist unklar"
    : evidence === "seller" && FROM_DATE.has(status) ? `Laut Angabe: ${LABELS[status]}` : LABELS[status];

  if (status !== "empty") {
    const texts = {
      conflict: "Kläre zuerst, was stimmt. Bis dahin solltest du nicht von einer gültigen MFK ausgehen.",
      none: "Der Töff wird ohne MFK angeboten. Mögliche Mängel und die Prüfung gehen voraussichtlich zu deinen Lasten.",
      as_is: "«Ab Platz» heisst meist: so wie er dasteht, oft ohne frische MFK. Kläre, wer Prüfung und Mängel bezahlt.",
      due: "Die Prüfung steht laut Angabe an. Rechne damit, dass vor oder nach dem Kauf Arbeit und Kosten anfallen.",
      offered: "Die MFK ist nur angekündigt, nicht gemacht. Halte im Kaufvertrag fest, wer sie bis wann macht und wer Mängel bezahlt.",
      overdue: "Nach den Regelfristen wäre die nächste Prüfung schon fällig gewesen. Das kann auch an einem späteren Aufgebot liegen, frag also nach.",
      soon: "Nach den Regelfristen kommt die nächste Prüfung bald. Plane sie beim Preis mit ein.",
      recent: evidence === "document" ? "Laut dem Prüfbericht, den du gesehen hast, liegt die letzte MFK weniger als ein halbes Jahr zurück." : "Laut Angabe liegt die letzte MFK weniger als ein halbes Jahr zurück. Das ist ein Plus, wenn der Prüfbericht es bestätigt.",
      ok: `${evidence === "document" ? "Nach den Regelfristen steht die nächste Prüfung" : "Falls die Angabe stimmt, steht die nächste Prüfung nach den Regelfristen"} voraussichtlich nicht unmittelbar an.`,
      claim_fresh: "Laut Angabe frisch ab MFK, aber ohne Datum. Das ist erst etwas wert, wenn du den Prüfbericht gesehen hast.",
      claim_valid: "«Gültig» sagt wenig aus, solange das Datum fehlt.",
      first_not_yet: "Die erste Prüfung ist nach fünf, spätestens sechs Jahren vorgesehen. Dieser Termin liegt noch vor dir.",
      first_window: "Der Töff ist im Zeitraum der ersten Prüfung. Sie kann schon gemacht sein oder bald kommen.",
      date_missing: "Der Töff ist so alt, dass er schon mindestens einmal geprüft sein sollte. Wann zuletzt, ist unbekannt.",
      unknown: "Ohne Datum und ohne erste Inverkehrsetzung lässt sich die MFK nicht einschätzen.",
      veteran: "Bei anerkannten Veteranenfahrzeugen können die Nachprüfungsintervalle bis auf sechs Jahre ausgedehnt werden. Welche Frist für diesen Töff gilt, ist hier nicht bekannt, deshalb rechnet Töffcheck keinen Termin."
    };
    assessment.push(texts[status]);
    if (risk !== "low" || status === "recent") assessment.push("Ob Kosten anfallen, hängt von den Mängeln ab. Lass dir eine Offerte machen und trag sie unter C ein. Töffcheck zieht keinen pauschalen Betrag vom Preis ab.");

    if (usingYear) uncertainties.push("Gerechnet wird nur mit dem Jahrgang. Prüf, ob das wirklich die erste Inverkehrsetzung ist und nicht das Modelljahr.");
    else if (!first) uncertainties.push("Die erste Inverkehrsetzung fehlt. Sie steht im Fahrzeugausweis.");
    else if (!first.month) uncertainties.push("Von der ersten Inverkehrsetzung ist nur das Jahr bekannt.");
    if (last && !last.month) uncertainties.push("Von der letzten MFK ist nur das Jahr bekannt.");
    if (veteranStated) {
      if (veteran === "claimed") uncertainties.push("Der Veteranenstatus ist nur angegeben. Er zählt erst, wenn er im Fahrzeugausweis steht (besondere Verwendung, Ziffer 180).");
      uncertainties.push(`Die tatsächliche Prüffrist ist unbekannt. Sie klärst du über die Fahrzeugdokumente oder beim Strassenverkehrsamt${input.canton ? ` ${input.canton}` : ""}.`);
      uncertainties.push("Der Status gilt nur bei rein privater Nutzung, im Schnitt höchstens 3000 km pro Jahr und technisch einwandfreiem Zustand. Die Behörde prüft das bei den Nachprüfungen und kann ihn entziehen.");
    } else if (veteran === "unknown" && overThirty) {
      uncertainties.push("Das Alter allein macht keinen Veteranen. Nur wenn der Status im Fahrzeugausweis steht (besondere Verwendung, Ziffer 180), kann eine längere Frist gelten. Gerechnet wird deshalb mit den normalen Fristen.");
    }
    uncertainties.push(`Massgebend ist das Aufgebot des Strassenverkehrsamts${input.canton ? ` ${input.canton}` : ""}. Töffcheck hat keinen Zugriff auf amtliche Daten und kann die Fälligkeit nicht bestätigen.`);

    questions.push("Wann war die letzte MFK genau? Darf ich den Prüfbericht sehen?");
    questions.push("Wurden Mängel beanstandet, und sind sie behoben? Gibt es Rechnungen dazu?");
    questions.push("Ist schon ein Aufgebot für die nächste MFK gekommen?");
    questions.push("Sind alle Umbauten im Fahrzeugausweis eingetragen?");
    if (!first || usingYear) questions.push("Wann war die erste Inverkehrsetzung laut Fahrzeugausweis?");
    if (veteranStated || (veteran === "unknown" && overThirty)) questions.push("Steht im Fahrzeugausweis «Veteranenfahrzeug» (besondere Verwendung, Ziffer 180)?");
    if (veteranStated) {
      questions.push("Welche Prüffrist gilt für diesen Töff, und wo steht das?");
      questions.push("Wie viele Kilometer wurden seit dem Veteraneneintrag pro Jahr gefahren?");
    }
    if (["none", "as_is", "due", "offered", "overdue", "conflict"].includes(status)) questions.push("Wer bezahlt, wenn der Töff bei der MFK durchfällt? Können wir das im Kaufvertrag festhalten?");
    if (input.canton) questions.push(`Muss der Töff beim Einlösen in ${input.canton} nochmals geprüft werden? Das klärst du am besten beim Strassenverkehrsamt.`);
  }

  return {
    status, label, risk, riskLabel, evidence, reliability, veteran,
    official: false, // Es gibt keine amtliche Datenquelle
    lastMfk: last, lastText: last ? formatDate(last) : "unbekannt",
    firstReg: usingYear ? null : first, firstText: !first ? "unbekannt" : usingYear ? `unbekannt (Jahrgang ${first.year})` : formatDate(first),
    next: next ? { ...next, text: formatSpan(next.from, next.to), label: next.kind === "claimed" ? "laut Inserat" : "Schätzung" } : null,
    conflicts, assessment, uncertainties, questions
  };
}

// Eine Zeile für das Ergebnis des Preis-Checks. Verändert weder Preis noch Urteil.
export function mfkSummary(r) {
  if (r.status === "empty") return null;
  const text = `MFK: ${r.label}. Risiko ${r.riskLabel}. Datenqualität: ${r.reliability.label}. Im Preis nicht eingerechnet, Details unter D.`;
  return r.risk === "high" ? { warn: text } : { info: text };
}
