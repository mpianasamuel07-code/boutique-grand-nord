const catalogue = document.querySelector('#catalogue');

async function chargerProduits() {
  const response = await fetch('/api/produits');
  const produits = await response.json();
  catalogue.textContent = '';
  for (const p of produits) {
    const li = document.createElement('li');
    li.textContent = `${p.nom} · ${p.prix.toFixed(2)} $`
      + ` · stock : ${p.stock}`;
    catalogue.append(li);
  }
}

const confirmation = document.querySelector('#confirmation');
const erreur = document.querySelector('#erreur');
const formulaire = document.querySelector('#commande');

formulaire.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(formulaire);
  const data = Object.fromEntries(formData);
  data.produitId = Number(data.produitId);
  data.quantite = Number(data.quantite);
  data.options = formData.getAll('options');
  const response = await fetch('/api/commandes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (response.ok) {
    const commande = await response.json();
    const total = commande.total.toFixed(2);
    confirmation.textContent =
      `Commande #${commande.id} confirmée : ${total} $`;
    erreur.textContent = '';
    formulaire.reset();
    await chargerProduits();
  } else {
    const resultat = await response.json();
    erreur.textContent = resultat.erreur;
    confirmation.textContent = '';
  }
});

chargerProduits();
