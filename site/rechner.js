// Preisrechnung ohne Anzeige-Logik. Läuft im Browser und im Worker, ohne KI und ohne Abhängigkeiten.

export const LIMITS = { priceMin: 200, priceMax: 300000, kmMin: 0, kmMax: 400000 };
export const FAIR_BAND = 0.08;
const OUTLIER_SHARE = 0.25;
const SUSPECT_BAND = 0.25;       // So weit unter dem fairen Preis ist kein Schnäppchen mehr, sondern auffällig
const MAX_LOSS_PER_1000 = 0.15;  // Mehr Wertverlust pro 1'000 km ist kein echter Trend, sondern ein Datenproblem
const WIDE_SCATTER = 0.15;

export const num = v => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[\s'’]/g, ""));
  return Number.isFinite(n) ? n : null;
};
export const validPrice = p => p !== null && p >= LIMITS.priceMin && p <= LIMITS.priceMax;
export const validKm = k => k !== null && k >= LIMITS.kmMin && k <= LIMITS.kmMax;
export const auf50 = n => Math.round(n / 50) * 50;

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function quantile(values, q) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b), i = (s.length - 1) * q, lo = Math.floor(i);
  return lo + 1 < s.length ? s[lo] + (s[lo + 1] - s[lo]) * (i - lo) : s[lo];
}

// Robuste Linie: mittlere Steigung aller Punktpaare. Einzelne Ausreisser ziehen sie kaum.
export function theilSen(points) {
  const slopes = [];
  points.forEach((a, i) => points.slice(i + 1).forEach(b => {
    if (a.km !== b.km) slopes.push((b.price - a.price) / (b.km - a.km));
  }));
  if (!slopes.length) return null;
  const slope = median(slopes);
  return { slope, intercept: median(points.map(p => p.price - slope * p.km)) };
}

// Fairer Preis bei einem Kilometerstand, oder eine begründete Verweigerung.
export function estimatePrice(points, km) {
  if (points.length < 3) return { ok: false, reason: "too_few" };
  const ks = points.map(p => p.km), kmin = Math.min(...ks), kmax = Math.max(...ks);
  const margin = Math.max(kmax - kmin, 2000) * 0.25;
  if (km < kmin - margin || km > kmax + margin) return { ok: false, reason: "km_out_of_range" };
  const line = theilSen(points);
  const falling = line && line.slope < 0;
  const mid = median(points.map(p => p.price));
  if (falling && -line.slope * 1000 > mid * MAX_LOSS_PER_1000) return { ok: false, reason: "implausible_estimate" };
  // Nicht über die Daten hinaus hochrechnen: Ausserhalb gilt der Wert am Rand der Angebote.
  const at = Math.min(kmax, Math.max(kmin, km));
  const est = falling ? line.intercept + line.slope * at : mid;
  const prices = points.map(p => p.price);
  if (est <= 0 || est < Math.min(...prices) * 0.5 || est > Math.max(...prices) * 1.5) return { ok: false, reason: "implausible_estimate" };
  return { ok: true, est, slope: falling ? line.slope : null, intercept: falling ? line.intercept : est, outsideData: at !== km };
}

export function findOutliers(points) {
  if (points.length < 4) return [];
  const line = theilSen(points);
  const at = p => (line && line.slope < 0 ? line.intercept + line.slope * p.km : median(points.map(x => x.price)));
  return points.filter(p => { const e = at(p); return e <= 0 || Math.abs(p.price - e) / e > OUTLIER_SHARE; });
}

export const REASONS = {
  km_missing: "Trag den Kilometerstand des Inserats ein.",
  too_few: "Trag mindestens drei gültige Vergleichsangebote ein.",
  km_out_of_range: "Der Kilometerstand liegt zu weit ausserhalb deiner Vergleichsangebote. Eine Schätzung wäre hier geraten.",
  implausible_estimate: "Aus diesen Angeboten ergibt sich kein plausibler Preis. Prüf die Eingaben oder ergänze Angebote mit anderen Kilometerständen.",
  year_mismatch: "Die meisten Vergleichsangebote sind mehr als zwei Jahrgänge entfernt. Such Angebote mit ähnlichem Jahrgang."
};

// Manueller Preisvergleich. rows: [{price, km, year, example}]
export function manualCheck({ rows, km, ask, extras = 0, year = null, model = null }) {
  const warnings = [];
  const isExample = rows.some(r => r.example);
  const parsed = rows.map(r => ({ row: r, price: num(r.price), km: num(r.km), year: num(r.year) }));
  const filled = parsed.filter(p => p.price !== null || p.km !== null);
  const usable = filled.filter(p => validPrice(p.price) && validKm(p.km));
  if (filled.length > usable.length) warnings.push(`${filled.length - usable.length} Angebot(e) mit ungültigem Preis oder Kilometerstand werden nicht gerechnet.`);

  const y = num(year), kmV = num(km), askV = num(ask), add = Math.max(0, num(extras) || 0);
  if (model && y && (y < model.year_from || (model.year_to && y > model.year_to + 1))) warnings.push(`Der Jahrgang ${y} passt nicht zu den Baujahren dieses Modells. Prüf den Fahrzeugausweis.`);
  const refuse = reason => ({ status: "refused", reason, message: REASONS[reason], isExample, warnings, usableCount: usable.length, outliers: [] });
  if (!validKm(kmV)) return refuse("km_missing");
  if (askV !== null && !validPrice(askV)) warnings.push("Der verlangte Preis ist unrealistisch und wird nicht bewertet.");

  const outliers = findOutliers(usable);
  const excluded = usable.length - outliers.length >= 3;
  const clean = excluded ? usable.filter(p => !outliers.includes(p)) : usable;
  if (outliers.length) warnings.push(excluded
    ? `${outliers.length} stark abweichende(s) Angebot(e) wurden nicht gerechnet (rot markiert).`
    : `${outliers.length} Angebot(e) weichen stark ab, es bleiben aber zu wenige übrig, um sie auszuschliessen.`);
  const r = estimatePrice(clean, kmV);
  if (!r.ok) return { ...refuse(r.reason), outliers: outliers.map(o => o.row) };
  if (y) {
    const far = clean.filter(c => c.year && Math.abs(c.year - y) > 2).length;
    if (far > clean.length / 2) return { ...refuse("year_mismatch"), outliers: outliers.map(o => o.row) };
    if (far) warnings.push(`${far} Angebot(e) sind mehr als zwei Jahrgänge entfernt. Das kann den Preis verzerren.`);
    const noYear = clean.filter(c => !c.year).length;
    if (noYear) warnings.push(`Bei ${noYear} Angebot(en) fehlt der Jahrgang. Töffcheck kann deshalb nicht prüfen, ob sie vergleichbar sind.`);
  }
  if (r.slope === null) warnings.push("Bei diesen Angeboten sinkt der Preis nicht mit den Kilometern. Gerechnet wird mit dem mittleren Preis.");
  if (r.outsideData) warnings.push("Der Kilometerstand liegt etwas ausserhalb deiner Angebote. Gerechnet wird mit dem Wert am Rand, die Schätzung ist unsicherer.");
  const expected = c => (r.slope === null ? r.est : r.intercept + r.slope * c.km);
  if (Math.max(...clean.map(c => Math.abs(c.price - expected(c)) / r.est)) > WIDE_SCATTER) {
    warnings.push("Die Angebote streuen stark, das Urteil ist deshalb unsicher. Prüf, ob Version und Ausstattung wirklich vergleichbar sind.");
  }

  const result = {
    status: "ok", isExample, warnings, usableCount: clean.length, outliers: outliers.map(o => o.row),
    est: r.est, low: r.est * (1 - FAIR_BAND), high: r.est * (1 + FAIR_BAND), slopePer1000: r.slope === null ? null : -r.slope * 1000,
    verdict: null, diff: null, effective: null, target: null, opening: null
  };
  if (validPrice(askV)) {
    const eff = askV + add;
    result.effective = eff;
    result.diff = (eff - r.est) / r.est;
    result.verdict = result.diff <= -SUSPECT_BAND ? "suspect" : result.diff <= -FAIR_BAND ? "good" : result.diff >= FAIR_BAND ? "high" : "fair";
    const goal = r.est - add;
    if (goal > 0 && auf50(Math.min(askV, goal)) < askV - 50) {
      result.target = auf50(goal);
      result.opening = auf50(goal * 0.95);
    }
  }
  return result;
}

// Beispielzeilen dürfen nie als echte Daten gelten: Beim Modellwechsel fallen sie weg,
// eine bearbeitete Zeile ist keine Beispielzeile mehr.
export const dropExamples = rows => rows.filter(r => !r.example);
export const editRow = (rows, index, field, value) => rows.map((r, i) => (i === index ? { ...r, [field]: value, example: false } : r));
export const exampleRows = () => [
  { price: 9400, km: 3200, year: 2023, example: true }, { price: 8700, km: 9800, year: 2022, example: true },
  { price: 9100, km: 5400, year: 2023, example: true }, { price: 8300, km: 14500, year: 2022, example: true }
];
