// Liest Angaben aus Text, den jemand selbst aus einem Inserat kopiert hat. Läuft nur im Browser.
// Grundsatz: Lieber ein leeres Feld mit Hinweis als ein geratener Wert. Nur für Nutzereingaben gedacht,
// nie für Datenfeeds: Dort gilt das Preisfeld des Feeds (worker/src/normalize.js).
import { stripMfkText } from "./mfk.js";

const PRICE_MIN = 200, PRICE_MAX = 300000, KM_MAX = 400000;

// Eine Zahl mit höchstens einem Tausendertrenner: 8'490, 8.490, 8 490, 8490. Rappen werden abgeschnitten.
const NUM = String.raw`(?<![\d'.,])(\d{1,3}['. ]\d{3}|\d{1,6})(?:[.,]\d{1,2}(?!\d))?(?![\d]|['.]\d)`;
const UNIT_AFTER = String.raw`(?!\s*(?:km\b|km\/h|tkm|ccm|cm3|cm³|cc\b|ps\b|kw\b|nm\b|kg\b|mm\b|jahre?\b|monate?\b|stück\b|%))`;
const toNumber = s => parseInt(s.replace(/['. ]/g, ""), 10);
const clean = t => String(t ?? "").replace(/[    ]/g, " ").replace(/[’ʼ´`]/g, "'").replace(/\r\n?/g, "\n");
const blank = (t, a, b) => t.slice(0, a) + t.slice(a, b).replace(/[^\n]/g, " ") + t.slice(b);

const KINDS = [
  ["new", /neu\s*-?preis|preis\s+neu|\bnp\b|listenpreis|katalogpreis|\buvp\b|\bstatt\b|anstatt|ehemals|ehemalig|früher|vorher|alter\s+preis|ursprünglich|streichpreis|\bbisher\b|\bwar\b|normalpreis|gekauft|bezahlt|damals/g],
  ["finance", /leasing|finanz\w*|kredit|monatsrate|\braten?\b|pro\s+monat|monatlich|\bmtl\b|restwert|schlussrate|jahreszins/g],
  ["deposit", /anzahlung|sonderzahlung|kaution|reservation\w*|\bdepot\b/g],
  ["comparison", /preisvergleich|vergleich\w*|marktwert|marktpreis|eurotax|schätzwert|zeitwert|eintausch\w*|inzahlungnahme|ersparnis|\bsparen\b|\bsparst\b|rabatt|nachlass|günstiger|ähnlich\w*|durchschnitt\w*/g],
  ["extra", /service|wartung|inspektion|reifen|zubehör|\baufpreis|mehrpreis|auspuff|akrapovi\w*|koffer|topcase|im\s+wert|wert\s+von|garantie|versand|transport|lieferung|\bmfk\b|vorführung|gebühr\w*|einlösung|investiert|rechnung|kosten|ersatzteil\w*|umbau|zuzüglich|\bzzgl\b/g],
  ["auction", /höchstgebot|\bgebot\b|startpreis|mindestpreis|mindestgebot|auktion/g],
  ["sale", /verkaufspreis|kaufpreis|barpreis|fixpreis|festpreis|sofortpreis|sonderpreis|aktions?preis|occasionspreis|sofort\s*kaufen|(?<![a-zäöü-])preis(?![a-zäöü])|\bvp\b|\bvhb\b|verhandlungsbasis|\bjetzt\b|abzugeben/g]
];
// «für» und «nur» sagen wenig: «Akrapovic für CHF 1'200» ist kein Verkaufspreis. Sie gelten nur ohne stärkeres Wort.
const WEAK_SALE = /\bfür\b|\bnur\b/;
const KIND_TEXT = { new: "Neupreis oder früherer Preis", finance: "Finanzierung oder Rate", deposit: "Anzahlung", comparison: "Vergleich oder Wertangabe", extra: "Zubehör oder Nebenkosten", auction: "Gebot", small: "zu klein für einen Töff" };
// Direkt nach dem Betrag: «CHF 249/Mt.» gilt immer, «CHF 12'000 (Neupreis)» und «CHF 1'000 Anzahlung» nur,
// wenn das Wort nicht schon zum nächsten Betrag gehört: In «CHF 8'490 (Neupreis CHF 12'990)» beschreibt es die 12'990.
const PER_MONTH = /^\s*(?:[.\-–—]*\s*)?(?:\/|pro\b|p\.\s?m|je\b)\s*(?:mt|mon|m\b|m\.)/i;
const AFTER = [
  ["finance", /^\s*(?:[.\-–—]*\s*)?(?:\(|,)?\s*(?:monatlich|mtl|leasing|finanzierung|rate)/i],
  ["deposit", /^\s*(?:[.\-–—]*\s*)?(?:\(|,)?\s*anzahlung/i],
  ["new", /^\s*(?:[.\-–—]*\s*)?(?:\(|,)?\s*(?:neupreis|np\b|uvp|listenpreis)/i],
  ["extra", /^\s*(?:[.\-–—]*\s*)?(?:\(|,)?\s*(?:zubehör|aufpreis|versand)/i]
];
// Wendungen, die nichts über den nächsten Betrag sagen
const NOISE = /(?:finanzierung|leasing|eintausch|inzahlungnahme)(?:\s+(?:und|oder|\/)\s+\w+)?\s+(?:möglich|auf\s+anfrage)|(?:garantie|service|mfk)\s+(?:inklusive|inkl\.?|neu|gemacht|möglich)/gi;

// Nur der Satzteil vor dem Betrag zählt. Steht er allein auf der Zeile, darf die Zeile darüber die Beschriftung sein.
function clauseBefore(text, from, to) {
  const part = text.slice(Math.max(from, to - 60), to);
  const cut = Math.max(part.lastIndexOf(","), part.lastIndexOf(";"), part.lastIndexOf("!"), part.lastIndexOf("?"), part.lastIndexOf("•"), part.lastIndexOf("|"), part.lastIndexOf(". "), part.lastIndexOf("\n"));
  const clause = part.slice(cut + 1);
  if (clause.trim() || part[cut] !== "\n") return clause;
  const before = part.slice(0, cut), start = before.lastIndexOf("\n");
  // Steht in derselben Zeile schon ein Betrag, beschreibt das Wort jenen Betrag: «CHF 12'000 Neupreis»
  if (start < 0 && from > 0 && to - 60 <= from) return "";
  const line = before.slice(start + 1);
  return line.trim().length <= 25 ? line : "";
}
function kindFromContext(left, right, adjoining) {
  if (PER_MONTH.test(right)) return "finance";
  if (!adjoining) for (const [kind, re] of AFTER) if (re.test(right)) return kind;
  let best = null, at = -1;
  const low = left.toLowerCase();
  for (const [kind, re] of KINDS) {
    for (const m of low.matchAll(re)) if (m.index >= at) { at = m.index; best = kind; }
  }
  return best ?? (WEAK_SALE.test(low) ? "sale" : null);
}

function findAmounts(text) {
  let work = text;
  const found = [];
  const take = (source, currency) => {
    for (const m of work.matchAll(new RegExp(source, "gi"))) {
      found.push({ start: m.index, end: m.index + m[0].length, value: toNumber(m[1]), currency });
    }
    for (const a of found) work = blank(work, a.start, a.end);
  };
  take(String.raw`(?:(?<![a-z])(?:eur|euro|usd)\b|[€$])\s*\.?\s*${NUM}`, "other");
  take(String.raw`${NUM}\s*(?:eur\b|euro\b|usd\b|[€$])`, "other");
  take(String.raw`(?<![a-zäöü])(?:chf|sfr\.?|fr\.?)\s*[:.]?\s*${NUM}(?:\s*[.,]?\s*[-–—]+)?`, "chf");
  take(String.raw`${NUM}\s*(?:[.,]\s*[-–—]+\s*)?(?:chf\b|sfr\b\.?|fr\.|franken\b)`, "chf");
  take(String.raw`${NUM}\s*[.,]\s*[-–—]+`, "chf");
  // Ohne Währung nur direkt hinter einer Verkaufspreis-Beschriftung
  for (const m of work.matchAll(new RegExp(String.raw`(?<![a-zäöü-])((?:verkaufs|kauf|bar|fix|fest|sofort)?preis|\bvp)(?![a-zäöü])[\s:.\-]*(?:ab\s+)?${NUM}${UNIT_AFTER}`, "gi"))) {
    found.push({ start: m.index, end: m.index + m[0].length, value: toNumber(m[2]), currency: "chf", labelled: true });
  }
  return found.sort((a, b) => a.start - b.start);
}

function readPrice(text) {
  const masked = text.replace(NOISE, s => " ".repeat(s.length));
  const amounts = findAmounts(masked);
  const sale = new Set(), plain = new Set(), ignored = [];
  let other = false, auction = false;
  amounts.forEach((a, i) => {
    if (a.currency === "other") { other = true; ignored.push({ value: a.value, why: "andere Währung" }); return; }
    const prevEnd = i ? amounts[i - 1].end : 0;
    const next = amounts[i + 1], between = masked.slice(a.end, next ? next.start : a.end + 25);
    const context = a.labelled ? "sale" : kindFromContext(clauseBefore(masked, prevEnd, a.start) || "", between.split("\n")[0], !!next && !between.includes("\n"));
    if (context && context !== "sale") {
      if (context === "auction") auction = true;
      ignored.push({ value: a.value, why: KIND_TEXT[context] });
      return;
    }
    if (a.value < PRICE_MIN || a.value > PRICE_MAX) { ignored.push({ value: a.value, why: KIND_TEXT.small }); return; }
    (context === "sale" ? sale : plain).add(a.value);
  });
  const pool = sale.size ? sale : plain;
  const candidates = [...pool].sort((x, y) => y - x);
  const unique = (list, value) => list.filter((x, i) => list.findIndex(o => o.value === x.value && o.why === x.why) === i && x.value !== value);
  if (candidates.length === 1) return { price: candidates[0], priceStatus: "ok", candidates, ignored: unique(ignored, candidates[0]) };
  if (candidates.length > 1) return { price: null, priceStatus: "ambiguous", candidates, ignored: unique(ignored) };
  return { price: null, priceStatus: other ? "other_currency" : auction ? "auction" : "none", candidates, ignored: unique(ignored) };
}

// «km» allein zählt nur mit Doppelpunkt als Beschriftung: In «12'500 km 2022» gehört die 2022 nicht zum Kilometerstand.
const KM_LABEL = String.raw`(?<![a-zäöü])(?:kilometer(?:stand)?|km[- ]?stand|laufleistung|gefahrene\s+km|km\s*:)(?![a-zäöü/])\s*[:.]?\s*(?:ca\.?\s*)?${NUM}${UNIT_AFTER.replace("km\\b|km\\/h|tkm|", "km\\/h|")}`;
const KM_CONTEXT_BAD = /service|wartung|inspektion|garantie|reifen|kette|\böl\b|bremse|\bbei\b|\bvor\b|\bseit\b|\bnach\b|\balle\b|\bje\b|nächste|letzte|reichweite|fällig|\bbis\b|\bab\b|\bmax\b/;
function readKm(text) {
  const labelled = new Set(), plain = new Set();
  let work = text;
  for (const m of text.matchAll(new RegExp(KM_LABEL, "gi"))) {
    labelled.add(toNumber(m[1]));
    work = blank(work, m.index, m.index + m[0].length);
  }
  for (const m of work.matchAll(new RegExp(String.raw`${NUM}\s*(tkm\b|km\b(?!\/h)|kilometer\b)`, "gi"))) {
    const clause = clauseBefore(work, 0, m.index).toLowerCase();
    if (KM_CONTEXT_BAD.test(clause)) continue;
    plain.add(/^tkm/i.test(m[2]) ? toNumber(m[1]) * 1000 : toNumber(m[1]));
  }
  const pool = [...(labelled.size ? labelled : plain)].filter(v => v <= KM_MAX);
  if (pool.length === 1) return { km: pool[0], kmStatus: "ok", kmCandidates: pool };
  return { km: null, kmStatus: pool.length ? "ambiguous" : "none", kmCandidates: pool.sort((a, b) => b - a) };
}

const YEAR = String.raw`((?:19[5-9]|20[0-3])\d)`;
const YEAR_CONTEXT_BAD = /service|wartung|inspektion|revision|reifen|garantie|gekauft|batterie|kette|\bmfk\b|vorführ|\bbis\b|\bseit\b|gültig|gemacht|ersetzt|erneuert|\bneu\b|\bab\b|\bvom\b|\bam\b/;
const distinct = list => [...new Set(list)];
function readYear(text, title, thisYear) {
  const ok = y => y <= thisYear + 1;
  const pick = list => distinct(list.filter(ok));
  // 1. Inverkehrsetzung schlägt alles, danach Jahrgang und Baujahr
  const firstReg = pick([...text.matchAll(new RegExp(String.raw`(?:inverkehrs?setzung|inverkehrsetz\w*|erstzulassung|1\.\s*inv\.?|inv\.|\bez\b|\biv\b)[\s:.\-]*(?:\d{1,2}[./]\s*)*${YEAR}(?!\d)`, "gi"))].map(m => +m[1]));
  if (firstReg.length === 1) return { year: firstReg[0], yearStatus: "ok" };
  if (firstReg.length > 1) return { year: null, yearStatus: "ambiguous", yearCandidates: firstReg };
  const named = pick([...text.matchAll(new RegExp(String.raw`(?:jahrgang|baujahr|modelljahr|\bjg\b\.?|\bbj\b\.?|\bmj\b\.?)[\s:.\-]*(?:\d{1,2}[./]\s*)*${YEAR}(?!\d)`, "gi"))].map(m => +m[1]));
  if (named.length === 1) return { year: named[0], yearStatus: "ok" };
  if (named.length > 1) return { year: null, yearStatus: "ambiguous", yearCandidates: named };
  // Sonst nur Jahreszahlen, die nicht zu Service, Garantie oder Ähnlichem gehören
  const loose = source => [...source.matchAll(new RegExp(String.raw`(?<![\d'.,/-])(?:(?:0?[1-9]|1[0-2])[./])?${YEAR}(?![\d'.,/-]*\d)${UNIT_AFTER}`, "g"))]
    .filter(m => !YEAR_CONTEXT_BAD.test(clauseBefore(source, 0, m.index).toLowerCase())).map(m => +m[1]);
  const all = pick(loose(text));
  if (all.length === 1) return { year: all[0], yearStatus: "ok" };
  if (!all.length) return { year: null, yearStatus: "none" };
  const inTitle = pick(loose(title));
  if (inTitle.length === 1) return { year: inTitle[0], yearStatus: "ok" };
  return { year: null, yearStatus: "ambiguous", yearCandidates: all };
}

const plain = s => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
// «MT-07» passt auf «MT07» und «MT 07», aber «CB650R» nie auf «CBR650R» und «Z900» nie auf «Z900RS».
const aliasRegex = alias => {
  const chunks = plain(alias).match(/[a-z]+|\d+/g) || [];
  return new RegExp(String.raw`(?<![a-z0-9])${chunks.join(String.raw`[\s\-_.]*`)}(?![a-z0-9])`, "g");
};
function aliasesOf(model, names) {
  const variants = model.modell.split("/").map(v => v.replace(/\(.*?\)/g, "").trim()).filter(Boolean);
  const base = variants[0].split(" ")[0];
  // «Forza 125 / 300 / 350»: Eine reine Zahl gilt nur zusammen mit dem Namen, sonst passt sie auf jeden Betrag.
  const list = variants.map(v => (!/^\d+$/.test(base) && /^(\d+|V\d+)$/i.test(v) ? `${base} ${v}` : v));
  return [...list, ...(names[model.id]?.alias ?? [])].filter(a => (plain(a).match(/[a-z0-9]/g) || []).length >= 2);
}
const brandFound = (marke, text) => (marke === "Harley-Davidson" ? /harley|(?<![a-z])h-d(?![a-z])/ : new RegExp(String.raw`(?<![a-z0-9])${plain(marke)}(?![a-z0-9])`)).test(text);
const CODE_ALIAS = /^(pc\d+|rc\d+)$/i;

function hitsIn(text, models, names) {
  const hits = [];
  for (const m of models) {
    if (!brandFound(m.marke, text)) continue;
    const spec = names[m.id] ?? {};
    if ((spec.not ?? []).some(w => text.includes(plain(w)))) continue;
    for (const alias of aliasesOf(m, names)) {
      for (const h of text.matchAll(aliasRegex(alias))) hits.push({ model: m, start: h.index, end: h.index + h[0].length, code: CODE_ALIAS.test(alias) });
    }
  }
  // Ein kürzerer Treffer innerhalb eines längeren zählt nicht, «Z900» in «Z900 RS».
  return hits.filter(a => !hits.some(b => b !== a && b.model !== a.model && b.start <= a.start && b.end >= a.end && b.end - b.start > a.end - a.start));
}
function readModel(text, title, year, models, names) {
  const narrow = hits => {
    const code = hits.filter(h => h.code);
    let list = distinct((code.length ? code : hits).map(h => h.model));
    if (list.length > 1 && year) {
      const fit = list.filter(m => year >= m.von && (m.bis === null || year <= m.bis));
      if (fit.length) list = fit;
    }
    return list;
  };
  const all = narrow(hitsIn(plain(text), models, names));
  if (all.length === 1) return { model: all[0], modelStatus: "ok", modelOptions: all };
  if (!all.length) return { model: null, modelStatus: "none", modelOptions: [] };
  const inTitle = narrow(hitsIn(plain(title), models, names));
  if (inTitle.length === 1) return { model: inTitle[0], modelStatus: "ok", modelOptions: inTitle };
  return { model: null, modelStatus: "ambiguous", modelOptions: all };
}

const fmt = n => n.toLocaleString("de-CH");
function buildHints(r) {
  const hints = [];
  if (r.priceStatus === "ambiguous") hints.push(`Mehrere mögliche Preise gefunden: ${r.candidates.map(v => `CHF ${fmt(v)}`).join(", ")}. Wähl den richtigen aus, Töffcheck rät nicht.`);
  if (r.priceStatus === "none") hints.push("Kein eindeutiger Preis gefunden. Trag ihn von Hand ein.");
  if (r.priceStatus === "other_currency") hints.push("Der Preis ist nicht in Franken angegeben. Töffcheck rechnet nicht um, trag einen Frankenpreis ein.");
  if (r.priceStatus === "auction") hints.push("Das ist ein Gebot, kein fester Verkaufspreis. Trag den Preis von Hand ein.");
  if (r.kmStatus === "ambiguous") hints.push(`Mehrere mögliche Kilometerstände gefunden: ${r.kmCandidates.map(fmt).join(", ")}. Trag den richtigen ein.`);
  if (r.kmStatus === "none") hints.push("Kein Kilometerstand gefunden.");
  if (r.yearStatus === "ambiguous") hints.push(`Mehrere mögliche Jahrgänge gefunden: ${r.yearCandidates.join(", ")}. Trag die erste Inverkehrsetzung ein.`);
  if (r.yearStatus === "none") hints.push("Kein Jahrgang gefunden.");
  if (r.modelStatus === "ambiguous") hints.push(`Mehrere Modelle kommen vor: ${r.modelOptions.map(m => `${m.marke} ${m.modell}`).join(", ")}. Wähl das richtige aus.`);
  if (r.modelStatus === "none") hints.push("Modell nicht sicher erkannt. Prüf die Auswahl.");
  return hints;
}

export function parseInserat(text, { models = [], names = {}, now = new Date() } = {}) {
  const raw = clean(text);
  // MFK-Daten vorher entfernen, sonst gelten sie als Jahrgang oder Preis
  const t = clean(stripMfkText(raw));
  const title = t.split("\n").find(l => l.trim()) ?? "";
  const price = readPrice(t);
  const km = readKm(t);
  // Geldbeträge dürfen nie als Jahrgang gelten
  let forYear = t;
  for (const a of findAmounts(t)) forYear = blank(forYear, a.start, a.end);
  forYear = forYear.replace(new RegExp(KM_LABEL, "gi"), s => " ".repeat(s.length));
  const year = readYear(forYear, forYear.split("\n").find(l => l.trim()) ?? "", now.getFullYear());
  const model = readModel(t, title, year.year, models, names);
  const out = { ...price, ...km, ...year, ...model };
  out.hints = buildHints(out);
  return out;
}
