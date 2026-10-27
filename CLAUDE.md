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

**Wichtig:** Kein Scraping von MotoScout24, tutti, ricardo usw. (AGB). Daten nur über Händler-Feeds, offizielle Schnittstellen oder Nutzereingaben. Keine erfundenen Marktpreise auf der Seite.

## Ordner
- `site/` – die Website (statisch, kein Build): `index.html`, `style.css`, `app.js`, `danke.html`, `impressum.html`, `datenschutz.html`
- `ANLEITUNG.md` – Schritt-für-Schritt für Netlify, Formular und Domain
- `netlify.toml` – Publish-Ordner `site` (für Deploy über GitHub)

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
  - ⬜ Custom Domain `toeffcheck.ch` in GitHub erst setzen, **nachdem** DNS bei Hostpoint umgestellt ist (sonst leitet github.io auf die noch falsche Domain um): `gh api -X PUT repos/laraschlueter07/toeffcheck/pages -f cname=toeffcheck.ch`, danach HTTPS erzwingen mit `-F https_enforced=true`. Optional: Domain im GitHub-Konto verifizieren (Settings → Pages → Add a domain, TXT-Eintrag bei Hostpoint) gegen Domain-Übernahme.
- ⬜ **DNS bei Hostpoint noch nicht umgestellt** (jetzt für GitHub Pages, Anleitung in `ANLEITUNG.md` Schritt 3): A `toeffcheck.ch` auf `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`; AAAA ohne `*` löschen; `www` CNAME → `<user>.github.io`. NS, MX, TXT, autoconfig/autodiscover/lists und `*`-Zeilen nicht anfassen. Prüfen mit `Resolve-DnsName toeffcheck.ch -Server 1.1.1.1 -DnsOnly`.
- ⬜ Netlify erst abbauen, wenn GitHub Pages + Domain + Warteliste laufen (vorher allfällige Netlify-Formulareinträge exportieren). In Netlify steht `toeffcheck.ch` noch als Custom Domain.

## Als Nächstes geplant
1. GitHub-Repo + Pages einrichten, Formspree-ID eintragen
2. DNS bei Hostpoint auf GitHub umstellen, HTTPS in GitHub aktivieren
3. Händler-Anschreiben + Liste von Töff-Händlern (Region Zürichsee / Zürich zuerst) – Entwürfe, Lara verschickt selbst
4. Später: eigene Adresse `hallo@toeffcheck.ch` bei Hostpoint, dann in Impressum/Datenschutz die Gmail-Adresse ersetzen

## Grenzen
- Keine Konten anlegen, nichts bezahlen, keine Passwörter eingeben. Das macht Lara selbst.
- Nichts in Laras Namen verschicken oder Formulare auf der Live-Seite absenden ohne ausdrückliches OK.
- Es gibt auch einen privaten Claude-Artifact-Prototyp (https://claude.ai/artifact/U5JRcmN8MBvKcerNbWsuTo). Die öffentliche Version ist `site/`.
