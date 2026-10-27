// Töffcheck Modellseite: Liste mit Suche und Filtern, Daten aus modelle.js.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

$("f-typ").innerHTML += Object.entries(TYPEN).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join("");

function card(m) {
  return `<article class="model-card" id="${m.id}">
    <header>
      <span class="brand">${esc(m.marke)}</span>
      <h2>${esc(m.modell)}</h2>
      <span class="meta">${jahreText(m)} · ${esc(m.motor)}</span>
      <div class="chips"><span class="chip">${TYPEN[m.typ].name}</span>${m.a2 ? '<span class="chip a2">A2 möglich</span>' : ""}</div>
    </header>
    <div class="body">
      <p>${esc(m.kurz)}</p>
      <ul class="plus">${m.plus.slice(0, 2).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      <ul class="minus">${m.minus.slice(0, 2).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
    </div>
    <footer><a href="./?modell=${m.id}#ratgeber">Checkliste und Preis-Check</a></footer>
  </article>`;
}

function render() {
  const q = $("q").value.trim().toLowerCase(), typ = $("f-typ").value, a2 = $("f-a2").checked;
  const list = sortiert().filter(m =>
    (!q || (m.marke + " " + m.modell).toLowerCase().includes(q)) &&
    (!typ || m.typ === typ) && (!a2 || m.a2));
  $("liste").innerHTML = list.length ? list.map(card).join("") : '<p class="empty">Kein Modell gefunden. Versuch es mit einem anderen Suchbegriff oder schau unten.</p>';
  $("count").textContent = list.length === MODELLE.length ? `${MODELLE.length} Modelle` : `${list.length} von ${MODELLE.length} Modellen`;
}

["q", "f-typ", "f-a2"].forEach(id => $(id).addEventListener("input", render));
render();
