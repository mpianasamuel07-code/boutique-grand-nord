import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from './db.js';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function envoyerJson(res, statut, donnees) {
  res.writeHead(statut, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(donnees));
}

const commandes = [];

async function lireCorps(req) {
  let corps = '';
  for await (const morceau of req) {
    corps += morceau;
  }
  return corps;
}

function calculerTotal(produit, data) {
  let sousTotal = produit.prix * data.quantite;
  if (data.livraison === 'domicile') {
    sousTotal = sousTotal + 25;        // livraison
  }
  if (data.options.includes('installation')) {
    sousTotal = sousTotal + 49;        // mise en marche
  }
  if (data.options.includes('garantie')) {
    sousTotal = sousTotal + 99;        // garantie 3 ans
  }
  return Math.round(sousTotal * 113) / 100;   // TVH 13 %
}

async function servirFichier(res, pathname) {
  const fichier = pathname === '/' ? '/index.html' : pathname;
  const chemin = path.join('public', fichier);
  const type = TYPES[path.extname(chemin)] || 'text/plain';
  try {
    const contenu = await fs.readFile(chemin);
    res.writeHead(200, { 'Content-Type': type });
    res.end(contenu);
  } catch (erreur) {
    res.writeHead(404);
    res.end('Page introuvable');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  const route = req.method + ' ' + url.pathname;
  console.log(route);

  if (route === 'GET /api/produits') {
    const catalogue = db.prepare('SELECT * FROM produits').all();
    return envoyerJson(res, 200, catalogue);
  }

  if (route === 'POST /api/commandes') {
    const data = JSON.parse(await lireCorps(req));
    const produit = db.prepare('SELECT * FROM produits WHERE id = ?').get(data.produitId); const quantite = data.quantite;
    if (!data.nom || !data.courriel) {
      return envoyerJson(res, 400,
        { erreur: 'Nom et courriel obligatoires' });
    }
    if (data.livraison === 'domicile' && !data.adresse) {
      return envoyerJson(res, 400,
        { erreur: 'Adresse obligatoire' });
    }
    if (!Number.isInteger(quantite) || quantite < 1) {
      return envoyerJson(res, 400,
        { erreur: 'Quantité invalide' });
    }
    if (!produit) {
      return envoyerJson(res, 404,
        { erreur: 'Produit inconnu' });
    }
    if (quantite > produit.stock) {
      return envoyerJson(res, 409,
        { erreur: `Il ne reste que ${produit.stock} en stock` });
    }
    const total = calculerTotal(produit, data);
    const heure = new Date().toLocaleTimeString('fr-CA');
    const resultat = db.prepare(`INSERT into commandes
      (client, courriel, produit, quantite,
      livraison, options, total, heure)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(data.nom, data.courriel, produit.nom, quantite,
      data.livraison, data.options.join(', '), total, heure);
    db.prepare('UPDATE produits SET stock = stock - ? WHERE id = ?').run(quantite, produit.id);    // db.prepare('UPDATE produits SET stock = stock - ? WHERE id = ?').run(quantite, produit.id);
    return envoyerJson(res, 201, { id: resultat.lastInsertRowid, total });
  }

  if (route === 'GET /api/commandes') {
    const commandes = db.prepare(
      'SELECT * FROM commandes WHERE id DESC').get();
    return envoyerJson(res, 200, commandes);
  }

  await servirFichier(res, url.pathname);
});

server.listen(process.env.PORT, () => {
  console.log(`Boutique : http://localhost:${process.env.PORT}`);
});

