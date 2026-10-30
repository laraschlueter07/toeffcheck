# Töffcheck – Projektkontext für Claude

Dieses Projekt ist ein **Business-Projekt**, kein Lernprojekt. Nicht unterrichten, keine Übungsaufgaben. Einfach bauen, erklären, was die Person selbst tun muss, und Schritt für Schritt begleiten.

## Die Person
- Lara, wohnt in der Schweiz (Wädenswil ZH). Sprache: Deutsch (Schweizer Schreibweise, „ss“ statt „ß“), locker, mit „du“.
- Fährt selbst Töff: Honda CBR600RR Repsol (PC37, Inverkehrsetzung 2007) und Yamaha R7 (2023).
  Traumbikes: Honda VTR1000 SP-1 (Joey Dunlops TT-Bike) und Ducati 848.
- Kein technischer Hintergrund in Webhosting/DNS: Klickanleitungen mit genauen Menünamen geben, bei Unsicherheit um Screenshot bitten (Windows+Shift+S, dann Strg+V im Chat).

## Die Idee
**Töffcheck** – Gebrauchtmotorrad-Deal-Finder für die Schweiz.
1. **Jetzt:** Preis-Check. Nutzer geben ein Inserat plus mind. 3 Vergleichsangebote (MotoScout24, tutti, ricardo) ein, die Seite schätzt per linearer Regression über den km-Stand den fairen Preis und urteilt „Guter Deal / Fair / Zu teuer“ (±8 %). Dazu Besichtigungs-Checklisten pro Modell.
2. **Als Nächstes:** Schweizer Töff-Händler gewinnen, die ihren Bestand freiwillig als Feed liefern.
3. **Später:** Deal-Alarme (Abo ca. 5 CHF/Monat) für Bikes unter Marktwert.

**Wichtig:** Kein Scraping von MotoScout24, tutti, ricardo, Facebook Marketplace usw. (AGB). Lara wollte am 27.10.2026 automatisches Suchen und Vergleichen; umgesetzt sind stattdessen Such-Links pro Plattform (MotoScout24 nur auf Markenebene `/de/s/mk-<marke>`, ricardo `/de/s/<q>`, tutti `/de/q/suche?query=`, Facebook `/marketplace/search/?query=`) und ein Textfeld, das kopierten Inserat-Text lokal auswertet (Preis, km, Jahrgang, Modell). Daten nur über Händler-Feeds, offizielle Schnittstellen oder Nutzereingaben. Keine erfundenen Marktpreise auf der Seite.

**Öffentlicher Auftritt (Laras Vorgabe 27.10.2026):** Auf der Seite ist Töffcheck ein **Schulprojekt einer Privatperson, keine Firma**. Impressum, AGB und Datenschutz sind so formuliert. Keine Firmenbezeichnung, keine Gewinnabsicht behaupten oder bestreiten, keine Preise für den Deal-Alarm nennen.

**Design und Texte:** Schwarz-Rot (Laras Wunsch 27.10.2026, kein Gelb mehr): Grund #0d0d0e, Schrift #f3f1ec, Rennrot #e1251b (Text-Rot #ff4a3d), harte Kanten, Schriften Big Shoulders Display / IBM Plex Sans / IBM Plex Mono. Logo: rotes Oval mit weissem Haken. Keine generischen Verläufe, Emojis oder Floskeln. Texte kurz, konkret, Schweizer Schreibweise, du-Form, kaum Gedankenstriche. Modellinfos nur, wenn sie belegbar sind; im Zweifel als Prüfpunkt formulieren statt als Tatsache.

## Ordner
- `site/` – die Website (statisch, kein Build): `index.html` (Preis-Check, Ratgeber, Checkliste, FAQ, Warteliste), `modelle.html` + `liste.js` (Modellübersicht), `modelle.js` (**Modell-Datenbank, neue Modelle hier einfügen**), `app.js`, `style.css`, `impressum.html`, `agb.html`, `datenschutz.html`, `danke.html`, `404.html`, `robots.txt`, `sitemap.xml`, Icons, `img/` (Unsplash-Fotos, Bildnachweis im Impressum)
- `site/modell/<id>/` – generierte Modellseiten, nicht von Hand ändern. `tools/build_models.py` erzeugt sie, die Liste in `modelle.html` und `sitemap.xml` aus `modelle.js`; `tools/check_site.py` prüft Links, Canonicals, Titel und Sitemap. Beides läuft auch im Deploy. Keine Build-Pakete, nur Python-Standardbibliothek.
- `site/rechner.js` – Preisrechnung, identische Kopie von `worker/src/rechner.js`; bei Änderungen beide angleichen (`check_site.py` vergleicht sie, solange `worker/` existiert).
- `ANLEITUNG.md` – Schritt-für-Schritt für GitHub, Formspree und DNS
- `.github/workflows/pages.yml` – veröffentlicht `site/` auf GitHub Pages
- `.claude/launch.json` – lokaler Testserver (`python -m http.server` auf Port 8000)

## Stand (27.10.2026)
- ✅ Website online auf Netlify: https://effulgent-tulumba-b5972b.netlify.app (öffentlich, bisher per Drag & Drop auf Netlify Drop hochgeladen)
- ✅ Netlify Forms: Formular-Erkennung an, Formular `warteliste` erkannt (Felder: email, modell, kanton, einwilligung; Honeypot `bot-field`; Weiterleitung auf `/danke.html`)
- ⬜ Echter Testeintrag in der Warteliste: noch nicht bestätigt, Lara soll ihn selbst machen und unter Forms prüfen
- ✅ Impressum und Datenschutz mit Laras Name, Adresse und E-Mail ausgefüllt (revDSG-Vorlage, keine Rechtsberatung). Netlify gibt an, nach Swiss-U.S. DPF zertifiziert zu sein.
- ✅ Domain `toeffcheck.ch` gekauft bei **Hostpoint** (Domain Shield Datenschutz aktiv). Lara hat Zugang zum Hostpoint Control Panel.
- ✅ In Netlify ist `toeffcheck.ch` als Custom Domain hinzugefügt (externes DNS), Status „Pending External DNS verification“.
- **Entscheid 27.10.2026: Umzug von Netlify auf echtes GitHub Pages.** Claude soll selbstständig ändern und pushen.
  - ✅ Git 2.56 und GitHub CLI 2.103 per winget installiert. In einer alten Shell ggf. PATH neu laden: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
  - ✅ Deploy-Workflow `.github/workflows/pages.yml` veröffentlicht `site/` bei Push auf `main` (Pages-Quelle: GitHub Actions). `netlify.toml` gelöscht. Links in `site/` sind relativ, damit die Seite auch unter `<user>.github.io/toeffcheck/` läuft.
  - ✅ Warteliste auf Formspree umgebaut (`action="https://formspree.io/f/FORMSPREE_ID"`, Honeypot `_gotcha`, Versand per fetch in `app.js`, danach `danke.html`). ⬜ Lara legt Formspree-Konto an und gibt die Formular-ID, dann `FORMSPREE_ID` ersetzen.
  - ✅ Datenschutz auf GitHub + Formspree umgeschrieben. ⬜ DPF-Status von GitHub, Inc. und Formspree, Inc. auf dataprivacyframework.gov noch nicht geprüft (nichts behaupten, bevor bestätigt).
  - ✅ GitHub-Konto `laraschlueter07`, `gh` angemeldet (Scopes repo, workflow). Öffentliches Repo https://github.com/laraschlueter07/toeffcheck, Branch `main`, Pages-Quelle „GitHub Actions“. **Live: https://laraschlueter07.github.io/toeffcheck/** (erster Deploy 27.10.2026 erfolgreich). Claude darf in diesem Repo selbstständig committen und auf `main` pushen; Commits laufen mit der noreply-Adresse `348843019+laraschlueter07@users.noreply.github.com` (lokal in git config gesetzt).
  - ✅ **DNS bei Hostpoint umgestellt (27.10.2026):** `toeffcheck.ch` A → `185.199.108–111.153`, alter A/AAAA ohne `*` gelöscht, `www` CNAME → `laraschlueter07.github.io`. `*`-Zeilen, MX, TXT usw. unverändert. Hostpoint hatte die alten A/AAAA-Werte zwischendurch selbst geändert und beim ersten Speichern „Unerwarteter interner Fehler“ gezeigt; schrittweises Löschen/Hinzufügen klappte.
  - ✅ **Custom Domain `toeffcheck.ch` in GitHub Pages gesetzt, Zertifikat ausgestellt, HTTPS erzwungen. Live: https://toeffcheck.ch** (www leitet auf die Hauptdomain um). Im Browser geprüft.
  - ⬜ Optional: Domain im GitHub-Konto verifizieren (github.com → Settings → Pages → Add a domain, TXT-Eintrag bei Hostpoint) gegen Domain-Übernahme.
  - Hinweis: PowerShell `Invoke-WebRequest` auf diesem PC scheitert an HTTPS („Vertrauensstellung“), auch bei github.io. Live-Seite deshalb im Browser-Pane prüfen.
- ⬜ Netlify erst abbauen, wenn GitHub Pages + Domain + Warteliste laufen (vorher allfällige Netlify-Formulareinträge exportieren). In Netlify steht `toeffcheck.ch` noch als Custom Domain.

- ✅ **Relaunch 27.10.2026:** neues Design, 22 Modelle im Ratgeber (Stärken, Schwächen, Prüfpunkte, A2-Info), Typ-Checklisten für „Anderes Modell“, allgemeine Besichtigungs-Checkliste (statisches HTML, gut für SEO), Reifenalter-Rechner (DOT), anstehende Kosten, Verhandlungsziel, Ausreisser-Erkennung (Theil-Sen), Handy-Ergebnisleiste, Druckansicht. SEO: Titel/Description/Canonical/OG pro Seite, JSON-LD (WebSite, WebApplication, FAQPage, CollectionPage), robots.txt, sitemap.xml, 404-Seite. Neue Seite `agb.html`; Impressum/Datenschutz als Schulprojekt umgeschrieben.
- ✅ **Update 27.10.2026 (zweite Runde):** Datenbank auf 108 Modelle erweitert (KTM, Yamaha, Ducati, Honda, Aprilia, Kawasaki, Suzuki, Triumph, BMW, plus Sportster); neuer Typ `enduro`; `a2: null` = unsicher (Seite zeigt „im Fahrzeugausweis prüfen“). Marken-Filter auf der Modellseite. Strasse und PLZ auf Laras Wunsch („auf Eigenverantwortung“) aus Impressum, AGB und Datenschutz entfernt; nur noch „Wädenswil, Schweiz“. In der öffentlichen Git-History steht die alte Adresse noch.
- ⬜ Google Search Console: Lara verifiziert per TXT bei Hostpoint und reicht `sitemap.xml` ein (Anleitung in ANLEITUNG.md). Bei Sitemap-Änderungen `lastmod` nachführen.

- Branch `verbesserung/preisrechner-modellseiten` (30.10.2026, lokal): Rechner auf `rechner.js` umgestellt, Beispielwerte markiert, 108 Modellseiten, davon nur Seiten mit genug eigenem Text indexierbar. Noch nicht gepusht. `prototype/` und `worker/` bleiben vorerst separat und sind nicht committet.

## Als Nächstes geplant
1. Formspree-ID eintragen, Lara macht Testeintrag
2. DPF-Status GitHub/Formspree prüfen, Datenschutz ergänzen; Netlify abbauen
3. Händler-Anschreiben + Liste von Töff-Händlern (Region Zürichsee / Zürich zuerst) – Entwürfe, Lara verschickt selbst
4. Später: eigene Adresse `hallo@toeffcheck.ch` bei Hostpoint, dann in Impressum/Datenschutz die Gmail-Adresse ersetzen

## Grenzen
- Keine Konten anlegen, nichts bezahlen, keine Passwörter eingeben. Das macht Lara selbst.
- Nichts in Laras Namen verschicken oder Formulare auf der Live-Seite absenden ohne ausdrückliches OK.
- Es gibt auch einen privaten Claude-Artifact-Prototyp (https://claude.ai/artifact/U5JRcmN8MBvKcerNbWsuTo). Die öffentliche Version ist `site/`.
