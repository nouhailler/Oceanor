import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Data information display component
 * @param {Object} props - Component props
 * @param {Date} props.lastUpdated - Last update timestamp
 * @param {boolean} props.isOffline - Offline state
 * @param {number} props.dataPoints - Number of data points
 */
function DataInfo({ lastUpdated, isOffline, dataPoints }) {
  return (
    <div className="data-info">
      <div className="info-items">
        {lastUpdated && (
          <div className="info-item">
            <span className="info-label">Dernière mise à jour:</span>
            <span className="info-value">
              {format(lastUpdated, 'dd MMM yyyy à HH:mm', { locale: fr })}
            </span>
          </div>
        )}
        
        <div className="info-item">
          <span className="info-label">Points de données:</span>
          <span className="info-value">{dataPoints}</span>
        </div>
        
        <div className={`info-item status ${isOffline ? 'offline' : 'online'}`}>
          <span className="info-label">Statut:</span>
          <span className="info-value">
            {isOffline ? 'Hors-ligne (cache)' : 'En ligne'}
          </span>
        </div>
      </div>
    </div>
  );
}

DataInfo.propTypes = {
  lastUpdated: PropTypes.instanceOf(Date),
  isOffline: PropTypes.bool,
  dataPoints: PropTypes.number
};

DataInfo.defaultProps = {
  isOffline: false,
  dataPoints: 0
};

export default DataInfo;
