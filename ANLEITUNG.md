# Töffcheck online – deine Schritte

Die Website liegt im Ordner `site/`. Sie wird über **GitHub Pages** ausgeliefert. Bei jedem Push auf `main` veröffentlicht GitHub den Ordner `site/` automatisch (siehe `.github/workflows/pages.yml`). Claude ändert die Dateien und pusht selbst.

Die Warteliste läuft über **Formspree**, weil GitHub Pages keine Formulare verarbeiten kann.

---

## 1. GitHub-Konto und Anmeldung (einmalig, 10 Minuten)

1. Auf **github.com** ein kostenloses Konto anlegen (machst du selbst).
2. Ein **neues** PowerShell-Fenster öffnen und eingeben:
   ```
   gh auth login --web --git-protocol https
   ```
   Es zeigt einen Code an. Im Browser einfügen und auf **Authorize** klicken.
3. Claude Bescheid geben. Claude legt dann das Repo an, pusht und schaltet GitHub Pages ein.

Das Repo ist **öffentlich**, weil GitHub Pages im Gratis-Abo nur so geht. Im Code steht nichts Geheimes. Name und Adresse stehen sowieso im Impressum.

## 2. Formspree für die Warteliste (10 Minuten)

1. Auf **formspree.io** ein kostenloses Konto anlegen (machst du selbst).
2. **+ New Form** → Name `Warteliste Töffcheck` → E-Mail, an die die Einträge gehen.
3. Formspree zeigt eine Adresse wie `https://formspree.io/f/abcdwxyz`. Die letzten 8 Zeichen (`abcdwxyz`) sind die Formular-ID. Gib sie Claude.
4. Claude trägt die ID ein und pusht. Danach einmal selbst testen: Eintragen, du solltest auf „Du bist auf der Warteliste“ landen, und der Eintrag erscheint bei Formspree.
5. Beim ersten echten Eintrag schickt Formspree eventuell eine Bestätigungsmail. Den Link darin anklicken.

Der Gratisplan von Formspree hat ein Monatskontingent an Einträgen. Wenn die Liste wächst, ziehen wir in ein Newsletter-Tool um.

## 3. Domain toeffcheck.ch bei Hostpoint auf GitHub zeigen lassen

Erst machen, wenn die Seite unter `https://<dein-name>.github.io/toeffcheck/` läuft und Claude die Domain in GitHub eingetragen hat.

Hostpoint Control Panel → **Domains** → `toeffcheck.ch` → **DNS-Zone**:

1. Den A-Eintrag `toeffcheck.ch` → `217.26.48.101` bearbeiten auf `185.199.108.153`.
2. Drei neue A-Einträge für `toeffcheck.ch`: `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Den AAAA-Eintrag `toeffcheck.ch` → `2a00:d70:0:a::166` löschen (nur die Zeile ohne `*`).
4. Neu: `www` CNAME → `<dein-github-name>.github.io`

Nicht anfassen: NS, MX, TXT, autoconfig/autodiscover/lists und alle `*.toeffcheck.ch`-Zeilen. Keine Vorlagen-Knöpfe, nicht „DNS-Zone zurücksetzen“.

Danach in GitHub unter **Settings → Pages** warten, bis der DNS-Check grün ist, und **Enforce HTTPS** anhaken (oder Claude macht das).

## Neues Modell in den Ratgeber einfügen (5 Minuten)

Alle Modelle stehen in **`site/modelle.js`**. Oben in der Datei ist erklärt, was jedes Feld bedeutet.

1. `site/modelle.js` mit einem Texteditor öffnen (z. B. Editor oder VS Code).
2. Einen bestehenden Block von `{` bis `},` kopieren und unten in der Liste `MODELLE` einfügen.
3. `id`, `marke`, `modell`, Baujahre, `typ` und die Texte anpassen. Die `id` muss einmalig sein, klein geschrieben und mit Bindestrichen, z. B. `aprilia-tuono-660`.
4. Speichern. Oder einfach Claude sagen: «Füg die Aprilia Tuono 660 hinzu», dann macht Claude das und pusht.

Das Modell erscheint danach automatisch im Preis-Check, im Ratgeber und auf der Modellseite.

### Eigene Modellseiten für Google

Jedes Modell bekommt automatisch eine Seite unter `toeffcheck.ch/modell/<id>/`. Die Seiten, die Modellliste und die Sitemap erzeugt `tools/build_models.py` aus `site/modelle.js`, auch bei jedem Deploy. Von Hand musst du dort nichts ändern.

Lokal neu erzeugen und prüfen:

```
python tools/build_models.py --list
python tools/check_site.py
```

Modelle mit wenig eigenem Text (unter 300 Zeichen oder unter 4 eigenen Punkten) bekommen `noindex` und stehen nicht in der Sitemap. `--list` zeigt sie. Sobald ein Eintrag genug belegten Inhalt hat, wird er beim nächsten Lauf automatisch indexierbar. Standardsätze wie «Kette und Ritzel.» zählen nicht als eigener Text.

## Google Search Console (einmalig, 10 Minuten)

Damit Google die Seite schneller findet und du siehst, mit welchen Suchbegriffen Leute kommen:

1. Auf **search.google.com/search-console** mit deinem Google-Konto anmelden.
2. **Property hinzufügen** → **Domain** → `toeffcheck.ch` eingeben.
3. Google zeigt einen TXT-Eintrag (beginnt mit `google-site-verification=`). Diesen bei Hostpoint in der DNS-Zone als **neuen TXT-Eintrag** für `toeffcheck.ch` hinzufügen. Den bestehenden SPF-TXT-Eintrag nicht ändern.
4. In der Search Console auf **Bestätigen** klicken (kann ein paar Minuten dauern).
5. Links **Sitemaps** → `sitemap.xml` eintragen → **Senden**.

## 4. Netlify aufräumen (wenn alles läuft)

Erst wenn `toeffcheck.ch` über GitHub läuft und die Warteliste getestet ist: In Netlify unter **Forms** die alten Einträge (falls vorhanden) exportieren, dann die Site löschen oder die Domain entfernen.

---

## Was Claude nicht für dich machen kann

- Konten anlegen (GitHub, Formspree) und Passwörter eingeben
- DNS bei Hostpoint ändern (Klickanleitung oben)

## Kosten

| Posten | Kosten |
|---|---|
| GitHub Pages | 0 CHF |
| Formspree (Gratisplan) | 0 CHF |
| Domain toeffcheck.ch | ca. 10–20 CHF/Jahr |
