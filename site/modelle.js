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
    typ      einer der Schlüssel aus TYPEN (naked, supersport, tourer, adventure, enduro, cruiser, retro, roller)
    motor    kurzer Text
    a2       true = als 35-kW-Version erhältlich oder ab Werk A2-tauglich, false = nein/nur Spezialfall,
             null = nicht sicher (die Seite zeigt dann "im Fahrzeugausweis prüfen")
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
  enduro: { name: "Enduro / Supermoto", pruefen: [
    "Sprung- und Sturzspuren: Rahmen, Felgen, Lenker, Handprotektoren und Fussrasten.",
    "Einzylinder haben kurze Wartungsintervalle. Ölwechsel und Ventilspiel belegt?",
    "Luftfilter anschauen: Ein verdreckter Filter verrät, wie gefahren und gewartet wurde.",
    "Federelemente: Ölspuren an Gabel und Federbein?"
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
    motor: "499 / 530 / 560 cm³, Zweizylinder", a2: null, a2text: "Gedrosselte Versionen kommen vor.",
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
  },

  /* ---------- KTM ---------- */
  {
    id: "ktm-125-duke", marke: "KTM", modell: "125 Duke", von: 2011, bis: null, typ: "naked",
    motor: "125 cm³, Einzylinder", a2: true, a2text: "125er: auch mit Kategorie A1 fahrbar.",
    kurz: "Beliebter 125er für den Einstieg mit Kategorie A1, im Look der grossen Duke.",
    plus: ["Sieht aus wie ein grosser Töff", "Gute Bremsen und gutes Fahrwerk für die Klasse", "Günstig im Unterhalt"],
    minus: ["Wenig Leistung für Autobahn und Pässe zu zweit", "Oft von Fahranfängern mit vielen Vorbesitzern"],
    pruefen: [
      "Umfaller-Spuren an Hebeln, Spiegeln und Blinkern.",
      "Ölwechsel nach Plan belegt? Kleine Motoren drehen viel und brauchen frisches Öl.",
      "Tuning (Auspuff, Drosselung entfernt)? Alles muss zum Fahrzeugausweis passen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "ktm-790-890-duke", marke: "KTM", modell: "790 Duke / 890 Duke", von: 2018, bis: null, typ: "naked",
    motor: "799 cm³ (790), 889 cm³ (890), Zweizylinder", a2: null,
    kurz: "Leichtes Naked Bike mit kräftigem Zweizylinder. Die 890 ist die stärkere Weiterentwicklung.",
    plus: ["Sehr leicht und handlich", "Kräftiger Zweizylinder mit viel Elektronik", "Präzises Fahrwerk, vor allem bei der 890 R"],
    minus: ["Einfache Federelemente bei der 790", "Wenig Komfort für Sozius"],
    pruefen: [
      "Elektronik: Fahrmodi, Traktionskontrolle und Quickshifter (falls verbaut) testen.",
      "Wheelie- und Sturzspuren an Heck, Kühler und Lenker.",
      "Servicebelege inklusive Ventilspielkontrolle.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?"
    ]
  },
  {
    id: "ktm-1290-super-duke", marke: "KTM", modell: "1290 Super Duke R", von: 2014, bis: null, typ: "naked",
    motor: "1301 cm³, V2", a2: false,
    kurz: "Eines der stärksten Naked Bikes. Viel Leistung, viel Elektronik, nichts für Einsteiger.",
    plus: ["Enorme Leistung und viel Drehmoment", "Umfangreiche Elektronik", "Hochwertiges Fahrwerk"],
    minus: ["Hoher Verbrauch und Reifenverschleiss", "Teure Inspektionen"],
    pruefen: [
      "Reifen und Kette: Starker Verschleiss deutet auf eine sportliche Fahrweise hin.",
      "Wheelie- und Sturzspuren an Heck, Kühler und Lenker.",
      "Servicebelege inklusive Ventilspielkontrolle.",
      "Software-Updates und Rückrufe beim KTM-Händler mit der Rahmennummer abfragen."
    ]
  },
  {
    id: "ktm-390-adventure", marke: "KTM", modell: "390 Adventure", von: 2020, bis: 2024, typ: "adventure",
    motor: "373 cm³, Einzylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "Kleine Reiseenduro, leicht und erstaunlich geländetauglich.",
    hinweis: "Ab 2025 gibt es die 390 Adventure mit neuem 399-cm³-Motor.",
    plus: ["Leicht, auch für kleinere Leute gut zu handhaben", "A2-tauglich ohne Drosselung", "Geländetauglicher als die meisten kleinen Reiseenduros"],
    minus: ["Der Einzylinder vibriert auf der Autobahn", "Wenig Reserven mit Gepäck und Sozius"],
    pruefen: [
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Kühlerlüfter bei warmem Motor testen.",
      "Kette und Ritzel.",
      "Servicebelege, vor allem Ventilspiel."
    ]
  },
  {
    id: "ktm-790-890-adventure", marke: "KTM", modell: "790 Adventure / 890 Adventure", von: 2019, bis: null, typ: "adventure",
    motor: "799 cm³ (790), 889 cm³ (890), Zweizylinder", a2: null,
    kurz: "Reiseenduro mit tief liegendem Tank und viel Geländetalent.",
    plus: ["Tiefer Schwerpunkt dank seitlich tief liegendem Tank", "Sehr geländetauglich, vor allem die R-Version", "Kräftiger, sparsamer Zweizylinder"],
    minus: ["Hohe Sitzhöhe bei der R-Version", "Die seitlichen Tankhälften sind bei Stürzen exponiert"],
    pruefen: [
      "Tank und Tankschutz auf Sturzspuren prüfen.",
      "Gelände-Spuren an Motorschutz, Felgen und Federelementen.",
      "Speichen antippen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "ktm-1290-super-adventure", marke: "KTM", modell: "1290 Super Adventure", von: 2015, bis: null, typ: "adventure",
    motor: "1301 cm³, V2", a2: false,
    kurz: "Grosse Reiseenduro mit sehr starkem V2 und viel Komfort-Elektronik.",
    hinweis: "Vorgänger war die 1190 Adventure (2013–2016).",
    plus: ["Sehr kräftiger Motor", "Viel Komfort und Elektronik", "Grosser Tank, grosse Reichweite"],
    minus: ["Schwer und hoch", "Teure Services und Ersatzteile"],
    pruefen: [
      "Elektronisches Fahrwerk (falls verbaut): alle Modi testen.",
      "Rückrufe und Software-Updates beim KTM-Händler abfragen.",
      "Gelände- und Sturzspuren.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "ktm-rc-390", marke: "KTM", modell: "RC 390", von: 2014, bis: null, typ: "supersport",
    motor: "373 cm³, Einzylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "Kleiner Sportler mit Einzylinder. Gut zum Lernen von Linie und Schräglage, auch auf Rennstrecken-Trainings beliebt.",
    plus: ["Leicht und agil", "A2-tauglich ohne Drosselung", "Gute Bremsen"],
    minus: ["Sportliche Sitzposition", "Der Einzylinder vibriert"],
    pruefen: [
      "Umfaller- und Sturzspuren an Verkleidung, Hebeln und Fussrasten.",
      "Kühlerlüfter und Elektrik testen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "ktm-690-smc-enduro", marke: "KTM", modell: "690 SMC R / 690 Enduro R", von: 2008, bis: null, typ: "enduro",
    motor: "690 cm³, Einzylinder", a2: null,
    kurz: "Kräftiger Einzylinder als Supermoto (SMC R) oder Enduro (Enduro R). Leicht und spartanisch.",
    plus: ["Sehr leicht für die Leistung", "Kräftiger Einzylinder", "Viel Fahrspass auf kurvigen Strassen"],
    minus: ["Wenig Komfort auf langen Strecken", "Kleiner Tank"],
    pruefen: [
      "Sprung- und Sturzspuren an Rahmen, Felgen und Lenker.",
      "Servicebelege: Wurden die kurzen Wartungsintervalle eingehalten?",
      "Kupplung und Getriebe bei der Probefahrt prüfen.",
      "Kühlerlüfter und Elektrik testen."
    ]
  },

  /* ---------- Yamaha ---------- */
  {
    id: "yamaha-mt-125", marke: "Yamaha", modell: "MT-125", von: 2014, bis: null, typ: "naked",
    motor: "125 cm³, Einzylinder", a2: true, a2text: "125er: auch mit Kategorie A1 fahrbar.",
    kurz: "Naked Bike für Kategorie A1, im Look der grossen MT-Modelle.",
    hinweis: "Ab 2020 mit variabler Ventilsteuerung.",
    plus: ["Hochwertige Verarbeitung für einen 125er", "Sparsam", "Gute Ausstattung"],
    minus: ["Wenig Leistung für Pässe und Autobahn", "Oft mit vielen Vorbesitzern"],
    pruefen: [
      "Umfaller-Spuren an Hebeln, Spiegeln und Blinkern.",
      "Ölwechsel nach Plan belegt?",
      "Tuning (Auspuff, Drosselung entfernt)? Alles muss zum Fahrzeugausweis passen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "yamaha-yzf-r125", marke: "Yamaha", modell: "YZF-R125", von: 2008, bis: null, typ: "supersport",
    motor: "125 cm³, Einzylinder", a2: true, a2text: "125er: auch mit Kategorie A1 fahrbar.",
    kurz: "Der Supersportler für Kategorie A1, im Design der R1 und R6.",
    plus: ["Sportliche Optik und Sitzposition", "Gutes Fahrwerk für die Klasse", "Sparsam"],
    minus: ["Wenig Leistung", "Sitzposition auf Dauer anstrengend"],
    pruefen: [
      "Umfaller-Spuren an Verkleidung, Hebeln und Fussrasten.",
      "Ölwechsel nach Plan belegt?",
      "Tuning? Alles muss zum Fahrzeugausweis passen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "yamaha-mt-03-r3", marke: "Yamaha", modell: "MT-03 / YZF-R3", von: 2015, bis: null, typ: "naked",
    motor: "321 cm³, Zweizylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "Leichte Zweizylinder für Einsteiger, als Naked Bike (MT-03) oder mit Verkleidung (R3).",
    plus: ["Ab Werk A2-tauglich", "Drehfreudiger, ruhiger Zweizylinder", "Leicht und günstig im Unterhalt"],
    minus: ["Wenig Druck bei tiefen Drehzahlen", "Einfaches Fahrwerk"],
    pruefen: [
      "Umfaller-Spuren an Hebeln, Spiegeln und Verkleidung.",
      "Bei der R3: Verkleidungshalter auf Risse prüfen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "yamaha-xsr700", marke: "Yamaha", modell: "XSR700", von: 2016, bis: null, typ: "retro",
    motor: "689 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Retro-Look mit der bewährten Technik der MT-07.",
    plus: ["Bewährter MT-07-Motor", "Leicht und handlich", "Viel Zubehör für Umbauten"],
    minus: ["Einfaches Fahrwerk", "Kaum Windschutz"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Umbauten an Auspuff, Heck und Blinkern: Papiere vorhanden?",
      "Krümmer auf Rost prüfen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "yamaha-xsr900", marke: "Yamaha", modell: "XSR900", von: 2016, bis: null, typ: "retro",
    motor: "847 cm³ (bis 2021), 890 cm³ (ab 2022), Dreizylinder", a2: false,
    kurz: "Retro-Optik mit dem kräftigen Dreizylinder der MT-09.",
    plus: ["Starker Dreizylinder", "Viel Elektronik für einen Retro-Töff", "Leicht"],
    minus: ["Frühe Jahrgänge mit sehr direkter Gasannahme, wie bei der MT-09", "Kleiner Tank"],
    pruefen: [
      "Probefahrt im Stadtverkehr: Gasannahme prüfen.",
      "Wheelie- und Sturzspuren.",
      "Umbauten mit Papieren?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "yamaha-tracer-7", marke: "Yamaha", modell: "Tracer 700 / Tracer 7", von: 2016, bis: null, typ: "tourer",
    motor: "689 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Der MT-07-Motor in einem bequemen Tourer. Sparsam und vernünftig.",
    plus: ["Sparsam und zuverlässig", "Bequeme Sitzposition mit Windschild", "Als A2-Version erhältlich"],
    minus: ["Einfaches Fahrwerk für Touren zu zweit", "Originalkoffer nicht immer dabei"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Hohe Kilometer: Servicebelege sind wichtiger als die Zahl.",
      "Koffer und Halter prüfen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "yamaha-tenere-700", marke: "Yamaha", modell: "Ténéré 700", von: 2019, bis: null, typ: "adventure",
    motor: "689 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Einfache, geländetaugliche Reiseenduro mit dem MT-07-Motor. Gebraucht sehr gefragt.",
    plus: ["Robuste, einfache Technik", "Sehr geländetauglich", "Sparsamer Zweizylinder"],
    minus: ["Hohe Sitzhöhe", "Wenig Komfort-Elektronik bei frühen Jahrgängen"],
    pruefen: [
      "Gelände-Spuren: Motorschutz, Felgen, Handprotektoren und Kühler.",
      "Speichen antippen.",
      "Zubehör wie Koffer, Sturzbügel oder grösserer Tank: eingetragen?",
      "Kette, Ritzel und Radlager."
    ]
  },
  {
    id: "yamaha-mt-10", marke: "Yamaha", modell: "MT-10", von: 2016, bis: null, typ: "naked",
    motor: "998 cm³, Vierzylinder (Crossplane)", a2: false,
    kurz: "Naked Bike mit dem Motor der R1 und dem typischen Crossplane-Klang.",
    plus: ["Sehr kräftiger, charakterstarker Vierzylinder", "Hochwertiges Fahrwerk", "Viel Elektronik"],
    minus: ["Hoher Verbrauch", "Wenig Windschutz"],
    pruefen: [
      "Wheelie- und Sturzspuren.",
      "Elektronik: Fahrmodi und Traktionskontrolle testen.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "yamaha-yzf-r1", marke: "Yamaha", modell: "YZF-R1", von: 1998, bis: null, typ: "supersport",
    motor: "998 cm³, Vierzylinder", a2: false,
    kurz: "Yamahas Superbike. Viele Generationen, alle mit sehr viel Leistung.",
    hinweis: "Seit 2009 mit Crossplane-Kurbelwelle, seit 2015 mit umfangreicher Elektronik.",
    plus: ["Sehr starker Vierzylinder", "Präzises Fahrwerk", "Grosse Szene und viele Teile"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Teure Verschleissteile"],
    pruefen: [
      "Rennstrecken- und Sturzspuren genau prüfen.",
      "Kupplung und Getriebe bei der Probefahrt prüfen.",
      "Umbauten an Auspuff und Steuergerät: Papiere?",
      "Servicebelege, vor allem Ventilspiel."
    ]
  },
  {
    id: "yamaha-yzf-r6", marke: "Yamaha", modell: "YZF-R6", von: 1999, bis: 2020, typ: "supersport",
    motor: "599 cm³, Vierzylinder", a2: false,
    kurz: "Sehr drehfreudiger 600er-Supersportler, beliebt auf der Rennstrecke.",
    hinweis: "Ab 2021 gibt es die R6 nur noch als Rennversion ohne Strassenzulassung.",
    plus: ["Sehr drehfreudiger Motor", "Präzises Fahrwerk", "Gute Ersatzteilversorgung"],
    minus: ["Wenig Druck bei tiefen Drehzahlen", "Viele Exemplare mit Rennstrecken-Vergangenheit"],
    pruefen: [
      "Rennstrecken- und Sturzspuren genau prüfen.",
      "Kaltstart: Rasseln aus dem Motor kann auf Steuerkette oder Spanner hindeuten.",
      "Ladespannung messen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "yamaha-fz6", marke: "Yamaha", modell: "FZ6 / FZ6 Fazer", von: 2004, bis: 2010, typ: "naked",
    motor: "600 cm³, Vierzylinder", a2: null,
    kurz: "Alltagstauglicher Vierzylinder mit einem Motor, der von der R6 abstammt. Die Fazer hat eine Halbverkleidung.",
    plus: ["Drehfreudiger, robuster Vierzylinder", "Weit verbreitet, viele Teile", "Fazer mit gutem Windschutz"],
    minus: ["Wenig Druck bei tiefen Drehzahlen", "Einfaches Fahrwerk"],
    pruefen: [
      "Alter: Gummiteile, Schläuche und Bremsleitungen prüfen.",
      "Rost an Krümmer, Rahmen und Schrauben.",
      "Ladespannung messen.",
      "Kaltstart und Leerlauf."
    ]
  },
  {
    id: "yamaha-xmax", marke: "Yamaha", modell: "XMAX 125 / XMAX 300", von: 2017, bis: null, typ: "roller",
    motor: "125 oder 292 cm³, Einzylinder", a2: true, a2text: "Die 125er ist mit Kategorie A1 fahrbar, die 300er mit A beschränkt.",
    kurz: "Bequemer Roller mit grossem Staufach. Die 300er ist auch autobahntauglich.",
    hinweis: "Die XMAX 125 gibt es schon länger, die XMAX 300 seit 2017.",
    plus: ["Bequem, auch zu zweit", "Grosses Staufach unter der Sitzbank", "Sparsam"],
    minus: ["Verschleissteile der Variomatik", "Viele Exemplare mit Winterbetrieb"],
    pruefen: [
      "Variomatik-Riemen und Rollen: Wann zuletzt gewechselt?",
      "Ruckeln beim Anfahren?",
      "Rost bei Winterbetrieb.",
      "Alle Schlüssel und, je nach Jahrgang, das Smart-Key-System testen."
    ]
  },
  {
    id: "yamaha-fjr1300", marke: "Yamaha", modell: "FJR1300", von: 2001, bis: 2021, typ: "tourer",
    motor: "1298 cm³, Vierzylinder, Kardan", a2: false,
    kurz: "Sporttourer für lange Strecken, bekannt für hohe Laufleistungen.",
    plus: ["Kardanantrieb", "Bequem und schnell auf langen Strecken", "Gilt als langlebig"],
    minus: ["Schwer im Stand und beim Rangieren", "Viel Elektronik bei neueren Jahrgängen"],
    pruefen: [
      "Kardan: Spiel und Öl am Hinterachsgetriebe prüfen.",
      "Elektrisches Windschild testen.",
      "Koffer und Halter prüfen.",
      "Hohe Kilometer sind normal, Servicebelege zählen."
    ]
  },

  /* ---------- Honda ---------- */
  {
    id: "honda-cb125r", marke: "Honda", modell: "CB125R", von: 2018, bis: null, typ: "naked",
    motor: "125 cm³, Einzylinder", a2: true, a2text: "125er: auch mit Kategorie A1 fahrbar.",
    kurz: "Hochwertiger 125er im Neo-Sports-Café-Look der grossen CB-Modelle.",
    plus: ["Gute Verarbeitung", "Upside-down-Gabel und gute Bremsen", "Sparsam"],
    minus: ["Wenig Leistung", "Kleiner Tank"],
    pruefen: [
      "Umfaller-Spuren an Hebeln, Spiegeln und Blinkern.",
      "Ölwechsel nach Plan belegt?",
      "Tuning? Alles muss zum Fahrzeugausweis passen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "honda-pcx125", marke: "Honda", modell: "PCX125", von: 2010, bis: null, typ: "roller",
    motor: "125 cm³, Einzylinder", a2: true, a2text: "125er: auch mit Kategorie A1 fahrbar.",
    kurz: "Kompakter 125er-Roller, sehr sparsam und in der Stadt sehr verbreitet.",
    plus: ["Sehr tiefer Verbrauch", "Start-Stopp-Automatik", "Zuverlässig"],
    minus: ["Weniger Stauraum als grössere Roller", "Für die Autobahn zu schwach"],
    pruefen: [
      "Start-Stopp-Funktion testen.",
      "Variomatik-Riemen: Wann zuletzt gewechselt?",
      "Rost bei Winterbetrieb.",
      "Ölwechsel nach Plan belegt?"
    ]
  },
  {
    id: "honda-forza", marke: "Honda", modell: "Forza 125 / 300 / 350", von: 2013, bis: null, typ: "roller",
    motor: "125, 279 oder 330 cm³, Einzylinder", a2: true, a2text: "Die 125er ist mit Kategorie A1 fahrbar, die 300 und 350 mit A beschränkt.",
    kurz: "Bequemer Roller mit guter Ausstattung. Die grossen Versionen sind autobahntauglich.",
    hinweis: "Forza 300 von 2013 bis 2020, Forza 350 ab 2021, Forza 125 ab 2015.",
    plus: ["Bequem und gut ausgestattet", "Grosses Staufach", "Sparsam"],
    minus: ["Verschleissteile der Variomatik", "Viele Exemplare mit Winterbetrieb"],
    pruefen: [
      "Variomatik-Riemen und Rollen: Wann zuletzt gewechselt?",
      "Elektrisch verstellbares Windschild (je nach Jahrgang) testen.",
      "Rost bei Winterbetrieb.",
      "Smart Key und alle Schlüssel testen."
    ]
  },
  {
    id: "honda-cb1000r", marke: "Honda", modell: "CB1000R", von: 2008, bis: null, typ: "naked",
    motor: "998 cm³, Vierzylinder", a2: false,
    kurz: "Hochwertiges Naked Bike mit Einarmschwinge und kräftigem Vierzylinder.",
    hinweis: "2018 komplett neu, mit stärkerem Motor und moderner Elektronik.",
    plus: ["Kräftiger, ruhig laufender Vierzylinder", "Hochwertige Verarbeitung", "Einarmschwinge"],
    minus: ["Wenig Windschutz", "Sozius sitzt unbequem"],
    pruefen: [
      "Sturz- und Wheelie-Spuren.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "honda-cbr1000rr-fireblade", marke: "Honda", modell: "CBR1000RR Fireblade", von: 2004, bis: null, typ: "supersport",
    motor: "rund 1000 cm³, Vierzylinder", a2: false,
    kurz: "Hondas Superbike. Gilt als besonders ausgewogen für einen Supersportler.",
    hinweis: "Generationen: SC57 (2004–2007), SC59 (2008–2016), SC77 (2017–2019), Fireblade-R ab 2020.",
    plus: ["Sehr starker, zuverlässiger Motor", "Ausgewogenes Fahrwerk", "Gute Teileversorgung"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Teure Verschleissteile"],
    pruefen: [
      "Rennstrecken- und Sturzspuren.",
      "Regler und Gleichrichter: Ladespannung messen, vor allem bei älteren Generationen.",
      "Umbauten an Auspuff, Steuergerät oder Quickshifter: Papiere?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "honda-cbr600rr-pc40", marke: "Honda", modell: "CBR600RR (PC40)", von: 2007, bis: 2016, typ: "supersport",
    motor: "599 cm³, Vierzylinder", a2: false,
    kurz: "Nachfolger der PC37, leichter und kompakter. Ab 2009 auch mit Kombi-ABS.",
    hinweis: "Seit 2024 gibt es die CBR600RR wieder neu.",
    plus: ["Leicht und präzise", "Drehfreudiger Motor", "Mit Kombi-ABS (C-ABS) erhältlich"],
    minus: ["Harte, sportliche Sitzposition", "Viele Exemplare mit Rennstrecken-Vergangenheit"],
    pruefen: [
      "Regler und Gleichrichter: Ladespannung messen.",
      "Rennstrecken- und Sturzspuren.",
      "Kaltstart anhören: Rasseln kann auf Steuerkette oder Spanner hindeuten.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "honda-cb600f-hornet", marke: "Honda", modell: "CB600F Hornet", von: 1998, bis: 2013, typ: "naked",
    motor: "599 cm³, Vierzylinder", a2: null,
    kurz: "Klassisches 600er-Naked-Bike. Drehfreudig und weit verbreitet.",
    hinweis: "Ab 2007 mit einem Motor, der von der CBR600RR abstammt.",
    plus: ["Drehfreudiger, robuster Motor", "Weit verbreitet, viele Teile", "Handlich"],
    minus: ["Wenig Druck bei tiefen Drehzahlen", "Ältere Jahrgänge ohne ABS"],
    pruefen: [
      "Regler und Gleichrichter: Ladespannung messen.",
      "Alter: Gummiteile, Bremsleitungen und Reifen.",
      "Rost an Krümmer und Rahmen.",
      "Kaltstart und Leerlauf."
    ]
  },
  {
    id: "honda-cb750-hornet", marke: "Honda", modell: "CB750 Hornet", von: 2023, bis: null, typ: "naked",
    motor: "755 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Die neue Hornet mit Zweizylinder: leicht, kräftig und alltagstauglich.",
    plus: ["Kräftiger, sparsamer Zweizylinder", "Leicht", "Moderne Elektronik"],
    minus: ["Einfaches Fahrwerk", "Wenig Windschutz"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Wheelie- und Sturzspuren.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "honda-xl750-transalp", marke: "Honda", modell: "XL750 Transalp", von: 2023, bis: null, typ: "adventure",
    motor: "755 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Leichte Reiseenduro mit dem Motor der CB750 Hornet.",
    hinweis: "Die alte Transalp (XL600V bis XL700V) wurde bis 2012 gebaut.",
    plus: ["Leicht für eine Reiseenduro", "Geländetauglich mit 21-Zoll-Vorderrad", "Sparsam"],
    minus: ["Fahrwerk im Gelände schnell am Limit", "Junges Modell, noch wenige Gebrauchte"],
    pruefen: [
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Speichen antippen.",
      "Drosselung im Fahrzeugausweis prüfen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "honda-rebel-500", marke: "Honda", modell: "CMX500 Rebel", von: 2017, bis: null, typ: "cruiser",
    motor: "471 cm³, Zweizylinder", a2: true, a2text: "Ab Werk A2-tauglich.",
    kurz: "Leichter Cruiser mit tiefer Sitzhöhe, beliebt bei Einsteigerinnen und Einsteigern.",
    plus: ["Sehr tiefe Sitzhöhe", "Ab Werk A2-tauglich", "Leicht für einen Cruiser"],
    minus: ["Wenig Komfort auf langen Strecken", "Kleiner Tank"],
    pruefen: [
      "Umfaller-Spuren an Hebeln, Spiegeln und Auspuff.",
      "Umbauten (Auspuff, Lenker, Sitz): Papiere?",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "honda-rebel-1100", marke: "Honda", modell: "CMX1100 Rebel", von: 2021, bis: null, typ: "cruiser",
    motor: "1084 cm³, Zweizylinder", a2: false,
    kurz: "Cruiser mit dem Motor der Africa Twin, auch mit DCT-Automatik erhältlich.",
    plus: ["Kräftiger Motor", "Auch mit DCT-Automatik", "Tiefe Sitzhöhe"],
    minus: ["Wenig Schräglagenfreiheit", "Kleiner Tank"],
    pruefen: [
      "Bei DCT: Service mit allen vorgesehenen Filtern belegt?",
      "Umbauten mit Papieren?",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },

  /* ---------- Kawasaki ---------- */
  {
    id: "kawasaki-er-6n-er-6f", marke: "Kawasaki", modell: "ER-6n / ER-6f", von: 2006, bis: 2016, typ: "naked",
    motor: "649 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version weit verbreitet.",
    kurz: "Einer der klassischen A2-Töffs. Robust, sparsam und günstig.",
    hinweis: "Nachfolger sind Z650 und Ninja 650 (ab 2017).",
    plus: ["Robuster Zweizylinder", "Günstig im Unterhalt", "ER-6f mit Verkleidung für längere Strecken"],
    minus: ["Einfaches Fahrwerk", "Ältere Jahrgänge ohne ABS"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Fahrschul-Spuren: Umfaller an Hebeln, Spiegeln und Blinkern.",
      "Rost an Krümmer und Schrauben.",
      "Kette, Ritzel und Lenkkopflager."
    ]
  },
  {
    id: "kawasaki-ninja-400-z400", marke: "Kawasaki", modell: "Ninja 400 / Z400", von: 2018, bis: 2023, typ: "naked",
    motor: "399 cm³, Zweizylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "Leichte Einsteiger-Zweizylinder, mit Verkleidung (Ninja) oder ohne (Z).",
    hinweis: "Seit 2024 heissen die Nachfolger Ninja 500 und Z500.",
    plus: ["Leicht und agil", "A2-tauglich ohne Drosselung", "Drehfreudiger Zweizylinder"],
    minus: ["Wenig Druck bei tiefen Drehzahlen", "Einfaches Fahrwerk"],
    pruefen: [
      "Umfaller-Spuren an Verkleidung, Hebeln und Fussrasten.",
      "Bei der Ninja: Verkleidungshalter auf Risse prüfen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "kawasaki-versys-650", marke: "Kawasaki", modell: "Versys 650", von: 2007, bis: null, typ: "tourer",
    motor: "649 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Vernünftiger Allrounder mit aufrechter Sitzposition.",
    plus: ["Bequem und alltagstauglich", "Sparsamer, robuster Motor", "Gute Reichweite"],
    minus: ["Einfaches Fahrwerk", "Optik und Klang eher nüchtern"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Koffer und Halter prüfen.",
      "Kette, Ritzel und Radlager.",
      "Servicebelege."
    ]
  },
  {
    id: "kawasaki-versys-1000", marke: "Kawasaki", modell: "Versys 1000", von: 2012, bis: null, typ: "tourer",
    motor: "1043 cm³, Vierzylinder", a2: false,
    kurz: "Grosser Tourer mit ruhigem Vierzylinder, bequem auch zu zweit.",
    plus: ["Kräftiger, ruhiger Vierzylinder", "Bequem, auch zu zweit", "Grosse Reichweite"],
    minus: ["Schwer", "Höherer Verbrauch"],
    pruefen: [
      "Koffer und Halter prüfen.",
      "Elektronisches Fahrwerk (je nach Version) testen.",
      "Kette, Ritzel und Radlager.",
      "Servicebelege."
    ]
  },
  {
    id: "kawasaki-ninja-zx-6r", marke: "Kawasaki", modell: "Ninja ZX-6R", von: 1995, bis: null, typ: "supersport",
    motor: "599 oder 636 cm³, Vierzylinder", a2: false,
    kurz: "600er-Supersportler, je nach Jahrgang mit etwas mehr Hubraum als die Konkurrenz.",
    hinweis: "Die 636er gab es 2003–2006 und wieder ab 2013, dazwischen 599 cm³.",
    plus: ["Mit 636 cm³ mehr Druck als die meisten 600er", "Präzises Fahrwerk", "Grosse Szene"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Sportliche Sitzposition"],
    pruefen: [
      "Rennstrecken- und Sturzspuren.",
      "Ladespannung messen.",
      "Kupplung und Getriebe bei der Probefahrt prüfen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "kawasaki-ninja-zx-10r", marke: "Kawasaki", modell: "Ninja ZX-10R", von: 2004, bis: null, typ: "supersport",
    motor: "998 cm³, Vierzylinder", a2: false,
    kurz: "Kawasakis Superbike, in der Superbike-WM sehr erfolgreich.",
    plus: ["Sehr starker Motor", "Viel Renntechnik", "Gute Elektronik bei neueren Jahrgängen"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Teure Verschleissteile"],
    pruefen: [
      "Rennstrecken- und Sturzspuren.",
      "Umbauten an Auspuff und Steuergerät: Papiere?",
      "Kupplung und Getriebe bei der Probefahrt prüfen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "kawasaki-z1000", marke: "Kawasaki", modell: "Z1000", von: 2003, bis: 2020, typ: "naked",
    motor: "953 cm³ (bis 2006), 1043 cm³ (ab 2007), Vierzylinder", a2: false,
    kurz: "Kräftiges Naked Bike mit markanter Optik.",
    plus: ["Kräftiger Vierzylinder", "Markante Optik", "Weit verbreitet"],
    minus: ["Wenig Windschutz", "Höherer Verbrauch"],
    pruefen: [
      "Wheelie- und Sturzspuren.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "kawasaki-ninja-1000sx", marke: "Kawasaki", modell: "Z1000SX / Ninja 1000SX", von: 2011, bis: null, typ: "tourer",
    motor: "1043 cm³, Vierzylinder", a2: false,
    kurz: "Sporttourer mit kräftigem Vierzylinder. Mit Koffern auch reisetauglich.",
    hinweis: "Ab 2020 heisst sie Ninja 1000SX.",
    plus: ["Kräftiger Motor mit Sporttourer-Komfort", "Mit Koffern reisetauglich", "Zuverlässig"],
    minus: ["Schwer", "Originalkoffer nicht immer dabei"],
    pruefen: [
      "Koffer und Halter prüfen.",
      "Kette, Ritzel und Radlager.",
      "Ladespannung messen.",
      "Servicebelege."
    ]
  },
  {
    id: "kawasaki-vulcan-s", marke: "Kawasaki", modell: "Vulcan S", von: 2015, bis: null, typ: "cruiser",
    motor: "649 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Leichter Cruiser mit dem bewährten Zweizylinder der ER-6 und Ninja 650.",
    plus: ["Tiefe Sitzhöhe", "Sitz und Fussrasten anpassbar", "Bewährter Motor"],
    minus: ["Wenig Schräglagenfreiheit", "Einfaches Fahrwerk"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Umfaller-Spuren an Hebeln, Spiegeln und Auspuff.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "kawasaki-z900rs", marke: "Kawasaki", modell: "Z900RS", von: 2018, bis: null, typ: "retro",
    motor: "948 cm³, Vierzylinder", a2: false,
    kurz: "Klassische Optik im Stil der alten Z1 mit moderner Technik der Z900.",
    plus: ["Klassische Optik mit moderner Technik", "Kräftiger, ruhiger Vierzylinder", "Gute Verarbeitung"],
    minus: ["Schwerer, als sie aussieht", "Wenig Windschutz (ausser Café-Version)"],
    pruefen: [
      "Umbauten an Auspuff und Heck: Papiere?",
      "Sturzspuren an Tank und Lenker.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },

  /* ---------- Suzuki ---------- */
  {
    id: "suzuki-gsx-r600", marke: "Suzuki", modell: "GSX-R600", von: 1997, bis: 2018, typ: "supersport",
    motor: "599 cm³, Vierzylinder", a2: false,
    kurz: "Klassischer Suzuki-Supersportler der 600er-Klasse.",
    hinweis: "In Europa seit einigen Jahren nicht mehr neu erhältlich.",
    plus: ["Drehfreudiger, kräftiger Motor", "Viele Teile verfügbar", "Grosse Szene"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Sportliche Sitzposition"],
    pruefen: [
      "Lichtmaschine und Regler: Ladespannung messen. Bei Suzukis dieser Zeit ein bekanntes Thema.",
      "Rennstrecken- und Sturzspuren.",
      "Kupplung bei der Probefahrt prüfen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "suzuki-gsx-r750", marke: "Suzuki", modell: "GSX-R750", von: 1985, bis: 2018, typ: "supersport",
    motor: "750 cm³, Vierzylinder", a2: false,
    kurz: "Klassischer Suzuki-Supersportler. Die 750 ist eine seltene Mittelklasse zwischen 600 und 1000.",
    hinweis: "In Europa seit einigen Jahren nicht mehr neu erhältlich. Zwischen den frühen und den letzten Jahrgängen liegen über 30 Jahre, vergleiche deshalb nur ähnliche Jahrgänge.",
    plus: ["Drehfreudiger, kräftiger Motor", "Viele Teile verfügbar", "Grosse Szene"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Sportliche Sitzposition"],
    pruefen: [
      "Lichtmaschine und Regler: Ladespannung messen. Bei Suzukis dieser Zeit ein bekanntes Thema.",
      "Rennstrecken- und Sturzspuren.",
      "Kupplung bei der Probefahrt prüfen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "suzuki-gsx-r1000", marke: "Suzuki", modell: "GSX-R1000", von: 2001, bis: null, typ: "supersport",
    motor: "rund 1000 cm³, Vierzylinder", a2: false,
    kurz: "Suzukis Superbike. Gerade die Modelle K5 bis K8 sind sehr gesucht.",
    plus: ["Sehr starker Motor", "Gilt als robust", "Viele Teile verfügbar"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Ältere Jahrgänge ohne ABS"],
    pruefen: [
      "Lichtmaschine und Regler: Ladespannung messen.",
      "Rennstrecken- und Sturzspuren.",
      "Umbauten an Auspuff und Steuergerät: Papiere?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "suzuki-hayabusa", marke: "Suzuki", modell: "Hayabusa (GSX1300R)", von: 1999, bis: null, typ: "supersport",
    motor: "1299 cm³ (bis 2007), 1340 cm³ (ab 2008), Vierzylinder", a2: false,
    kurz: "Legendärer Hochgeschwindigkeits-Töff. Enorm stark, aber erstaunlich gutmütig.",
    plus: ["Enorme Leistung, trotzdem gutmütig", "Bequemer als ein Supersportler", "Gilt als langlebig"],
    minus: ["Schwer", "Viele Umbauten auf dem Markt"],
    pruefen: [
      "Umbauten wie Schwingenverlängerung, Tieferlegung oder Auspuff brauchen Papiere.",
      "Reifen und Kette: Starker Verschleiss?",
      "Ladespannung messen.",
      "Servicebelege."
    ]
  },
  {
    id: "suzuki-gsx-s750", marke: "Suzuki", modell: "GSX-S750", von: 2015, bis: 2021, typ: "naked",
    motor: "749 cm³, Vierzylinder", a2: null,
    kurz: "Naked Bike mit einem Vierzylinder, der von der GSX-R750 abstammt.",
    plus: ["Kräftiger, drehfreudiger Vierzylinder", "Weit verbreitet", "Bequemer als ein Supersportler"],
    minus: ["Einfaches Fahrwerk", "Wenig Windschutz"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Sturzspuren.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "suzuki-gsx-s1000", marke: "Suzuki", modell: "GSX-S1000 / S1000F / S1000GT", von: 2015, bis: null, typ: "naked",
    motor: "999 cm³, Vierzylinder", a2: false,
    kurz: "Naked Bike oder Sporttourer mit einem Motor, der von der GSX-R1000 abstammt.",
    plus: ["Sehr kräftiger Motor", "Viel Töff fürs Geld", "Als F oder GT mit Verkleidung"],
    minus: ["Abrupte Gasannahme bei frühen Jahrgängen", "Wenig Windschutz beim Naked Bike"],
    pruefen: [
      "Probefahrt: Gasannahme bei tiefen Drehzahlen prüfen.",
      "Wheelie- und Sturzspuren.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "suzuki-v-strom-1000-1050", marke: "Suzuki", modell: "V-Strom 1000 / 1050", von: 2002, bis: null, typ: "adventure",
    motor: "996 cm³ (bis 2012), 1037 cm³ (ab 2014), V2", a2: false,
    kurz: "Grosse, zuverlässige Reiseenduro für die Strasse.",
    hinweis: "Ab 2020 heisst sie V-Strom 1050.",
    plus: ["Kräftiger, zuverlässiger V2", "Bequem, gute Reichweite", "Viel Zubehör"],
    minus: ["Schwer", "Eher für die Strasse als fürs Gelände"],
    pruefen: [
      "Hohe Kilometer sind normal, Servicebelege zählen.",
      "Koffer und Halter auf Risse prüfen.",
      "Ladespannung messen.",
      "Kette, Ritzel und Radlager."
    ]
  },
  {
    id: "suzuki-v-strom-800de", marke: "Suzuki", modell: "V-Strom 800DE", von: 2023, bis: null, typ: "adventure",
    motor: "776 cm³, Zweizylinder", a2: null,
    kurz: "Geländetaugliche Reiseenduro mit neuem Zweizylinder.",
    plus: ["Geländetauglich mit 21-Zoll-Vorderrad", "Ruhiger Zweizylinder", "Moderne Elektronik"],
    minus: ["Hohe Sitzhöhe", "Junges Modell, noch wenige Gebrauchte"],
    pruefen: [
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Speichen antippen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "suzuki-gsx-8s", marke: "Suzuki", modell: "GSX-8S", von: 2023, bis: null, typ: "naked",
    motor: "776 cm³, Zweizylinder", a2: null,
    kurz: "Modernes Naked Bike mit kräftigem, ruhig laufendem Zweizylinder.",
    plus: ["Kräftiger Zweizylinder mit Ausgleichswellen", "Moderne Elektronik", "Handlich"],
    minus: ["Einfaches Fahrwerk", "Junges Modell, noch wenige Gebrauchte"],
    pruefen: [
      "Wheelie- und Sturzspuren.",
      "Drosselung im Fahrzeugausweis prüfen, falls angegeben.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "suzuki-bandit", marke: "Suzuki", modell: "Bandit 650 / 1250", von: 2005, bis: 2016, typ: "naked",
    motor: "656 cm³ (650), 1255 cm³ (1250), Vierzylinder", a2: null,
    kurz: "Robuste Alltagstöffs, als Naked Bike oder als S mit Halbverkleidung.",
    plus: ["Robuste, einfache Technik", "Bequem und alltagstauglich", "Weit verbreitet"],
    minus: ["Schwer", "Einfaches Fahrwerk"],
    pruefen: [
      "Rost an Krümmer, Rahmen und Schrauben.",
      "Ladespannung messen.",
      "Kette, Ritzel und Lenkkopflager.",
      "Servicebelege."
    ]
  },
  {
    id: "suzuki-burgman-400", marke: "Suzuki", modell: "Burgman 400", von: 1998, bis: null, typ: "roller",
    motor: "rund 400 cm³, Einzylinder", a2: true, a2text: "Mit Kategorie A beschränkt fahrbar.",
    kurz: "Grosser, bequemer Roller, auch für Autobahn und zu zweit.",
    plus: ["Bequem, auch zu zweit", "Grosses Staufach", "Autobahntauglich"],
    minus: ["Schwer", "Verschleissteile der Variomatik"],
    pruefen: [
      "Variomatik-Riemen und Rollen: Wann zuletzt gewechselt?",
      "Ruckeln beim Anfahren?",
      "Rost bei Winterbetrieb.",
      "Alle Schlüssel testen."
    ]
  },

  /* ---------- Triumph ---------- */
  {
    id: "triumph-trident-660", marke: "Triumph", modell: "Trident 660", von: 2021, bis: null, typ: "naked",
    motor: "660 cm³, Dreizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Einsteiger-Naked-Bike mit drehfreudigem Dreizylinder.",
    plus: ["Drehfreudiger Dreizylinder", "Leicht und einfach zu fahren", "Als A2-Version erhältlich"],
    minus: ["Einfaches Fahrwerk", "Wenig Windschutz"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Umfaller-Spuren.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "triumph-tiger-sport-660", marke: "Triumph", modell: "Tiger Sport 660", von: 2022, bis: null, typ: "tourer",
    motor: "660 cm³, Dreizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Der Motor der Trident 660 in einem bequemen Tourer mit Windschild.",
    plus: ["Bequem, mit Windschild", "Drehfreudiger Dreizylinder", "Als A2-Version erhältlich"],
    minus: ["Einfaches Fahrwerk", "Junges Modell, noch wenige Gebrauchte"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Koffer und Halter prüfen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "triumph-tiger-800-900", marke: "Triumph", modell: "Tiger 800 / Tiger 900", von: 2011, bis: null, typ: "adventure",
    motor: "799 cm³ (bis 2019), 888 cm³ (ab 2020), Dreizylinder", a2: null,
    kurz: "Reiseenduro mit charakterstarkem Dreizylinder, als Strassen- oder Geländeversion.",
    plus: ["Charakterstarker Dreizylinder", "Als Strassenversion (XR, GT) oder Geländeversion (XC, Rally)", "Viel Zubehör"],
    minus: ["Service und Teile teurer als bei den Japanern", "Hohe Sitzhöhe bei den Geländeversionen"],
    pruefen: [
      "Regler und Ladespannung prüfen.",
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Speichen antippen (Geländeversionen).",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "triumph-tiger-1200", marke: "Triumph", modell: "Tiger Explorer / Tiger 1200", von: 2012, bis: null, typ: "adventure",
    motor: "1215 cm³ (Explorer), 1160 cm³ (ab 2022), Dreizylinder, Kardan", a2: false,
    kurz: "Grosse Reiseenduro mit kräftigem Dreizylinder und Kardanantrieb.",
    plus: ["Kardanantrieb", "Kräftiger Dreizylinder", "Viel Komfort"],
    minus: ["Schwer", "Viel Elektronik, teure Reparaturen"],
    pruefen: [
      "Kardan: Spiel und Öl am Hinterachsgetriebe prüfen.",
      "Elektronisches Fahrwerk (falls verbaut) testen.",
      "Rückrufe beim Triumph-Händler abfragen.",
      "Servicebelege."
    ]
  },
  {
    id: "triumph-speed-triple", marke: "Triumph", modell: "Speed Triple", von: 1994, bis: null, typ: "naked",
    motor: "885 bis 1160 cm³, Dreizylinder", a2: false,
    kurz: "Eines der ersten grossen Naked Bikes und bis heute Triumphs Aushängeschild.",
    hinweis: "Grob: 955 cm³ bis 2004, 1050 cm³ von 2005 bis 2020, 1160 cm³ ab 2021.",
    plus: ["Kräftiger Dreizylinder mit typischem Klang", "Ikone unter den Naked Bikes", "Gutes Fahrwerk"],
    minus: ["Ältere Modelle mit wenig Elektronik", "Service und Teile teurer als bei den Japanern"],
    pruefen: [
      "Regler und Ladespannung, vor allem bei älteren Jahrgängen.",
      "Wheelie- und Sturzspuren.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "triumph-bonneville", marke: "Triumph", modell: "Bonneville T100 / T120", von: 2001, bis: null, typ: "retro",
    motor: "865 cm³ luftgekühlt (bis 2015), 900 oder 1200 cm³ wassergekühlt (ab 2016), Zweizylinder", a2: null,
    kurz: "Der britische Klassiker, modern gebaut und trotzdem im alten Stil.",
    plus: ["Klassische Optik", "Gutmütiger Zweizylinder", "Riesiges Zubehörangebot"],
    minus: ["Schwer", "Einfaches Fahrwerk"],
    pruefen: [
      "Umbauten an Auspuff, Lenker und Sitz: Papiere?",
      "Speichen antippen.",
      "Chrom und Lack auf Rost prüfen.",
      "Servicebelege."
    ]
  },
  {
    id: "triumph-speed-twin-900", marke: "Triumph", modell: "Street Twin / Speed Twin 900", von: 2016, bis: null, typ: "retro",
    motor: "900 cm³, Zweizylinder", a2: null,
    kurz: "Leichter, einfacher Retro-Töff, beliebt als Einstieg in die Bonneville-Familie.",
    hinweis: "Die Street Twin heisst seit 2023 Speed Twin 900.",
    plus: ["Leicht und einfach zu fahren", "Tiefe Sitzhöhe", "Viel Zubehör"],
    minus: ["Wenig Leistung für einen 900er", "Kleiner Tank"],
    pruefen: [
      "Umbauten mit Papieren?",
      "Umfaller-Spuren.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "triumph-scrambler-1200", marke: "Triumph", modell: "Scrambler 1200", von: 2019, bis: null, typ: "retro",
    motor: "1200 cm³, Zweizylinder", a2: false,
    kurz: "Scrambler mit langen Federwegen, der auch im Gelände etwas kann.",
    plus: ["Geländetaugliches Fahrwerk mit langen Federwegen", "Kräftiger Zweizylinder", "Hochwertige Verarbeitung"],
    minus: ["Hohe Sitzhöhe", "Schwer"],
    pruefen: [
      "Gelände-Spuren an Unterseite und Felgen.",
      "Speichen antippen.",
      "Umbauten mit Papieren?",
      "Servicebelege."
    ]
  },
  {
    id: "triumph-daytona-675", marke: "Triumph", modell: "Daytona 675", von: 2006, bis: 2017, typ: "supersport",
    motor: "675 cm³, Dreizylinder", a2: false,
    kurz: "Supersportler mit Dreizylinder: mehr Druck als die 600er-Vierzylinder.",
    plus: ["Dreizylinder mit viel Druck", "Präzises Fahrwerk", "Charakterstarker Klang"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Service teurer als bei den Japanern"],
    pruefen: [
      "Regler und Gleichrichter: Ladespannung messen und Stecker auf Hitzespuren prüfen.",
      "Rennstrecken- und Sturzspuren.",
      "Kühlerlüfter bei warmem Motor testen.",
      "Servicebelege inklusive Ventilspiel."
    ]
  },

  /* ---------- BMW ---------- */
  {
    id: "bmw-g-310-r-gs", marke: "BMW", modell: "G 310 R / G 310 GS", von: 2016, bis: null, typ: "naked",
    motor: "313 cm³, Einzylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "BMWs Einstiegsmodelle: R als Naked Bike, GS als kleine Reiseenduro.",
    plus: ["Leicht", "A2-tauglich ab Werk", "GS mit aufrechter Sitzposition und mehr Federweg"],
    minus: ["Wenig Leistung mit Gepäck", "Der Einzylinder vibriert"],
    pruefen: [
      "Umfaller-Spuren.",
      "Rückrufe beim BMW-Händler mit der Rahmennummer abfragen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "bmw-f-800-gs", marke: "BMW", modell: "F 800 GS", von: 2008, bis: 2018, typ: "adventure",
    motor: "798 cm³, Zweizylinder", a2: null,
    kurz: "Mittelgrosse Reiseenduro, geländetauglicher als die grosse GS.",
    hinweis: "Die F 650 GS (Zweizylinder, 2008–2012) und die F 700 GS (2013–2018) haben den gleichen Motor mit weniger Leistung.",
    plus: ["Geländetauglich mit 21-Zoll-Vorderrad", "Sparsam", "Grosses Zubehörangebot"],
    minus: ["Hohe Sitzhöhe", "Teure Ersatzteile"],
    pruefen: [
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Speichen antippen.",
      "Rückrufe beim BMW-Händler abfragen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "bmw-f-750-850-gs", marke: "BMW", modell: "F 750 GS / F 850 GS", von: 2018, bis: 2023, typ: "adventure",
    motor: "853 cm³, Zweizylinder", a2: true, a2text: "Die F 750 GS gibt es als 35-kW-Version. Fahrzeugausweis prüfen.",
    kurz: "Nachfolger der F 800 GS, mit neuem Motor und Tank vorne.",
    plus: ["Kräftiger, ruhiger Zweizylinder", "F 850 GS geländetauglich, F 750 GS tiefer und strassenorientiert", "Viel Komfort-Elektronik"],
    minus: ["Teure Optionen und Ersatzteile", "Schwerer als die F 800 GS"],
    pruefen: [
      "Gelände-Spuren an Motorschutz und Felgen.",
      "Elektronisches Fahrwerk (falls verbaut) testen.",
      "Rückrufe beim BMW-Händler abfragen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "bmw-f-900-r-xr", marke: "BMW", modell: "F 900 R / F 900 XR", von: 2020, bis: null, typ: "naked",
    motor: "895 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "R als Naked Bike, XR als bequemer Crossover-Tourer.",
    plus: ["Kräftiger Zweizylinder", "XR mit Komfort und Windschutz", "Viel Elektronik"],
    minus: ["Einfaches Fahrwerk bei der Basisversion", "Teure Optionen"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Wheelie- und Sturzspuren.",
      "Rückrufe beim BMW-Händler abfragen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "bmw-s-1000-rr", marke: "BMW", modell: "S 1000 RR", von: 2009, bis: null, typ: "supersport",
    motor: "999 cm³, Vierzylinder", a2: false,
    kurz: "BMWs Superbike, von Anfang an mit viel Elektronik.",
    hinweis: "2019 komplett neu, mit variabler Nockenwelle (ShiftCam).",
    plus: ["Enorme Leistung", "Viel Elektronik", "Gute Bremsen"],
    minus: ["Viele Exemplare mit Rennstrecken-Vergangenheit", "Teure Services"],
    pruefen: [
      "Rennstrecken- und Sturzspuren.",
      "Rückrufe beim BMW-Händler mit der Rahmennummer abfragen.",
      "Umbauten an Auspuff und Steuergerät: Papiere?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "bmw-s-1000-r", marke: "BMW", modell: "S 1000 R", von: 2014, bis: null, typ: "naked",
    motor: "999 cm³, Vierzylinder", a2: false,
    kurz: "Das Naked Bike zur S 1000 RR. Sehr stark und trotzdem alltagstauglich.",
    plus: ["Sehr kräftiger Vierzylinder", "Viel Elektronik", "Gutes Fahrwerk"],
    minus: ["Wenig Windschutz", "Teure Services"],
    pruefen: [
      "Wheelie- und Sturzspuren.",
      "Rückrufe beim BMW-Händler abfragen.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?",
      "Servicebelege inklusive Ventilspiel."
    ]
  },
  {
    id: "bmw-r-nine-t", marke: "BMW", modell: "R nineT", von: 2014, bis: null, typ: "retro",
    motor: "1170 cm³, Boxer luft-/ölgekühlt, Kardan", a2: false,
    kurz: "Hochwertiger Retro-Boxer, sehr beliebt als Basis für Umbauten.",
    plus: ["Hochwertige Verarbeitung", "Kräftiger Boxer", "Kardanantrieb"],
    minus: ["Wenig Windschutz", "Wenig Komfort für Sozius"],
    pruefen: [
      "Kardan und Hinterachsgetriebe: Spiel und Öl prüfen.",
      "Umbauten: Papiere vorhanden?",
      "Rückrufe beim BMW-Händler abfragen.",
      "Ölverlust am Motor?"
    ]
  },
  {
    id: "bmw-r-1200-1250-rt", marke: "BMW", modell: "R 1200 RT / R 1250 RT", von: 2005, bis: null, typ: "tourer",
    motor: "1170 cm³ (R 1200), 1254 cm³ (R 1250), Boxer, Kardan", a2: false,
    kurz: "Der klassische Reisetourer, auch bei Polizei und Behörden verbreitet.",
    hinweis: "Ab 2014 wassergekühlt, ab 2019 als R 1250 RT mit ShiftCam.",
    plus: ["Sehr bequem, auch zu zweit", "Guter Windschutz", "Kardanantrieb"],
    minus: ["Schwer", "Viel Elektronik, teure Reparaturen"],
    pruefen: [
      "Kardan und Hinterachsgetriebe prüfen.",
      "Elektrisches Windschild und Fahrwerk (ESA) testen.",
      "Koffer und Halter prüfen.",
      "Rückrufe beim BMW-Händler abfragen."
    ]
  },

  /* ---------- Ducati ---------- */
  {
    id: "ducati-panigale-899-959-v2", marke: "Ducati", modell: "Panigale 899 / 959 / V2", von: 2014, bis: null, typ: "supersport",
    motor: "898 / 955 cm³, V2 (Superquadro)", a2: false,
    kurz: "Ducatis Mittelklasse-Superbike mit Superquadro-V2.",
    hinweis: "899 (2014–2015), 959 (2016–2019), V2 (ab 2020). Die Nockenwellen laufen über Ketten, nicht über Zahnriemen.",
    plus: ["Superbike-Optik mit etwas weniger Leistung", "Gutes Fahrwerk", "Keine Zahnriemen"],
    minus: ["Viel Hitze im Stadtverkehr", "Teurer Service"],
    pruefen: [
      "Desmo-Service (Ventilspiel): Rechnung einer Ducati-Werkstatt verlangen.",
      "Rennstrecken- und Sturzspuren.",
      "Software und Rückrufe beim Ducati-Händler abfragen.",
      "Umbauten an Auspuff und Mapping: Papiere?"
    ]
  },
  {
    id: "ducati-panigale-v4", marke: "Ducati", modell: "Panigale V4", von: 2018, bis: null, typ: "supersport",
    motor: "1103 cm³ (V4 R: 998 cm³), V4", a2: false,
    kurz: "Ducatis Superbike mit V4-Motor nah an der MotoGP-Technik.",
    plus: ["Enorme Leistung", "Sehr viel Elektronik", "Hochwertige Komponenten"],
    minus: ["Sehr viel Hitze im Stadtverkehr", "Teure Services und Verschleissteile"],
    pruefen: [
      "Desmo-Service (Ventilspiel): Rechnung einer Ducati-Werkstatt verlangen.",
      "Rennstrecken- und Sturzspuren.",
      "Software und Rückrufe beim Ducati-Händler abfragen.",
      "Reifen und Bremsen: Verschleiss passend zum Kilometerstand?"
    ]
  },
  {
    id: "ducati-panigale-1199-1299", marke: "Ducati", modell: "Panigale 1199 / 1299", von: 2012, bis: 2017, typ: "supersport",
    motor: "1198 / 1285 cm³, V2 (Superquadro)", a2: false,
    kurz: "Die grossen V2-Panigale vor der V4-Ära.",
    plus: ["Sehr starker V2", "Ikonisches Design", "Keine Zahnriemen"],
    minus: ["Viel Hitze im Stadtverkehr", "Teure Wartung"],
    pruefen: [
      "Desmo-Service (Ventilspiel): Rechnung einer Ducati-Werkstatt verlangen.",
      "Rennstrecken- und Sturzspuren.",
      "Elektrik: Regler und Batterie.",
      "Umbauten an Auspuff und Mapping: Papiere?"
    ]
  },
  {
    id: "ducati-1098-1198", marke: "Ducati", modell: "1098 / 1198", von: 2007, bis: 2011, typ: "supersport",
    motor: "1099 / 1198 cm³, V2", a2: false,
    kurz: "Das klassische Ducati-Superbike vor der Panigale, mit Trockenkupplung.",
    plus: ["Klassisches Ducati-Superbike", "Charakterstarker V2", "Gesucht bei Liebhabern"],
    minus: ["Trockenkupplung: laut und im Stadtverkehr verschleissanfällig", "Teure Wartung"],
    pruefen: [
      "Zahnriemen: Wechseldatum belegen lassen (nach Kilometern und nach Jahren).",
      "Desmo-Service: Rechnungen verlangen.",
      "Trockenkupplung: Rasseln ist normal, Rutschen nicht.",
      "Elektrik: Regler und Batterie auf Hitzeschäden prüfen."
    ]
  },
  {
    id: "ducati-multistrada", marke: "Ducati", modell: "Multistrada", von: 2003, bis: null, typ: "adventure",
    motor: "je nach Generation 620 bis 1262 cm³ V2, ab 2021 auch V4", a2: null,
    kurz: "Ducatis Allrounder für Sport, Reise und Alltag. Viele Generationen und Motoren.",
    hinweis: "Die Multistrada 1200 hat bis 2014 eine Trockenkupplung. Der V4-Motor ab 2021 braucht die Ventilspielkontrolle erst nach 60'000 km.",
    plus: ["Sehr vielseitig", "Viel Komfort und Elektronik", "Lange Ventilspiel-Intervalle beim V4"],
    minus: ["Teure Services bei den V2-Modellen", "Viel Elektronik, teure Reparaturen"],
    pruefen: [
      "Bei V2-Modellen: Zahnriemen und Desmo-Service belegen lassen.",
      "Elektronisches Fahrwerk (Skyhook) testen.",
      "Rückrufe und Software-Updates beim Ducati-Händler abfragen.",
      "Koffer und Halter prüfen."
    ]
  },
  {
    id: "ducati-hypermotard", marke: "Ducati", modell: "Hypermotard", von: 2007, bis: null, typ: "enduro",
    motor: "796 / 1100 cm³ (bis 2012), 821 / 939 cm³ (2013–2018), 937 cm³ (ab 2019), V2", a2: null,
    kurz: "Ducatis Supermoto. Sehr agil und auf kurvigen Strassen in ihrem Element.",
    plus: ["Sehr agil", "Viel Fahrspass auf kurvigen Strassen", "Kräftiger V2"],
    minus: ["Wenig Komfort auf langen Strecken", "Kleiner Tank"],
    pruefen: [
      "Zahnriemen und Desmo-Service belegen lassen.",
      "Stunt- und Sturzspuren an Heck, Lenker und Handprotektoren.",
      "Trockenkupplung bei der 1100: Rasseln ist dort normal.",
      "Umbauten an Auspuff: Papiere?"
    ]
  },
  {
    id: "ducati-streetfighter", marke: "Ducati", modell: "Streetfighter V4 / V2", von: 2020, bis: null, typ: "naked",
    motor: "1103 cm³ V4 oder 955 cm³ V2", a2: false,
    kurz: "Die Technik der Panigale ohne Verkleidung.",
    hinweis: "Die Streetfighter V2 gibt es seit 2022.",
    plus: ["Panigale-Technik als Naked Bike", "Enorme Leistung (V4)", "Viel Elektronik"],
    minus: ["Viel Hitze im Stadtverkehr", "Teure Services"],
    pruefen: [
      "Desmo-Service (Ventilspiel): Rechnung einer Ducati-Werkstatt verlangen.",
      "Wheelie- und Sturzspuren.",
      "Software und Rückrufe beim Ducati-Händler abfragen.",
      "Umbauten an Auspuff und Mapping: Papiere?"
    ]
  },
  {
    id: "ducati-diavel", marke: "Ducati", modell: "Diavel", von: 2011, bis: null, typ: "cruiser",
    motor: "1198 / 1262 cm³ V2, ab 2023 V4", a2: false,
    kurz: "Power-Cruiser mit Sportler-Leistung und breitem Hinterreifen.",
    plus: ["Cruiser mit Sportler-Leistung", "Bequeme Sitzposition", "Auffällige Optik"],
    minus: ["Breiter Hinterreifen, teuer im Ersatz", "Schwer"],
    pruefen: [
      "Bei V2-Modellen: Zahnriemen und Desmo-Service belegen lassen.",
      "Hinterreifen: Zustand und Alter prüfen.",
      "Umbauten an Auspuff: Papiere?",
      "Elektronik und Fahrmodi testen."
    ]
  },
  {
    id: "ducati-supersport", marke: "Ducati", modell: "SuperSport 939 / 950", von: 2017, bis: null, typ: "tourer",
    motor: "937 cm³, V2", a2: null,
    kurz: "Sportlicher Tourer: Ducati-Optik mit alltagstauglicher Sitzposition.",
    plus: ["Sportlich und trotzdem bequem", "Kräftiger V2", "Alltagstauglich"],
    minus: ["Teurer Service", "Wenig Platz für Gepäck"],
    pruefen: [
      "Zahnriemen und Desmo-Service belegen lassen.",
      "Sturzspuren an Verkleidung und Lenker.",
      "Software und Rückrufe beim Ducati-Händler abfragen.",
      "Kette und Ritzel."
    ]
  },
  {
    id: "ducati-desertx", marke: "Ducati", modell: "DesertX", von: 2022, bis: null, typ: "adventure",
    motor: "937 cm³, V2", a2: false,
    kurz: "Ducatis geländetaugliche Reiseenduro im Stil der Rallye-Töffs.",
    plus: ["Sehr geländetauglich mit 21-Zoll-Vorderrad", "Kräftiger V2", "Viel Elektronik"],
    minus: ["Hohe Sitzhöhe", "Teurer Service"],
    pruefen: [
      "Zahnriemen und Desmo-Service belegen lassen.",
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Speichen antippen.",
      "Software und Rückrufe beim Ducati-Händler abfragen."
    ]
  },

  /* ---------- Aprilia ---------- */
  {
    id: "aprilia-rs-660", marke: "Aprilia", modell: "RS 660", von: 2021, bis: null, typ: "supersport",
    motor: "659 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Leichter Sportler mit Zweizylinder und viel Elektronik.",
    plus: ["Leicht, mit viel Elektronik", "Als A2-Version erhältlich", "Gutes Fahrwerk"],
    minus: ["Sportliche Sitzposition", "Kleineres Händlernetz als bei den Japanern"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Rennstrecken- und Sturzspuren.",
      "Elektronik und Software beim Händler prüfen lassen.",
      "Servicebelege."
    ]
  },
  {
    id: "aprilia-tuono-660", marke: "Aprilia", modell: "Tuono 660", von: 2021, bis: null, typ: "naked",
    motor: "659 cm³, Zweizylinder", a2: true, a2text: "Als 35-kW-Version erhältlich.",
    kurz: "Die RS 660 mit Halbverkleidung und aufrechter Sitzposition.",
    plus: ["Leicht und agil", "Als A2-Version erhältlich", "Viel Elektronik"],
    minus: ["Wenig Komfort für Sozius", "Kleineres Händlernetz als bei den Japanern"],
    pruefen: [
      "Drosselung im Fahrzeugausweis prüfen.",
      "Wheelie- und Sturzspuren.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "aprilia-tuareg-660", marke: "Aprilia", modell: "Tuareg 660", von: 2022, bis: null, typ: "adventure",
    motor: "659 cm³, Zweizylinder", a2: null,
    kurz: "Leichte, geländetaugliche Reiseenduro mit dem Motor der RS 660.",
    plus: ["Sehr geländetauglich", "Leicht für eine Reiseenduro", "Kräftiger Zweizylinder"],
    minus: ["Hohe Sitzhöhe", "Junges Modell, noch wenige Gebrauchte"],
    pruefen: [
      "Gelände-Spuren an Motorschutz, Felgen und Handprotektoren.",
      "Speichen antippen.",
      "Kette und Ritzel.",
      "Servicebelege."
    ]
  },
  {
    id: "aprilia-rsv4", marke: "Aprilia", modell: "RSV4", von: 2009, bis: null, typ: "supersport",
    motor: "999 / 1077 / 1099 cm³, V4", a2: false,
    kurz: "Aprilias Superbike mit V4 und sehr gutem Fahrwerk.",
    plus: ["Charakterstarker V4 mit typischem Klang", "Sehr gutes Fahrwerk", "Viel Elektronik"],
    minus: ["Teure Services und Teile", "Hoher Verbrauch"],
    pruefen: [
      "Rennstrecken- und Sturzspuren.",
      "Servicebelege inklusive Ventilspiel.",
      "Elektronik und Software beim Händler prüfen lassen.",
      "Umbauten an Auspuff und Steuergerät: Papiere?"
    ]
  },
  {
    id: "aprilia-tuono-v4", marke: "Aprilia", modell: "Tuono V4", von: 2011, bis: null, typ: "naked",
    motor: "999 / 1077 cm³, V4", a2: false,
    kurz: "Der V4 der RSV4 mit Halbverkleidung und hohem Lenker.",
    plus: ["V4-Leistung mit aufrechter Sitzposition", "Sehr gutes Fahrwerk", "Typischer V4-Klang"],
    minus: ["Hoher Verbrauch", "Teure Services"],
    pruefen: [
      "Wheelie- und Sturzspuren.",
      "Servicebelege inklusive Ventilspiel.",
      "Elektronik und Software beim Händler prüfen lassen.",
      "Nachgerüsteter Auspuff mit Typengenehmigung?"
    ]
  },
  {
    id: "aprilia-rs-125", marke: "Aprilia", modell: "RS 125 / RS4 125", von: 2011, bis: null, typ: "supersport",
    motor: "125 cm³, Einzylinder (Viertakt)", a2: true, a2text: "125er: auch mit Kategorie A1 fahrbar.",
    kurz: "Sportlicher 125er im Look der grossen RSV4.",
    hinweis: "Die Viertakt-Version hiess bis 2016 RS4 125. Ältere RS 125 sind Zweitakter.",
    plus: ["Sportliche Optik wie ein grosser Sportler", "Gutes Fahrwerk für die Klasse"],
    minus: ["Wenig Leistung", "Sportliche Sitzposition"],
    pruefen: [
      "Umfaller- und Sturzspuren.",
      "Tuning? Alles muss zum Fahrzeugausweis passen.",
      "Ölwechsel nach Plan belegt?",
      "Kette und Ritzel."
    ]
  },
  {
    id: "aprilia-rs-457", marke: "Aprilia", modell: "RS 457", von: 2024, bis: null, typ: "supersport",
    motor: "457 cm³, Zweizylinder", a2: true, a2text: "Ab Werk A2-tauglich, keine Drosselung nötig.",
    kurz: "Leichter Einsteiger-Sportler, ab Werk für Kategorie A beschränkt gebaut.",
    plus: ["Ab Werk A2-tauglich", "Leicht", "Moderne Elektronik"],
    minus: ["Junges Modell, noch wenige Gebrauchte", "Sportliche Sitzposition"],
    pruefen: [
      "Umfaller- und Sturzspuren.",
      "Kette und Ritzel.",
      "Servicebelege.",
      "Garantie: Läuft sie noch, und ist sie übertragbar?"
    ]
  }
];

// Hilfsfunktionen, die beide Seiten brauchen
const jahreText = m => m.von + "–" + (m.bis || "heute");
const sortiert = () => [...MODELLE].sort((a, b) => (a.marke + a.modell).localeCompare(b.marke + b.modell, "de"));
