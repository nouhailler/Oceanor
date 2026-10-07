# Oceanor - NOAA SST Dashboard PWA

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://nouhailler.github.io/Oceanor/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tableau de bord PWA pour visualiser l'evolution des temperatures oceaniques NOAA OISST v2.1 avec support hors-ligne.**

## 🌊 Fonctionnalites

- **📊 Visualisation interactive** des temperatures de surface de la mer (SST) et anomalies
- **🌍 Zones geographiques** : Nino 3.4, Global, Atlantique Nord, Pacifique Tropical, Pacifique Nord
- **⏱️ Plages temporelles** : 1 an, 5 ans, 10 ans, Historique complet (1982-Present)
- **📱 PWA** : Installation sur mobile/desktop, acces hors-ligne
- **💾 Cache automatique** des donnees via Service Worker
- **🔄 Aggregation spatiale** des points de grille
- **📱 Responsive design** pour tous les appareils

## 🚀 Demarrage rapide

### Developpement local (avec donnees reelles)

#### 1. Cloner le depot
```bash
git clone https://github.com/nouhailler/Oceanor.git
cd Oceanor
```

#### 2. Demarrer le backend (dans un terminal)
```bash
cd server
npm install
npm start
```
> Le backend sera disponible sur `http://localhost:3001`

#### 3. Demarrer le frontend (dans un autre terminal)
```bash
cd Oceanor  # dossier racine
npm install
npm run dev
```
> Le frontend sera disponible sur `http://localhost:5173`

**✅ L'application fonctionnera avec des donnees reelles !**

---

## 🌐 Deployement

### Frontend (GitHub Pages)
L'application frontend est automatiquement deployee sur GitHub Pages :
👉 **[Voir la demo en direct](https://nouhailler.github.io/Oceanor/)**

### Backend (Necessaire pour les donnees reelles)
**⚠️ IMPORTANT** : Pour que l'application fonctionne avec des **donnees reelles** sur GitHub Pages, vous devez deployer le backend.

#### Option 1: Render (Recommande - Gratuit)
1. Allez sur [https://render.com](https://render.com)
2. Creez un nouveau **Web Service**
3. Connectez votre depot GitHub (`nouhailler/Oceanor`)
4. Configuration :
   - **Name**: `oceanor-backend`
   - **Region**: `US East (N. Virginia)` ou autre
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3001`
5. Cliquez sur **Create Web Service**
6. Attendez le deployement (2-3 minutes)
7. **Copiez l'URL du backend** (ex: `https://oceanor-backend.onrender.com`)

#### Option 2: Railway
1. Allez sur [https://railway.app](https://railway.app)
2. Creez un nouveau projet depuis GitHub
3. Selectionnez le depot `nouhailler/Oceanor`
4. Dans **Variables**, ajoutez :
   - `PORT=3001`
5. Dans **Settings**, definissez :
   - **Working Directory**: `server`
6. Deployez

#### Option 3: Vercel
1. Allez sur [https://vercel.com](https://vercel.com)
2. Creez un nouveau projet
3. Importez le depot `nouhailler/Oceanor`
4. Configuration :
   - **Framework**: `Other`
   - **Root Directory**: `server`
   - **Install Command**: `npm install`
   - **Build Command**: (laisser vide)
   - **Start Command**: `npm start`
5. Deployez

#### Option 4: Cyclic (Gratuit pour petits projets)
1. Allez sur [https://www.cyclic.sh](https://www.cyclic.sh)
2. Connectez votre compte GitHub
3. Selectionnez le depot `nouhailler/Oceanor`
4. Definissez :
   - **App Name**: `oceanor-backend`
   - **Path**: `server`
5. Deployez

---

## 🔧 Configuration du Backend URL

Une fois votre backend deploye, vous devez mettre a jour le frontend pour qu'il utilise cette URL.

### Modification du code

1. Ouvrez le fichier : `src/services/erddap.js`
2. Trouvez la ligne (environ ligne 8) :
   ```javascript
   BACKEND_BASE_URL = 'https://oceanor-backend.onrender.com';
   ```
3. Remplacez l'URL par celle de votre backend deploye
4. Sauvegardez et commitez :
   ```bash
   git add src/services/erddap.js
   git commit -m "Update backend URL"
   git push origin main
   ```

### Exemple de configuration

Si votre backend est deploye sur Render :
```javascript
BACKEND_BASE_URL = 'https://oceanor-backend.onrender.com';
```

Si votre backend est deploye sur Railway :
```javascript
BACKEND_BASE_URL = 'https://oceanor-backend.up.railway.app';
```

---

## 🛠 Stack Technique

### Frontend
- **Framework**: Vite + React 18
- **Graphiques**: Chart.js + chartjs-adapter-date-fns
- **PWA**: Vite PWA Plugin + Workbox
- **Styling**: CSS Modules
- **Build**: Vite

### Backend
- **Framework**: Express.js
- **CORS**: cors middleware
- **API**: RESTful endpoints
- **Node.js**: >= 18.0.0

### Donnees
- **Source**: API ERDDAP NOAA CoastWatch
- **Dataset**: `ncdcOisst21Agg` (NOAA Optimum Interpolation SST v2.1)
- **Variables**: `sst` (Sea Surface Temperature), `anom` (Anomaly)
- **Baseline**: 1991-2020
- **Resolution**: Daily, 0.25 degree grid

---

## 📡 API Backend

Le backend expose les endpoints suivants :

| Methode | Endpoint | Description | Parametres |
|---------|----------|-------------|------------|
| GET | `/api/zones` | Liste des zones geographiques disponibles | - |
| GET | `/api/time-ranges` | Liste des plages temporelles disponibles | - |
| GET | `/api/data` | Recuperer les donnees de serie temporelle | `variable`, `zoneId`, `timeRange`, `endDate` |
| GET | `/api/comparative` | Recuperer SST + anomalies pour comparaison | `zoneId`, `timeRange`, `endDate` |
| GET | `/api/baseline` | Informations sur la baseline 1991-2020 | - |

### Exemples de requetes :

```bash
# Recuperer les zones disponibles
curl https://oceanor-backend.onrender.com/api/zones

# Recuperer les plages temporelles
curl https://oceanor-backend.onrender.com/api/time-ranges

# Recuperer les donnees SST pour Nino 3.4 sur 5 ans
curl "https://oceanor-backend.onrender.com/api/data?variable=sst&zoneId=nino34&timeRange=5years"

# Recuperer SST + anomalies pour comparaison
curl "https://oceanor-backend.onrender.com/api/comparative?zoneId=nino34&timeRange=5years"
```

---

## 📁 Structure du Projet

```
Oceanor/
├── server/                          # Backend proxy
│   ├── index.js                    # Serveur Express
│   ├── package.json               # Dependances backend
│   └── .gitignore                 # Fichiers ignores
├── public/
│   ├── sw.js                      # Service Worker
│   ├── manifest.json             # Web App Manifest
│   ├── pwa-192x192.png           # Icone PWA 192x192
│   ├── pwa-512x512.png           # Icone PWA 512x512
│   ├── favicon.ico               # Favicon
│   └── apple-touch-icon.png      # Icone Apple
├── src/
│   ├── App.jsx                    # Composant principal
│   ├── App.css                    # Styles principaux
│   ├── main.jsx                   # Point d'entree
│   ├── index.css                  # Styles globaux
│   ├── components/
│   │   ├── Header.jsx            # En-tete
│   │   ├── Controls.jsx          # Panel de controle
│   │   ├── SSTChart.jsx          # Graphique Chart.js
│   │   ├── ZoneSelector.jsx      # Selecteur de zone
│   │   ├── TimeRangeSelector.jsx # Selecteur de periode
│   │   └── DataInfo.jsx          # Info donnees
│   ├── services/
│   │   └── erddap.js             # Service ERDDAP (appelle le backend)
│   ├── hooks/
│   │   ├── useErddapData.js      # Hook donnees
│   │   └── useOfflineCache.js    # Hook cache hors-ligne
│   └── utils/
│       └── pwaUtils.js           # Utilitaires PWA
├── vite.config.js                 # Configuration Vite + PWA
├── package.json                   # Dependances frontend
├── index.html                    # Page HTML principale
└── .github/workflows/
    └── deploy.yml                # Deployement GitHub Pages
```

---

## 🎨 Apercu de l'application

L'application affiche :
- **Graphique interactif** avec deux courbes (Temperature et Anomalie)
- **Selecteurs** pour choisir la zone geographique et la periode
- **Indicateur de statut** (en ligne/hors-ligne)
- **Date de derniere mise a jour**
- **Tooltips** avec valeurs exactes au survol

### Zones disponibles :
- **Nino 3.4** : Zone El Nino (5°N-5°S, 170°W-120°W)
- **Global** : Ocean mondial complet
- **Atlantique Nord** : 0°-60°N, 80°W-0°
- **Pacifique Tropical** : 20°S-20°N, 180°-80°W
- **Pacifique Nord** : 0°-60°N, 180°-100°W

### Plages temporelles :
- **1 an** : Donnees des 12 derniers mois
- **5 ans** : Donnees des 5 dernieres annees
- **10 ans** : Donnees des 10 dernieres annees
- **Historique complet** : Donnees depuis 1981 (debut du dataset)

---

## 📊 Exemple de donnees

Les donnees recuperes de l'API ERDDAP incluent :
- **sst** : Temperature de surface de la mer en °C
- **anom** : Anomalie par rapport a la baseline 1991-2020 en °C
- **time** : Date de l'observation
- **latitude/longitude** : Coordonnees geographiques

Les donnees sont **agregees spatialement** pour chaque zone selectionnee.

---

## 💾 Cache et mode hors-ligne

L'application utilise :
- **Service Worker** pour le cache des assets
- **Workbox** pour la gestion du cache
- **Cache API** pour stocker les reponses ERDDAP
- **Detection automatique** du mode hors-ligne

En mode hors-ligne, l'application affiche les **dernieres donnees cachees**.

---

## 📄 Licence

MIT License - Libre d'utiliser, modifier et distribuer.

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou un PR.

## 📞 Contact

Pour toute question : [nouhailler](https://github.com/nouhailler)

---

## 🏆 Remerciements

- **NOAA** pour les donnees OISST v2.1
- **ERDDAP** pour l'API de recuperation des donnees
- **Chart.js** pour les graphiques interactifs
- **Vite** pour l'outil de build rapide
