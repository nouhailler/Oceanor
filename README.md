# Oceanor - NOAA SST Dashboard PWA

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)](https://nouhailler.github.io/Oceanor/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Tableau de bord PWA pour visualiser l'évolution des températures océaniques NOAA OISST v2.1 avec support hors-ligne.

## 🌊 Fonctionnalités

- **📊 Visualisation interactive** des températures de surface de la mer (SST) et anomalies
- **🌍 Zones géographiques** : Niño 3.4, Global, Atlantique Nord, Pacifique Tropical, Pacifique Nord
- **⏱️ Plages temporelles** : 1 an, 5 ans, 10 ans, Historique complet (1982-Présent)
- **📱 PWA** : Installation sur mobile/desktop, accès hors-ligne
- **💾 Cache automatique** des données ERDDAP via Service Worker
- **🔄 Agrégation spatiale** des points de grille
- **📱 Responsive design** pour tous les appareils

## 🚀 Déploiement

L'application est automatiquement déployée sur GitHub Pages :

👉 **[Voir la démo en direct](https://nouhailler.github.io/Oceanor/)**

## 🛠 Stack Technique

- **Frontend**: Vite + React 18
- **Graphiques**: Chart.js + chartjs-adapter-date-fns
- **PWA**: Vite PWA Plugin + Workbox
- **Données**: API ERDDAP NOAA CoastWatch (dataset: ncdcOisst21Agg)
- **Déploiement**: GitHub Pages

## 📦 Installation

```bash
# Cloner le dépôt
git clone https://github.com/nouhailler/Oceanor.git
cd Oceanor

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Preview du build
npm run preview
```

## 📡 API Utilisée

- **Dataset**: NOAA OISST v2.1 (ncdcOisst21Agg)
- **Base URL**: https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.json
- **Variables**: sst (Sea Surface Temperature), anom (Anomaly)
- **Baseline**: 1991-2020

## 📁 Structure du Projet

```
Oceanor/
├── public/
│   ├── sw.js                    # Service Worker
│   ├── manifest.json           # Web App Manifest
│   └── pwa-*.png               # Icônes PWA
├── src/
│   ├── App.jsx                 # Composant principal
│   ├── components/
│   │   ├── SSTChart.jsx        # Graphique Chart.js
│   │   ├── Controls.jsx        # Panel de contrôle
│   │   ├── ZoneSelector.jsx    # Sélecteur de zone
│   │   └── TimeRangeSelector.jsx # Sélecteur de période
│   ├── services/
│   │   └── erddap.js           # Service ERDDAP
│   ├── hooks/
│   │   ├── useErddapData.js    # Hook données
│   │   └── useOfflineCache.js  # Hook cache
│   └── utils/
│       └── pwaUtils.js         # Utilitaires PWA
├── vite.config.js              # Configuration Vite + PWA
└── .github/workflows/
    └── deploy.yml              # Déploiement GitHub Pages
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
