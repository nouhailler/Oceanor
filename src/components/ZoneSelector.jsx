import React from 'react';
import PropTypes from 'prop-types';

/**
 * Zone selector component
 * @param {Object} props - Component props
 * @param {Object} props.zones - Available zones
 * @param {string} props.selectedZone - Currently selected zone
 * @param {Function} props.onZoneChange - Callback when zone changes
 */
function ZoneSelector({ zones, selectedZone, onZoneChange }) {
  const zoneEntries = Object.entries(zones);

  return (
    <div className="selector-group">
      <label htmlFor="zone-select">Zone Géographique:</label>
      <select
        id="zone-select"
        value={selectedZone}
        onChange={(e) => onZoneChange(e.target.value)}
        className="selector"
      >
        {zoneEntries.map(([id, zone]) => (
          <option key={id} value={id}>
            {zone.name}
          </option>
        ))}
      </select>
    </div>
  );
}

ZoneSelector.propTypes = {
  zones: PropTypes.object.isRequired,
  selectedZone: PropTypes.string.isRequired,
  onZoneChange: PropTypes.func.isRequired
};

export default ZoneSelector;
