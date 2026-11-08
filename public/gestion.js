const liste = document.querySelector('#commandes');
const ventes = document.querySelector('#ventes');

async function chargerCommandes() {
  const response = await fetch('/api/commandes');
  const commandes = await response.json();
  liste.textContent = '';
  let total = 0;
  for (const c of commandes) {
    const li = document.createElement('li');
    li.textContent = `#${c.id} · ${c.client} : ${c.quantite} × `
      + `${c.produit} · ${c.livraison} = ${c.total.toFixed(2)} $`;
    liste.appendChild(li);
    total = total + c.total;
  }
  ventes.textContent = `Ventes du jour : ${total.toFixed(2)} $`;
}

chargerCommandes();
setInterval(chargerCommandes, 5000);
