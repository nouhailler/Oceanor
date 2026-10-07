import React from 'react';

/**
 * Header component with app title and description
 */
function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <span className="title-main">NOAA SST Dashboard</span>
          <span className="title-subtitle">Tableau de bord des températures océaniques</span>
        </h1>
        <div className="header-description">
          <p>Visualisation de l'évolution des températures de surface de la mer (SST) 
            et de leurs anomalies par rapport à la baseline 1991-2020</p>
          <p className="data-source">
            Source: NOAA OISST v2.1 via ERDDAP
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
