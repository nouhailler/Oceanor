# Oceanor - NOAA SST Dashboard PWA

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://nouhailler.github.io/Oceanor/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tableau de bord PWA pour visualiser l'évolution des températures océaniques NOAA OISST v2.1 avec support hors-ligne.**

## 🌊 Fonctionnalités

- **📊 Visualisation interactive** des températures de surface de la mer (SST) et anomalies
- **🌍 Zones géographiques** : Niño 3.4, Global, Atlantique Nord, Pacifique Tropical, Pacifique Nord
- **⏱️ Plages temporelles** : 1 an, 5 ans, 10 ans, Historique complet (1982-Présent)
- **📱 PWA** : Installation sur mobile/desktop, accès hors-ligne
- **💾 Cache automatique** des données via Service Worker
- **🔄 Agrégation spatiale** des points de grille
- **📱 Responsive design** pour tous les appareils

## 🚀 Déploiement

### Frontend (GitHub Pages)
L'application frontend est automatiquement déployée sur GitHub Pages :
👉 **[Voir la démo en direct](https://nouhailler.github.io/Oceanor/)**

### Backend (Nécessaire pour les données réelles)
**⚠️ IMPORTANT** : Pour que l'application fonctionne avec des **données réelles**, vous devez déployer le backend.

Le frontend utilise maintenant un **backend proxy** pour contourner les restrictions CORS de l'API ERDDAP.

#### Options de déploiement du backend :

##### Option 1: Render (Recommandé - Gratuit)
1. Allez sur [https://render.com](https://render.com) (gratuit pour les petits projets)
2. Créez un nouveau **Web Service**
3. Connectez votre dépôt GitHub
4. Configuration :
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3001`
5. Déployez
6. **Mettez à jour** `BACKEND_BASE_URL` dans `src/services/erddap.js` avec l'URL de votre backend Render

##### Option 2: Railway
1. Allez sur [https://railway.app](https://railway.app)
2. Créez un nouveau projet depuis GitHub
3. Sélectionnez le dossier `server`
4. Déployez
5. Mettez à jour `BACKEND_BASE_URL`

##### Option 3: Vercel
1. Allez sur [https://vercel.com](https://vercel.com)
2. Créez un nouveau projet
3. Configuration :
   - **Framework**: `Other`
   - **Root Directory**: `server`
   - **Install Command**: `npm install`
   - **Build Command**: (laisser vide)
   - **Start Command**: `npm start`
4. Déployez
5. Mettez à jour `BACKEND_BASE_URL`

##### Option 4: Local (pour développement)
```bash
# Dans un terminal, dans le dossier /server
cd server
npm install
npm start
```
Le backend sera disponible sur `http://localhost:3001`

## 🛠 Stack Technique

### Frontend
- **Framework**: Vite + React 18
- **Graphiques**: Chart.js + chartjs-adapter-date-fns
- **PWA**: Vite PWA Plugin + Workbox
- **Styling**: CSS Modules

### Backend
- **Framework**: Express.js
- **CORS**: cors middleware
- **API**: RESTful endpoints

### Données
- **Source**: API ERDDAP NOAA CoastWatch (dataset: ncdcOisst21Agg)
- **Variables**: sst (Sea Surface Temperature), anom (Anomaly)
- **Baseline**: 1991-2020

## 📦 Installation (Développement local)

### Cloner le dépôt
```bash
git clone https://github.com/nouhailler/Oceanor.git
cd Oceanor
```

### Démarrer le backend (dans un terminal)
```bash
cd server
npm install
npm start
```
Le backend sera disponible sur `http://localhost:3001`

### Démarrer le frontend (dans un autre terminal)
```bash
cd Oceanor  # (dossier racine)
npm install
npm run dev
```
Le frontend sera disponible sur `http://localhost:5173`

### Build pour la production
```bash
npm run build
npm run preview
```

## 📡 API Backend

Le backend expose les endpoints suivants :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/zones` | GET | Liste des zones géographiques disponibles |
| `/api/time-ranges` | GET | Liste des plages temporelles disponibles |
| `/api/data` | GET | Récupère les données de série temporelle |
| `/api/comparative` | GET | Récupère SST + anomalies pour comparaison |
| `/api/baseline` | GET | Informations sur la baseline 1991-2020 |

### Exemples de requêtes :

```
# Récupérer les données SST pour Niño 3.4 sur 5 ans
GET /api/data?variable=sst&zoneId=nino34&timeRange=5years

# Récupérer SST + anomalies pour comparaison
GET /api/comparative?zoneId=nino34&timeRange=5years
```

## 📁 Structure du Projet

```
Oceanor/
├── server/                          # Backend proxy
│   ├── index.js                    # Serveur Express
│   ├── package.json               # Dépendances backend
│   └── .gitignore                 # Fichiers ignorés
├── public/
│   ├── sw.js                      # Service Worker
│   ├── manifest.json             # Web App Manifest
│   └── pwa-*.png                 # Icônes PWA
├── src/
│   ├── App.jsx                    # Composant principal
│   ├── App.css                    # Styles principaux
│   ├── main.jsx                   # Point d'entrée
│   ├── components/
│   │   ├── SSTChart.jsx           # Graphique Chart.js
│   │   ├── Controls.jsx           # Panel de contrôle
│   │   ├── ZoneSelector.jsx       # Sélecteur de zone
│   │   ├── TimeRangeSelector.jsx  # Sélecteur de période
│   │   ├── DataInfo.jsx           # Info données
│   │   └── Header.jsx             # En-tête
│   ├── services/
│   │   └── erddap.js              # Service ERDDAP (appelle le backend)
│   ├── hooks/
│   │   ├── useErddapData.js       # Hook données
│   │   └── useOfflineCache.js     # Hook cache
│   ├── utils/
│   │   └── pwaUtils.js            # Utilitaires PWA
│   └── index.css                  # Styles globaux
├── vite.config.js                 # Configuration Vite + PWA
├── package.json                   # Dépendances frontend
└── .github/workflows/
    └── deploy.yml                 # Déploiement GitHub Pages
```

## 🎨 Capture d'écran

L'application affiche :
- Un graphique interactif avec deux courbes (Température et Anomalie)
- Des sélecteurs pour choisir la zone géographique et la période
- Un indicateur de statut (en ligne/hors-ligne)
- La date de dernière mise à jour

## 📄 Licence

MIT License - Libre d'utiliser, modifier et distribuer.

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou un PR.

## 📞 Contact

Pour toute question : [nouhailler](https://github.com/nouhailler)
