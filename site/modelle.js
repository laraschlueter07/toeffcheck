/*
  Töffcheck – Modell-Datenbank
  ============================

  NEUES MODELL EINFÜGEN
  1. Einen Block in MODELLE kopieren (von { bis },) und unten anhängen.
  2. Werte anpassen. Die Reihenfolge ist egal, die Seite sortiert nach Marke und Modell.
  3. Speichern. Fertig, das Modell erscheint im Preis-Check und auf der Modellseite.

  Felder:
    id       einmalig, klein, mit Bindestrichen (wird in Links verwendet, z. B. ?modell=yamaha-mt-07)
    marke    z. B. "Yamaha"
    modell   z. B. "MT-07"
    von, bis Baujahre als Zahl; bis: null heisst "bis heute"
    typ      einer der Schlüssel aus TYPEN (naked, supersport, tourer, adventure, cruiser, retro, roller)
    motor    kurzer Text
    a2       true = als 35-kW-Version erhältlich oder ab Werk A2-tauglich, false = nein/nur Spezialfall
    a2text   (optional) Erklärung zur Kategorie A beschränkt
    kurz     ein bis zwei Sätze, worum es geht
    plus     Stärken (2–4 Punkte)
    minus    Schwächen (2–4 Punkte)
    pruefen  Worauf man bei der Besichtigung achten soll (3–6 Punkte)
    hinweis  (optional) Zusatzinfo, z. B. zu Generationen
*/

const TYPEN = {
  naked: { name: "Naked Bike", pruefen: [
    "Ohne Verkleidung sieht man Stürze schlechter: Kühler, Tankflanken, Lenkerenden und Rahmen genau anschauen.",
    "Wheelie-Spuren: Kratzer unter dem Heck, verbogener Kennzeichenhalter, stark verschlissene Kette.",
    "Nachgerüstete Teile wie Auspuff, Blinker oder Kennzeichenhalter brauchen eine Typengenehmigung oder einen Eintrag."
  ]},
  supersport: { name: "Supersportler", pruefen: [
    "Rennstrecken-Einsatz: Löcher für Sicherungsdraht an Ölablassschraube und Bremssätteln, Reste von Startnummern, Rennverkleidung.",
    "Sturzpads, Fussrasten, Hebel und Lenkerstummel auf Schleifspuren prüfen. Ersetzte Teile sind kein Problem, ein verzogener Rahmen schon.",
    "Kupplung: Rutscht sie beim kräftigen Beschleunigen im hohen Gang, ist sie verschlissen.",
    "Reifen bis ganz an die Kante angeraut? Das kann auf Rennstrecke hindeuten. Frag nach."
  ]},
  tourer: { name: "Tourer", pruefen: [
    "Hohe Kilometerstände sind normal. Wichtiger als die Zahl sind lückenlose Servicebelege.",
    "Koffer und Halter auf Risse prüfen, alle Schlüssel testen.",
    "Federbein: Wurde viel mit Gepäck und Sozius gefahren, ist die Dämpfung oft müde."
  ]},
  adventure: { name: "Reiseenduro", pruefen: [
    "Gelände-Einsatz: Kratzer am Motorschutz, Dellen in den Felgen, verbogene Handprotektoren.",
    "Speichenräder: Jede Speiche mit einem Schlüssel antippen. Alle sollten gleich hell klingen.",
    "Koffer, Halter und Zubehör: Was ist dabei, und ist alles, was es braucht, eingetragen?",
    "Hohe Kilometer sind normal. Servicebelege sind wichtiger als der Tachostand."
  ]},
  cruiser: { name: "Cruiser", pruefen: [
    "Zahnriemen (falls vorhanden) auf Risse, fehlende Zähne und Steinschläge prüfen.",
    "Umbauten sind häufig. In der Schweiz braucht ein anderer Auspuff eine Typengenehmigung oder einen Eintrag, sonst gibt es an der MFK Ärger.",
    "Chrom auf Rost und Lochfrass prüfen, besonders wenn der Töff im Winter gefahren wurde.",
    "Schleifspuren an Trittbrettern oder Fussrasten sind normal, an Auspuff und Rahmen nicht."
  ]},
  retro: { name: "Retro / Scrambler", pruefen: [
    "Umbauten (Auspuff, Blinker, Kennzeichenhalter, Lenker) sind häufig. Papiere dafür verlangen.",
    "Speichenräder: Speichen antippen, Felgen auf Dellen prüfen.",
    "Luftgekühlte Motoren: Ölstand genau kontrollieren und nach Undichtigkeiten schauen."
  ]},
  roller: { name: "Roller", pruefen: [
    "Variomatik: Riemen und Rollen sind Verschleissteile. Frag, wann sie zuletzt gewechselt wurden.",
    "Ruckeln beim Anfahren deutet auf eine verschlissene Kupplung oder Variomatik hin.",
    "Viele Roller werden im Winter gefahren: Rost an Schrauben, Auspuff und Ständer prüfen.",
    "Staufach, Sitzbankschloss und alle Schlüssel testen."
  ]}
};

const MODELLE = [
  {
    id: "yamaha-mt-07", marke: "Yamaha", modell: "MT-07", von: 2014, bis: null, typ: "naked",
    motor: "689 cm³, Zweizylinder", a2: true, a2text: "Gibt es als 35-kW-Version. Viele sind gedrosselt eingelöst.",
    kurz: "Einer der meistverkauften Töffs der letzten Jahre. Leicht, sparsam und gutmütig, deshalb auch bei Fahrschulen beliebt.",
    plus: ["Kräftiger, sparsamer Zweizylinder mit wenig Wartungsaufwand", "Leicht und handlich, ideal für Einsteiger und die Stadt", "Riesige Auswahl, viele Teile und viel Zubehör"],
    minus: ["Weiches, einfaches Fahrwerk, vor allem bei frühen Jahrgängen", "Kaum Windschutz", "Viele stark genutzte Fahrschul- und Einsteigertöffs auf dem Markt"],
    pruefen: [
      "Drosselung: Ist die 35-kW-Version im Fahrzeugausweis eingetragen? Lässt sie sich zurückbauen, und sind die Teile dabei?",
      "Fahrschul-Vergangenheit: viele Vorbesitzer, Umfaller-Spuren an Hebeln, Lenkerenden und Blinkern.",
      "Krümmer und Auspuff unten auf Rost prüfen. Das ist bei der MT-07 häufig und vor allem optisch.",
      "Kette und Ritzel: bei Einsteigertöffs oft vernachlässigt.",
      "Gabel auf Ölspuren prüfen und bei der Probefahrt auf Nachwippen achten."
    ]
  },
  {
    id: "yamaha-mt-09", marke: "Yamaha", modell: "MT-09", von: 2014, bis: null, typ: "naked",
    motor: "847 cm³ (bis 2020), 890 cm³ (ab 2021), Dreizylinder", a2: false,
    kurz: "Dreizylinder mit viel Druck aus dem Keller. Macht Spass, verlangt aber eine ruhige Gashand.",
    plus: ["Starker Dreizylinder mit viel Charakter", "Für die Leistung leicht", "Ab 2021 deutlich besseres Fahrwerk und mehr Elektronik"],
    minus: ["Frühe Jahrgänge (2014–2016) mit sehr direkter Gasannahme", "Einfaches Fahrwerk bei älteren Modellen", "Kleiner Tank, kurze Reichweite"],
    pruefen: [
      "Probefahrt im Stadtverkehr: Starkes Ruckeln beim Gasaufziehen ist bei frühen Modellen typisch, aber ein Verhandlungspunkt.",
      "Wheelie-Spuren: Kratzer unter dem Heck, verbogener Kennzeichenhalter, stark verschlissene Kette.",
      "Nachgerüsteter Auspuff: Typengenehmigung oder Eintrag im Fahrzeugausweis?",
      "Federbein hinten auf Ölspuren und schwache Dämpfung prüfen.",
      "Servicebelege, inklusive Ventilspielkontrolle."
    ]
  },
  {
    id: "yamaha-tracer-9", marke: "Yamaha", modell: "Tracer 900 / Tracer 9", von: 2015, bis: null, typ: "tourer",
    motor: "847 cm³ (bis 2020), 890 cm³ (ab 2021), Dreizylinder", a2: false,
    kurz: "Der Dreizylinder der MT-09 in einem bequemen Tourer. Viele haben hohe Laufleistungen, das muss kein Nachteil sein.",
    plus: ["Kräftiger Motor und bequeme Sitzposition", "Reisetauglich mit Koffern und Windschild", "Ab 2021 viel Komfort-Elektronik"],
    minus: ["Ältere Modelle mit eher weichem Fahrwerk", "Originalkoffer kosten extra, nicht immer dabei"],
    pruefen: [
      "Laufleistung und Belege: Bei 50'000 km und mehr zählt der Service, nicht die Zahl.",
      "Koffer und Halter auf Risse prüfen, alle Schlüssel testen.",
      "Kette, Ritzel und Radlager bei hohen Kilometern genau anschauen.",
      "Probefahrt: Gasannahme im unteren Drehzahlbereich."
    ]
  },
  {
    id: "yamaha-r7", marke: "Yamaha", modell: "YZF-R7", von: 2022, bis: null, typ: "supersport",
    motor: "689 cm³, Zweizylinder", a2: true, a2text: "Gibt es als 35-kW-Version. Viele R7 sind in der Schweiz gedrosselt eingelöst.",
    kurz: "Sportler mit dem Motor der MT-07. Nicht für Rundenzeiten gebaut, aber für die Landstrasse genau richtig.",
    plus: ["Sportliche Optik und Sitzposition mit alltagstauglichem Motor", "Gutes Fahrwerk mit voll einstellbarer Gabel", "Günstiger im Unterhalt als ein Vierzylinder-Supersportler"],
    minus: ["Sitzposition auf langen Touren anstrengend", "Wenig Platz für Sozius", "Spitzenleistung deutlich unter einem 600er-Supersportler"],
    pruefen: [
      "Leistung im Fahrzeugausweis prüfen: Ist die Drosselung eingetragen, und kann sie zurückgebaut werden?",
      "Sturzspuren an Lenkerenden, Fussrasten, Kupplungs- und Bremshebel und an der Verkleidungsunterseite.",
      "Serviceheft und Herstellergarantie: Wurden die Services bei einem Händler gemacht?",
      "Kette und Ritzel: bei Einsteigertöffs oft vernachlässigt.",
      "Nachgerüstete Teile (Quickshifter, Auspuff) brauchen eine Typengenehmigung oder einen Eintrag."
    ]
  },
  {
    id: "kawasaki-z650-ninja-650", marke: "Kawasaki", modell: "Z650 / Ninja 650", von: 2017, bis: null, typ: "naked",
    motor: "649 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich, sehr beliebt bei Einsteigern.",
    kurz: "Zwei Töffs mit gleicher Technik: die Z650 als Naked Bike, die Ninja 650 mit Verkleidung.",
    plus: ["Leicht, handlich und einfach zu fahren", "Sparsamer Zweizylinder", "Ninja 650 mit gutem Windschutz für längere Strecken"],
    minus: ["Einfaches Fahrwerk", "Viele Vorbesitzer und Fahrschul-Töffs", "Motor eher brav, wenig Charakter"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen. Sind die Teile für die Entdrosselung dabei?",
      "Umfaller-Spuren an Hebeln, Spiegeln, Blinkern und Lenkerenden.",
      "Bei der Ninja: Verkleidungshalter auf Risse prüfen, nach einem Umfaller oft nur provisorisch geflickt.",
      "Kette und Ritzel.",
      "Servicebelege, vor allem die Ventilspielkontrolle."
    ]
  },
  {
    id: "kawasaki-z900", marke: "Kawasaki", modell: "Z900", von: 2017, bis: null, typ: "naked",
    motor: "948 cm³, Vierzylinder", a2: false, a2text: "Für Kategorie A beschränkt gab es eine spezielle, drosselbare Version. Fahrzeugausweis prüfen.",
    kurz: "Vierzylinder-Naked-Bike mit viel Leistung für vergleichsweise wenig Geld.",
    plus: ["Kräftiger, ruhig laufender Vierzylinder", "Viel Töff fürs Geld", "Grosse Auswahl auf dem Gebrauchtmarkt"],
    minus: ["Fahrwerk eher einfach abgestimmt", "Kaum Windschutz", "Braucht mehr Benzin als die Zweizylinder der Klasse"],
    pruefen: [
      "Sturz- und Wheelie-Spuren: Kühler, Tankflanken, Heck und Kennzeichenhalter.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Kaltstart und Leerlauf: Der Vierzylinder sollte ruhig und gleichmässig laufen.",
      "Kette und Ritzel, bei zügiger Fahrweise schnell verschlissen.",
      "Servicebelege, vor allem die grosse Inspektion mit Ventilspiel."
    ]
  },
  {
    id: "honda-cb500", marke: "Honda", modell: "CB500F / CBR500R / CB500X", von: 2013, bis: null, typ: "naked",
    motor: "471 cm³, Zweizylinder", a2: true, a2text: "Hat ab Werk 35 kW und braucht keine Drosselung.",
    kurz: "Drei Varianten mit gleichem Motor: F als Naked Bike, R mit Verkleidung, X als kleiner Tourer.",
    hinweis: "Seit 2024 heissen die Nachfolger CB500 Hornet und NX500.",
    plus: ["35 kW ab Werk, keine Drosselung nötig", "Sehr zuverlässiger, sparsamer Motor", "Günstig im Unterhalt"],
    minus: ["Wenig Reserven auf der Autobahn mit Gepäck", "Einfaches Fahrwerk", "Viele ehemalige Fahrschul-Töffs"],
    pruefen: [
      "Fahrschul-Spuren: Umfaller an Hebeln, Spiegeln und Fussrasten.",
      "Bei der CB500X: Gelände-Spuren an Unterseite und Felgen.",
      "Kette und Ritzel.",
      "Gabel auf Ölspuren prüfen.",
      "Servicebelege."
    ]
  },
  {
    id: "honda-cb650r", marke: "Honda", modell: "CB650R / CBR650R", von: 2019, bis: null, typ: "naked",
    motor: "649 cm³, Vierzylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Vierzylinder mit Drehfreude und schönem Klang, aber gutmütig genug für den Alltag.",
    hinweis: "Die Vorgänger von 2014 bis 2018 heissen CB650F und CBR650F und haben einen ähnlichen Motor.",
    plus: ["Seidig laufender Vierzylinder mit schönem Klang", "Gute Verarbeitung", "Als A2-Version erhältlich"],
    minus: ["Wenig Druck bei tiefen Drehzahlen", "Sozius sitzt unbequem"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Sturzspuren am Krümmer: Die vier Rohre liegen vorne offen und sind teuer zu ersetzen.",
      "Kaltstart und Leerlauf.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "honda-nc750x", marke: "Honda", modell: "NC750X", von: 2014, bis: null, typ: "tourer",
    motor: "745 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Der vernünftigste Töff im Ratgeber: sehr sparsam, bequem und mit Helmfach dort, wo sonst der Tank sitzt.",
    hinweis: "Vorgänger war die NC700X (2012–2013).",
    plus: ["Sehr tiefer Verbrauch", "Helmfach statt Tank, der Tank sitzt unter der Sitzbank", "Auch mit automatischem Doppelkupplungsgetriebe (DCT) erhältlich"],
    minus: ["Tiefe Drehzahlgrenze, wenig sportlich", "Einfaches Fahrwerk", "Optik und Klang eher nüchtern"],
    pruefen: [
      "Bei DCT: Ist der Service mit allen vorgesehenen Filtern belegt? Bei der Probefahrt auf ruckfreie Gangwechsel achten.",
      "Helmfach: Schloss und Dichtung prüfen.",
      "Hohe Kilometerstände sind häufig. Die Servicebelege sind wichtiger als die Zahl.",
      "Kette und Ritzel, bei Pendlern stark beansprucht.",
      "Winterbetrieb: Rost an Schrauben, Krümmer und Rahmen."
    ]
  },
  {
    id: "honda-africa-twin", marke: "Honda", modell: "Africa Twin CRF1000L / CRF1100L", von: 2016, bis: null, typ: "adventure",
    motor: "998 cm³ (bis 2019), 1084 cm³ (ab 2020), Zweizylinder", a2: false,
    kurz: "Reiseenduro, die auch im Gelände etwas kann. Viele werden genau dafür gekauft, und manche auch so gefahren.",
    plus: ["Robuster Zweizylinder", "Geländetauglich mit 21-Zoll-Vorderrad", "Auch mit DCT-Automatik erhältlich"],
    minus: ["Hohe Sitzhöhe", "Für echtes Gelände schwer", "Bei vielen Versionen Speichenräder mit Schlauch"],
    pruefen: [
      "Gelände-Spuren: Motorschutz, Felgen, Handprotektoren und Kühler.",
      "Speichen antippen: Alle sollten gleich klingen.",
      "Bei DCT: Service mit allen Filtern belegt?",
      "Gabel-Simmerringe: Ölspuren nach Gelände-Einsatz.",
      "Koffer, Halter und Zubehör: Was ist dabei, was ist eingetragen?"
    ]
  },
  {
    id: "honda-cbr600rr-pc37", marke: "Honda", modell: "CBR600RR (PC37)", von: 2003, bis: 2006, typ: "supersport",
    motor: "599 cm³, Vierzylinder", a2: false,
    kurz: "Hondas 600er-Supersportler im MotoGP-Look der frühen 2000er. Heute bezahlbar, aber oft mit Rennstrecken-Vergangenheit.",
    hinweis: "Ab Modelljahr 2007 heisst die CBR600RR PC40. Eine PC37 mit Inverkehrsetzung 2007 ist meist ein 2006er-Modell, das später eingelöst wurde. Typenschild und Fahrzeugausweis vergleichen.",
    plus: ["Präzises Fahrwerk, sehr drehfreudiger Motor", "Gute Ersatzteilversorgung", "Repsol- und HRC-Farben sind gesucht"],
    minus: ["Harte, sportliche Sitzposition", "Kein ABS"],
    pruefen: [
      "Regler und Gleichrichter: Ladespannung bei laufendem Motor messen (ca. 13,5–14,5 V). Hondas aus dieser Zeit sind dafür bekannt.",
      "Spuren von Rennstrecken-Einsatz: Löcher für Sicherungsdraht, Rennverkleidung, fehlende Originalteile.",
      "Kaltstart anhören: Rasseln aus dem Motor kann auf Steuerkette oder Spanner hindeuten.",
      "Lenkkopflager und Gabel: Rasten in der Mitte, Öl an den Gabelrohren.",
      "Repsol-Lack original oder foliert? Original-Lack hält den Wert besser."
    ]
  },
  {
    id: "honda-vtr1000-sp1", marke: "Honda", modell: "VTR1000 SP-1 (RC51)", von: 2000, bis: 2001, typ: "supersport",
    motor: "999 cm³, V2", a2: false,
    kurz: "Hondas V2-Superbike, mit dem Joey Dunlop im Jahr 2000 an der Isle of Man TT gewann. Heute ein Sammlerstück.",
    hinweis: "Der Nachfolger SP-2 (2002–2006) sieht ähnlich aus. Für Sammler zählt, welche Version es ist und wie original sie ist.",
    plus: ["Charakterstarker V2 mit viel Drehmoment", "Bei Sammlern gesucht, vor allem im Originalzustand", "Rennsport-Geschichte"],
    minus: ["Hoher Verbrauch", "Verkleidungs- und Originalteile teils schwer zu finden"],
    pruefen: [
      "Originalität: Originalauspuff, Originalverkleidung und Originalfarbe vorhanden? Umbauten drücken den Sammlerwert.",
      "Regler und Gleichrichter, wie bei allen Hondas dieser Zeit: Ladespannung messen.",
      "Ventilspiel-Kontrollen mit Belegen nachweisen lassen.",
      "Startverhalten kalt und warm: Unruhiger Leerlauf deutet oft auf eine verstellte Einspritzung oder Drosselklappen-Synchronisation hin.",
      "Rahmen und Schwinge auf Sturz- oder Richtspuren prüfen, besonders nach Rennstrecken-Einsatz."
    ]
  },
  {
    id: "bmw-r-1200-1250-gs", marke: "BMW", modell: "R 1200 GS / R 1250 GS", von: 2004, bis: 2023, typ: "adventure",
    motor: "1170 cm³ (R 1200), 1254 cm³ (R 1250), Boxer-Zweizylinder", a2: false,
    kurz: "Eine der beliebtesten Reiseenduros der Schweiz. Bequem, vielseitig und mit riesigem Zubehörangebot.",
    hinweis: "Bis 2012 luft- und ölgekühlt, ab 2013 wassergekühlt (LC). Die R 1250 GS (ab 2019) hat eine variable Nockenwelle (ShiftCam).",
    plus: ["Sehr bequem, auch zu zweit und mit Gepäck", "Kardanantrieb statt Kette", "Grosses Händler- und Werkstattnetz"],
    minus: ["Teure Ersatzteile und Services", "Viel Elektronik, die bei älteren Modellen ausfallen kann", "Hohes Gewicht"],
    pruefen: [
      "Kardan und Hinterachsgetriebe: Hinterrad anheben, auf Spiel prüfen, nach Öl am Getriebe schauen.",
      "Elektronisches Fahrwerk (ESA), falls verbaut: alle Modi durchschalten, erscheinen Fehlermeldungen?",
      "Rückrufe beim BMW-Händler mit der Rahmennummer abfragen.",
      "Servicebelege: Bei einer GS lohnt sich ein Töff mit lückenloser Händlerhistorie.",
      "Koffer, Zusatzscheinwerfer und Navi-Halter: Was ist dabei, was ist eingetragen?"
    ]
  },
  {
    id: "ktm-390-duke", marke: "KTM", modell: "390 Duke", von: 2013, bis: 2023, typ: "naked",
    motor: "373 cm³, Einzylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "Leichter, spritziger Einzylinder. Beliebt als erster Töff und für die Stadt.",
    hinweis: "Ab 2024 gibt es die 390 Duke mit neuem 399-cm³-Motor.",
    plus: ["Sehr leicht und wendig", "A2-tauglich ohne Drosselung", "Gute Bremsen und moderne Ausstattung für die Klasse"],
    minus: ["Der Einzylinder vibriert auf der Autobahn", "Verarbeitung bei älteren Jahrgängen mit Schwächen", "Wenig Komfort für Sozius"],
    pruefen: [
      "Elektrik und Stecker: Alle Funktionen am Cockpit durchschalten, den Kühlerlüfter bei warmem Motor anlaufen lassen.",
      "Umfaller-Spuren, häufig bei Einsteigern.",
      "Kühlflüssigkeit: Stand und Farbe prüfen.",
      "Kette und Ritzel.",
      "Servicebelege, vor allem Ventilspiel und Ölwechsel nach Plan."
    ]
  },
  {
    id: "triumph-street-triple", marke: "Triumph", modell: "Street Triple", von: 2007, bis: null, typ: "naked",
    motor: "675 cm³ (bis 2016), 765 cm³ (ab 2017), Dreizylinder", a2: false, a2text: "Für Kategorie A beschränkt gab es eine 660-cm³-Version der Street Triple S.",
    kurz: "Dreizylinder mit viel Charakter und präzisem Fahrwerk. Eines der sportlichsten Naked Bikes.",
    plus: ["Drehfreudiger Dreizylinder mit typischem Klang", "Präzises, sportliches Fahrwerk", "Gute Bremsen"],
    minus: ["Sportliche Sitzposition", "Service und Teile teurer als bei den Japanern"],
    pruefen: [
      "Regler und Gleichrichter: Ladespannung messen und Stecker auf Hitzespuren prüfen, vor allem beim 675er.",
      "Kühlerlüfter: Läuft er an, wenn der Motor warm ist?",
      "Sturz- und Wheelie-Spuren.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Servicebelege, inklusive Ventilspiel."
    ]
  },
  {
    id: "ducati-monster", marke: "Ducati", modell: "Monster", von: 1993, bis: null, typ: "naked",
    motor: "je nach Generation 600 bis 1200 cm³, V2", a2: false, a2text: "Es gibt gedrosselte Versionen, zum Beispiel die Monster 797. Eintrag im Fahrzeugausweis prüfen.",
    kurz: "Das Naked Bike von Ducati. Viele Generationen, viele Motoren, und bei allen ist der Service das wichtigste Thema.",
    hinweis: "Grob gibt es luftgekühlte Monster (bis etwa 2014) und wassergekühlte mit Testastretta-Motor. Die Wartung unterscheidet sich stark.",
    plus: ["Typischer V2-Charakter und Klang", "Leicht und handlich", "Grosse Szene, viel Zubehör"],
    minus: ["Wartung teurer als bei japanischen Töffs", "Viel Hitze am Bein im Stadtverkehr"],
    pruefen: [
      "Zahnriemen: Wechseldatum belegen lassen. Das Intervall gilt nach Kilometern und nach Jahren.",
      "Desmo-Service (Ventilspiel): Rechnung einer Ducati-Werkstatt verlangen. Das Intervall ist je nach Generation sehr verschieden.",
      "Trockenkupplung bei manchen älteren Modellen: Rasseln im Leerlauf ist dort normal.",
      "Elektrik: Regler, Batterie und Stecker auf Hitzeschäden prüfen.",
      "Umbauten wie Auspuff oder Steuergerät-Mapping brauchen Papiere."
    ]
  },
  {
    id: "ducati-scrambler-800", marke: "Ducati", modell: "Scrambler 800", von: 2015, bis: null, typ: "retro",
    motor: "803 cm³, luftgekühlter V2", a2: true, a2text: "Gibt es als 35-kW-Version. Für A2 gab es ausserdem die kleinere Scrambler Sixty2 mit 399 cm³.",
    kurz: "Retro-Töff mit Ducati-Motor, einfacher und günstiger im Unterhalt als die Sportler der Marke.",
    plus: ["Leicht, tiefe Sitzhöhe, einfach zu fahren", "Viele Varianten (Icon, Full Throttle, Café Racer, Desert Sled)", "Luftgekühlter Motor mit einfacher Technik"],
    minus: ["Kaum Windschutz, eher für kurze Touren", "Einfaches Fahrwerk bei der Basisversion", "Kleiner Tank"],
    pruefen: [
      "Zahnriemen: Wechseldatum belegen lassen (nach Kilometern und nach Jahren).",
      "Desmo-Service: Rechnungen verlangen.",
      "Umbauten an Auspuff, Blinkern und Kennzeichenhalter sind häufig. Papiere prüfen.",
      "Bei der Desert Sled: Gelände-Spuren an Unterseite und Felgen."
    ]
  },
  {
    id: "ducati-848", marke: "Ducati", modell: "848 / 848 EVO", von: 2008, bis: 2013, typ: "supersport",
    motor: "849 cm³, V2", a2: false,
    kurz: "Der kleinere Bruder der 1098 mit dem gleichen Look. Bezahlbarer Einstieg in die Ducati-Superbikes.",
    plus: ["Superbike-Optik und -Fahrwerk", "Nasskupplung, alltagstauglicher als die 1098", "Charakterstarker V2"],
    minus: ["Wartung teuer und nicht verhandelbar", "Sehr sportliche Sitzposition", "Viel Hitze im Stadtverkehr"],
    pruefen: [
      "Zahnriemenwechsel mit Datum belegen. Ducati schreibt ein Intervall nach Zeit und nach Kilometern vor, auch wenn der Töff kaum gefahren wurde.",
      "Desmo-Service und Ventilspiel: Rechnungen einer Ducati-Fachwerkstatt verlangen.",
      "Die 848 hat eine Nasskupplung. Rasseln wie bei einer Trockenkupplung (1098) ist hier nicht normal.",
      "Elektrik: Regler, Batterie und Kabelbaum nahe am Motor auf Hitzeschäden prüfen.",
      "Umbauten wie Termignoni-Auspuff oder Steuergerät-Mapping brauchen einen Eintrag."
    ]
  },
  {
    id: "suzuki-sv650", marke: "Suzuki", modell: "SV650", von: 1999, bis: null, typ: "naked",
    motor: "645 cm³, V2", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Zuverlässiger V2 zu einem fairen Preis. Seit über 25 Jahren ein Dauerbrenner.",
    hinweis: "Drei Generationen: 1999–2002, 2003–2010 und ab 2016.",
    plus: ["Robuster V2 mit viel Drehmoment", "Günstig im Unterhalt", "Viele Teile und viel Zubehör"],
    minus: ["Einfaches Fahrwerk, vor allem die Gabel", "Ältere Modelle ohne ABS"],
    pruefen: [
      "Bei älteren Modellen: Regler und Gleichrichter, Ladespannung messen.",
      "Rost an Rahmen, Schrauben und Krümmer bei älteren Jahrgängen.",
      "Drosselung im Fahrzeugausweis prüfen.",
      "Gabel: Ölspuren, Nachwippen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "suzuki-v-strom-650", marke: "Suzuki", modell: "V-Strom 650", von: 2004, bis: 2023, typ: "adventure",
    motor: "645 cm³, V2", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Unspektakulär, aber sehr zuverlässig. Sie gilt als langlebig, hohe Kilometerstände sind keine Seltenheit.",
    plus: ["Robuster V2, gilt als sehr langlebig", "Bequem, gute Reichweite", "Günstig im Unterhalt"],
    minus: ["Optik und Fahrwerk eher schlicht", "Eher Werkzeug als Spielzeug"],
    pruefen: [
      "Hohe Kilometer sind normal: Servicebelege sind wichtiger als der Tachostand.",
      "Regler und Ladespannung prüfen.",
      "Kette, Ritzel und Radlager.",
      "Koffer und Halter auf Risse prüfen.",
      "Gelände-Spuren an Unterseite und Motorschutz."
    ]
  },
  {
    id: "harley-davidson-sportster", marke: "Harley-Davidson", modell: "Sportster 883 / 1200", von: 1986, bis: 2022, typ: "cruiser",
    motor: "883 oder 1202 cm³, luftgekühlter V2", a2: false,
    kurz: "Der klassische Einstieg in die Harley-Welt. Einfache Technik und unzählige Umbauten.",
    hinweis: "Ab 2004 ist der Motor in Gummi gelagert, das reduziert die Vibrationen deutlich.",
    plus: ["Einfache, robuste Technik", "Zahnriemen statt Kette, wenig Wartung", "Riesiger Zubehörmarkt"],
    minus: ["Kleiner Tank bei vielen Modellen", "Schwer und wenig Schräglagenfreiheit", "Wenig Komfort für Sozius"],
    pruefen: [
      "Zahnriemen auf Risse, fehlende Zähne und Steinschläge prüfen.",
      "Öl-Undichtigkeiten am Motor und an den Stösselstangen-Rohren.",
      "Auspuff, Luftfilter und Mapping: In der Schweiz brauchen Umbauten eine Typengenehmigung oder einen Eintrag.",
      "Chrom auf Rost prüfen."
    ]
  },
  {
    id: "yamaha-tmax", marke: "Yamaha", modell: "TMAX", von: 2001, bis: null, typ: "roller",
    motor: "499 / 530 / 560 cm³, Zweizylinder", a2: false, a2text: "Leistung im Fahrzeugausweis prüfen, gedrosselte Versionen kommen vor.",
    kurz: "Der sportlichste Roller auf dem Markt. Beliebt bei Pendlerinnen und Pendlern, die nicht schalten wollen.",
    hinweis: "499 cm³ bis 2011, 530 cm³ von 2012 bis 2019, 560 cm³ ab 2020.",
    plus: ["Fahrwerk und Bremsen eher wie bei einem Töff", "Stauraum unter der Sitzbank", "Automatik, bequem im Stadtverkehr"],
    minus: ["Verschleissteile der Variomatik gehen ins Geld", "Schwer zum Rangieren"],
    pruefen: [
      "Variomatik-Riemen und Rollen: Wann wurden sie zuletzt gewechselt?",
      "Ab 2012 mit Riemen als Endantrieb: Riemen auf Risse prüfen.",
      "Ruckeln beim Anfahren deutet auf Kupplungs- oder Variomatik-Verschleiss hin.",
      "Winterbetrieb: Rost an Schrauben, Auspuff und Ständer."
    ]
  }
];

// Hilfsfunktionen, die beide Seiten brauchen
const jahreText = m => m.von + "–" + (m.bis || "heute");
const sortiert = () => [...MODELLE].sort((a, b) => (a.marke + a.modell).localeCompare(b.marke + b.modell, "de"));
