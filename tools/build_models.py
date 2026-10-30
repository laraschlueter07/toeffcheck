#!/usr/bin/env python3
"""Erzeugt aus site/modelle.js die Modellseiten, die Modellliste in modelle.html und die Sitemap.

Nur Standardbibliothek, läuft lokal und in GitHub Actions: python3 tools/build_models.py
Die Seiten zeigen ausschliesslich Angaben aus modelle.js. Modelle mit zu wenig eigenem Text
bekommen eine Seite, aber "noindex", und stehen nicht in der Sitemap.
"""
import collections
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = SITE / "modell"
BASE = "https://toeffcheck.ch"
MIN_OWN_CHARS = 300   # Eigener Text: Kurzbeschreibung, Hinweis und Punkte, die kaum ein anderes Modell hat
MIN_OWN_POINTS = 4
REPEATED_FROM = 3     # Ein Punkt, der bei so vielen Modellen wörtlich vorkommt, zählt nicht als eigener Text
STATIC_PAGES = ["", "modelle.html", "impressum.html", "agb.html", "datenschutz.html"]


# ---------- modelle.js lesen ----------
class JsReader:
    """Liest die Objekt-Literale aus modelle.js, ohne JavaScript auszuführen."""

    def __init__(self, text, pos):
        self.t, self.i = text, pos

    def skip(self):
        while True:
            m = re.compile(r"\s+|//[^\n]*|/\*.*?\*/", re.S).match(self.t, self.i)
            if not m:
                return
            self.i = m.end()

    def value(self):
        self.skip()
        c = self.t[self.i]
        if c == "{":
            return self.obj()
        if c == "[":
            return self.arr()
        if c == '"':
            m = re.compile(r'"(?:[^"\\\n]|\\.)*"').match(self.t, self.i)
            self.i = m.end()
            return json.loads(m.group(0))
        m = re.compile(r"-?\d+(?:\.\d+)?|true|false|null").match(self.t, self.i)
        if not m:
            raise ValueError(f"Unerwarteter Wert in modelle.js bei Zeichen {self.i}: {self.t[self.i:self.i + 40]!r}")
        self.i = m.end()
        return json.loads(m.group(0))

    def arr(self):
        self.i += 1
        out = []
        while True:
            self.skip()
            if self.t[self.i] == "]":
                self.i += 1
                return out
            out.append(self.value())
            self.skip()
            if self.t[self.i] == ",":
                self.i += 1

    def obj(self):
        self.i += 1
        out = {}
        while True:
            self.skip()
            if self.t[self.i] == "}":
                self.i += 1
                return out
            m = re.compile(r'[A-Za-z_]\w*|"[^"]*"').match(self.t, self.i)
            if not m:
                raise ValueError(f"Unerwarteter Schlüssel in modelle.js bei Zeichen {self.i}")
            key = m.group(0).strip('"')
            self.i = m.end()
            self.skip()
            if self.t[self.i] != ":":
                raise ValueError(f"Doppelpunkt fehlt nach {key}")
            self.i += 1
            out[key] = self.value()
            self.skip()
            if self.t[self.i] == ",":
                self.i += 1


def load():
    text = (SITE / "modelle.js").read_text(encoding="utf-8")
    read = lambda name: JsReader(text, text.index(f"const {name} = ") + len(f"const {name} = ")).value()
    types, models = read("TYPEN"), read("MODELLE")
    seen = set()
    for m in models:
        for field in ("id", "marke", "modell", "von", "typ", "motor", "kurz", "plus", "minus", "pruefen"):
            if not m.get(field):
                raise ValueError(f"{m.get('id', '?')}: Feld {field} fehlt")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", m["id"]) or m["id"] in seen:
            raise ValueError(f"Ungültige oder doppelte id: {m['id']}")
        if m["typ"] not in types:
            raise ValueError(f"{m['id']}: unbekannter typ {m['typ']}")
        seen.add(m["id"])
    return types, sorted(models, key=lambda m: (m["marke"] + m["modell"]).lower())


def rate_quality(models):
    """Misst den eigenen Text jedes Modells. Standardsätze wie «Kette und Ritzel.» zählen nicht."""
    freq = collections.Counter(p for m in models for p in m["plus"] + m["minus"] + m["pruefen"])
    for m in models:
        own = [p for p in m["plus"] + m["minus"] + m["pruefen"] if freq[p] < REPEATED_FROM]
        m["own_points"] = len(own)
        m["own_chars"] = len(m["kurz"]) + len(m.get("hinweis", "")) + sum(map(len, own))
        m["indexable"] = m["own_chars"] >= MIN_OWN_CHARS and m["own_points"] >= MIN_OWN_POINTS


# ---------- HTML ----------
e = lambda s: html.escape(str(s), quote=True)
years = lambda m: f"{m['von']}–{m.get('bis') or 'heute'}"
full = lambda m: f"{m['marke']} {m['modell']}"
LOGO = '<svg viewBox="0 0 40 28" aria-hidden="true"><ellipse cx="20" cy="14" rx="19" ry="13" fill="#e1251b"/><path d="M11.5 14.5l5.5 5 11.5-11" fill="none" stroke="#fff" stroke-width="4"/></svg>'
FONTS = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"


def title_of(m):
    long = f"{full(m)} gebraucht kaufen: Schwachstellen und Checkliste | Töffcheck"
    return long if len(long) <= 70 else f"{full(m)} gebraucht: Checkliste | Töffcheck"


def description_of(m):
    text = f"{full(m)} gebraucht kaufen: {m['kurz']} Stärken, Schwächen und Checkliste für die Besichtigung."
    if len(text) <= 160:
        return text
    return text[:157].rsplit(" ", 1)[0].rstrip(" ,.:;") + " ..."


def a2_text(m):
    state = {True: "Ja.", False: "Nein."}.get(m.get("a2"), "Unklar. Leistung im Fahrzeugausweis prüfen.")
    return f"{state} {m.get('a2text', '')}".strip()


def card(m):
    """Gleiches Markup wie card() in liste.js, damit Google die Liste auch ohne JavaScript sieht."""
    a2 = '<span class="chip a2">A2 möglich</span>' if m.get("a2") is True else ""
    plus = "".join(f"<li>{e(p)}</li>" for p in m["plus"][:2])
    minus = "".join(f"<li>{e(p)}</li>" for p in m["minus"][:2])
    return (f'<article class="model-card" id="{m["id"]}"><header><span class="brand">{e(m["marke"])}</span><h2>{e(m["modell"])}</h2>'
            f'<span class="meta">{years(m)} · {e(m["motor"])}</span><div class="chips"><span class="chip">{e(TYPES[m["typ"]]["name"])}</span>{a2}</div></header>'
            f'<div class="body"><p>{e(m["kurz"])}</p><ul class="plus">{plus}</ul><ul class="minus">{minus}</ul></div>'
            f'<footer><a href="modell/{m["id"]}/">Zur Modellseite</a></footer></article>')


def related(m, models):
    """Interne Links: gleiche Marke und gleiche Art. Seiten mit genug Inhalt zuerst."""
    order = lambda x: (not x["indexable"], abs(x["von"] - m["von"]), x["id"])
    others = [x for x in models if x["id"] != m["id"]]
    brand = sorted((x for x in others if x["marke"] == m["marke"]), key=order)[:4]
    kind = sorted((x for x in others if x["typ"] == m["typ"] and x["marke"] != m["marke"]), key=order)[:4]
    return brand, kind


def link_list(items):
    return "".join(f'<a class="find-link" href="../{x["id"]}/">{e(full(x))}</a>' for x in items)


def checks(items):
    return "".join(f'<li><label><input type="checkbox"><span>{e(p)}</span></label></li>' for p in items)


def page(m, models):
    url = f"{BASE}/modell/{m['id']}/"
    title, desc = title_of(m), description_of(m)
    typ = TYPES[m["typ"]]
    typ_title = "Roller" if typ["name"] == "Roller" else f"die Töff-Art {typ['name']}"
    brand, kind = related(m, models)
    hinweis = f'<p class="rat-hinweis">{e(m["hinweis"])}</p>' if m.get("hinweis") else ""
    robots = "" if m["indexable"] else '<meta name="robots" content="noindex,follow">\n'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "name": title, "url": url, "description": desc, "inLanguage": "de-CH",
         "isPartOf": {"@type": "WebSite", "name": "Töffcheck", "url": f"{BASE}/"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Töffcheck", "item": f"{BASE}/"},
            {"@type": "ListItem", "position": 2, "name": "Modelle", "item": f"{BASE}/modelle.html"},
            {"@type": "ListItem", "position": 3, "name": full(m), "item": url}]}]}
    related_html = ""
    if brand:
        related_html += f'<h3 class="list-title">Weitere Modelle von {e(m["marke"])}</h3><div class="find-links">{link_list(brand)}</div>'
    if kind:
        related_html += f'<h3 class="list-title">Andere Marken: {e(typ["name"])}</h3><div class="find-links">{link_list(kind)}</div>'
    return f"""<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{robots}<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0d0d0e">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Töffcheck">
<meta property="og:locale" content="de_CH">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{BASE}/img/og-toeffcheck.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="icon" href="../../favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="../../apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="../../style.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#inhalt">Direkt zum Inhalt</a>

<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="../../" aria-label="Töffcheck, zur Startseite">
      {LOGO}
      <span>Töffcheck</span>
    </a>
    <nav class="nav" aria-label="Hauptnavigation">
      <a href="../../#preis-check">Preis-Check</a>
      <a href="../../modelle.html" aria-current="page">Modelle</a>
      <a href="../../#besichtigung">Besichtigung</a>
      <a href="../../#fragen">Fragen</a>
    </nav>
  </div>
</header>

<main id="inhalt">
  <section class="page-head">
    <div class="wrap">
      <p class="kicker"><a href="../../modelle.html">Modelle</a> · {e(m["marke"])}</p>
      <h1>{e(full(m))}</h1>
      <p class="lead">{e(m["kurz"])}</p>
      <div class="cta"><a class="btn btn-red" href="../../?modell={m["id"]}#preis-check">Preis dieses Modells prüfen</a></div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="rat-grid">
        <div class="rat-main">
          {hinweis}
          <div class="proscons">
            <div><h2 class="list-title">Stärken</h2><ul class="plus">{"".join(f"<li>{e(p)}</li>" for p in m["plus"])}</ul></div>
            <div><h2 class="list-title">Schwächen</h2><ul class="minus">{"".join(f"<li>{e(p)}</li>" for p in m["minus"])}</ul></div>
          </div>
          <h2 class="list-title">Darauf achten bei der {e(m["modell"])}</h2>
          <ul class="checks">{checks(m["pruefen"])}</ul>
          <h2 class="list-title">Typisch für {e(typ_title)}</h2>
          <ul class="checks">{checks(typ["pruefen"])}</ul>
          <p>Dazu kommt die <a href="../../#besichtigung">Checkliste für jeden Töff</a> mit Papieren, Motor, Elektrik, Reifen und Probefahrt.</p>
          {related_html}
        </div>
        <aside class="rat-side">
          <dl class="spec">
            <div><dt>Baujahre</dt><dd>{years(m)}</dd></div>
            <div><dt>Art</dt><dd>{e(typ["name"])}</dd></div>
            <div><dt>Motor</dt><dd>{e(m["motor"])}</dd></div>
            <div><dt>Kategorie A beschränkt</dt><dd>{e(a2_text(m))}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <a class="logo logo-inv" href="../../" aria-label="Töffcheck, zur Startseite">
        {LOGO}
        <span>Töffcheck</span>
      </a>
      <p>Ein Schulprojekt aus Wädenswil. Keine Firma, keine Werbung, keine Cookies.</p>
    </div>
    <nav aria-label="Weitere Seiten">
      <a href="../../modelle.html">Alle Modelle</a>
      <a href="../../impressum.html">Impressum</a>
      <a href="../../agb.html">AGB</a>
      <a href="../../datenschutz.html">Datenschutz</a>
    </nav>
    <p class="foot-small">Die Angaben im Ratgeber sind allgemeine Hinweise, sorgfältig zusammengestellt, aber ohne Gewähr. Sie ersetzen keine Besichtigung durch eine Fachperson. Rückrufe und Serviceintervalle verbindlich beim Markenhändler abklären.</p>
  </div>
</footer>
</body>
</html>
"""


def write(path, text):
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main():
    global TYPES
    TYPES, models = load()
    rate_quality(models)

    for m in models:
        write(OUT / m["id"] / "index.html", page(m, models))
    # Seiten gelöschter Modelle entfernen. Ein ganzer Neuaufbau scheitert unter OneDrive an Dateisperren.
    current = {m["id"] for m in models}
    for folder in OUT.iterdir():
        if folder.is_dir() and folder.name not in current:
            shutil.rmtree(folder)

    listing = SITE / "modelle.html"
    src = listing.read_text(encoding="utf-8")
    new, n = re.subn(r"<!-- MODELLE-START -->.*?<!-- MODELLE-ENDE -->",
                     lambda _: "<!-- MODELLE-START -->" + "".join(card(m) for m in models) + "<!-- MODELLE-ENDE -->", src, flags=re.S)
    if n != 1:
        raise ValueError("Markierung für die Modellliste in modelle.html fehlt")
    write(listing, new)

    urls = [f"{BASE}/{p}" for p in STATIC_PAGES] + [f"{BASE}/modell/{m['id']}/" for m in models if m["indexable"]]
    write(SITE / "sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")

    thin = [m for m in models if not m["indexable"]]
    print(f"{len(models)} Modellseiten, {len(models) - len(thin)} indexierbar, {len(thin)} noindex, Sitemap {len(urls)} URLs")
    if "--list" in sys.argv:
        for m in sorted(thin, key=lambda x: x["own_chars"]):
            print(f"  noindex {m['id']}: {m['own_chars']} Zeichen, {m['own_points']} eigene Punkte")


if __name__ == "__main__":
    main()
