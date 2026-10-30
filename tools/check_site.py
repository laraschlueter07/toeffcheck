#!/usr/bin/env python3
"""Prüft den Ordner site/ ohne Netzwerk: Links, Canonicals, Titel, Sitemap, strukturierte Daten.

Aufruf: python3 tools/check_site.py   (Exit-Code 1 bei Fehlern)
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urldefrag, urlparse

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
BASE = "https://toeffcheck.ch"
NO_CANONICAL_OK = {"danke.html", "404.html"}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.meta, self.ld, self.h1 = [], set(), {}, [], 0
        self.title, self.canonical, self.base = "", None, None
        self._in = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "base":
            self.base = a.get("href")
        if tag == "title":
            self._in = "title"
        if tag == "script" and a.get("type") == "application/ld+json":
            self._in = "ld"
            self.ld.append("")
        if tag == "meta" and a.get("name"):
            self.meta[a["name"]] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
            return
        if tag == "link" and a.get("rel") == "preconnect":
            return
        for key in ("href", "src"):
            if a.get(key):
                self.refs.append(a[key])
        for key in ("srcset", "imagesrcset"):
            if a.get(key):
                self.refs += [c.strip().split()[0] for c in a[key].split(",")]

    def handle_endtag(self, tag):
        if tag in ("title", "script"):
            self._in = None

    def handle_data(self, data):
        if self._in == "title":
            self.title += data
        elif self._in == "ld":
            self.ld[-1] += data


def url_of(rel):
    if rel == "index.html":
        return f"{BASE}/"
    if rel.endswith("/index.html"):
        return f"{BASE}/{rel[:-10]}"
    return f"{BASE}/{rel}"


def resolve(page_rel, ref, base):
    """Liefert die Zieldatei so, wie GitHub Pages sie ausliefert."""
    path = urlparse(ref).path
    start = base if base else "/" + page_rel.rsplit("/", 1)[0] + "/" if "/" in page_rel else base or "/"
    parts = []
    joined = path if path.startswith("/") else start + path
    for p in joined.split("/"):
        if p == "..":
            if not parts:
                return None
            parts.pop()
        elif p and p != ".":
            parts.append(p)
    target = SITE.joinpath(*map(unquote, parts))
    if path == "" or joined.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target


def main():
    errors, pages = [], {}
    for f in sorted(SITE.rglob("*.html")):
        rel = f.relative_to(SITE).as_posix()
        p = Page()
        p.feed(f.read_text(encoding="utf-8"))
        pages[rel] = p

    ext = Counter()
    links = 0
    for rel, p in pages.items():
        for ref in p.refs:
            if ref.startswith(("mailto:", "tel:", "data:")):
                continue
            u = urlparse(ref)
            if u.scheme in ("http", "https"):
                ext[u.netloc] += 1
                if u.netloc != "toeffcheck.ch":
                    continue
                ref = u.path or "/"
                base = "/"
            else:
                base = p.base
            links += 1
            clean, frag = urldefrag(ref)
            if not clean and frag:
                if frag not in p.ids:
                    errors.append(f"{rel}: Anker #{frag} fehlt")
                continue
            target = resolve(rel, clean, base)
            if target is None or not target.is_file():
                errors.append(f"{rel}: kaputter Link {ref}")
                continue
            if frag and target.suffix == ".html":
                other = pages.get(target.relative_to(SITE).as_posix())
                if other and frag not in other.ids:
                    errors.append(f"{rel}: Anker {ref} fehlt im Ziel")
        for block in p.ld:
            try:
                json.loads(block)
            except ValueError as err:
                errors.append(f"{rel}: JSON-LD ungültig ({err})")
        if p.h1 != 1:
            errors.append(f"{rel}: {p.h1} h1-Überschriften")
        if rel not in NO_CANONICAL_OK:
            if p.canonical != url_of(rel):
                errors.append(f"{rel}: Canonical {p.canonical}, erwartet {url_of(rel)}")
            if not p.meta.get("description"):
                errors.append(f"{rel}: Beschreibung fehlt")
        if not p.title.strip():
            errors.append(f"{rel}: Titel fehlt")

    for what, values in (("Titel", {r: p.title for r, p in pages.items()}),
                         ("Beschreibung", {r: p.meta.get("description") for r, p in pages.items() if p.meta.get("description")})):
        for value, n in Counter(values.values()).items():
            if n > 1:
                errors.append(f"{what} {n}-mal gleich: {value[:60]}")

    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [x.text for x in ET.parse(SITE / "sitemap.xml").getroot().findall("s:url/s:loc", ns)]
    if len(locs) != len(set(locs)):
        errors.append("Sitemap enthält doppelte URLs")
    if len(locs) > 50000:
        errors.append("Sitemap zu gross")
    by_url = {p.canonical: r for r, p in pages.items() if p.canonical}
    for loc in locs:
        rel = by_url.get(loc)
        if not rel:
            errors.append(f"Sitemap: keine Seite für {loc}")
        elif "noindex" in pages[rel].meta.get("robots", ""):
            errors.append(f"Sitemap enthält noindex-Seite {loc}")
    model_pages = [r for r in pages if r.startswith("modell/")]
    indexable = [r for r in model_pages if "noindex" not in pages[r].meta.get("robots", "")]
    missing = [r for r in indexable if url_of(r) not in locs]
    if missing:
        errors.append(f"Indexierbare Seiten fehlen in der Sitemap: {missing[:5]}")

    # Jede Modellseite muss über die statische Liste in modelle.html erreichbar sein.
    listed = {r for r in pages["modelle.html"].refs if r.startswith("modell/")}
    for r in model_pages:
        if r[:-10] not in listed:
            errors.append(f"{r}: fehlt in der Liste von modelle.html")
    inbound = Counter(ref.replace("../", "") for r in model_pages for ref in pages[r].refs if re.fullmatch(r"\.\./[a-z0-9-]+/", ref))
    orphans = [r for r in indexable if not inbound[r.split("/")[1] + "/"]]

    # Jedes Modell braucht einen Eintrag für die MotoScout24-Links und die Inserat-Erkennung
    named = set(re.findall(r'^  "([a-z0-9-]+)": \{', (SITE / "modellnamen.js").read_text(encoding="utf-8"), re.M))
    for model_id in re.findall(r'^\s+id: "([a-z0-9-]+)", marke:', (SITE / "modelle.js").read_text(encoding="utf-8"), re.M):
        if model_id not in named:
            errors.append(f"modellnamen.js: Eintrag für {model_id} fehlt")
    for name in ("rechner.js", "mfk.js"):
        copy, src = SITE / name, ROOT / "worker" / "src" / name
        if src.exists() and copy.read_bytes().replace(b"\r\n", b"\n") != src.read_bytes().replace(b"\r\n", b"\n"):
            errors.append(f"site/{name} weicht von worker/src/{name} ab")

    print(f"{len(pages)} HTML-Seiten, {links} interne Links und Dateien geprüft, {len(model_pages)} Modellseiten, "
          f"{len(indexable)} indexierbar, {len(locs)} URLs in der Sitemap")
    print(f"Modellseiten ohne Link von anderen Modellseiten: {len(orphans)}")
    print("Externe Hosts:", ", ".join(f"{h} ({n})" for h, n in sorted(ext.items())))
    for err in errors[:60]:
        print("FEHLER", err)
    print("OK" if not errors else f"{len(errors)} Fehler")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
