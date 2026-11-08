// db.js (nouveau fichier, à côté de server.js)
import { DatabaseSync } from 'node:sqlite';
import { produits } from './produits.js';
export const db = new DatabaseSync(process.env.DB_FICHIER);
db.exec(`CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    categorie TEXT,
    prix REAL NOT NULL,
    stock INTEGER NOT NULL
)`);
db.exec(`CREATE TABLE IF NOT EXISTS commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT NOT NULL,
    courriel TEXT NOT NULL,
    produit TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    livraison TEXT,
    options TEXT,
    total REAL NOT NULL,
    heure TEXT
)`);

const { total } = db.prepare(
    'SELECT COUNT(*) AS total FROM produits').get();

if (total === 0) {
    const ajouter = db.prepare(`INSERT INTO produits
        (nom, categorie, prix, stock) VALUES (?, ?, ?, ?)`);
    for (const p of produits) {
        ajouter.run(p.nom, p.categorie, p.prix, p.stock);
    }
    console.log('Catalogue ajouté dans la base');
}