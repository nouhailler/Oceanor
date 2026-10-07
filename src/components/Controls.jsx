import React from 'react';
import PropTypes from 'prop-types';
import ZoneSelector from './ZoneSelector';
import TimeRangeSelector from './TimeRangeSelector';

/**
 * Control panel component with all selectors
 * @param {Object} props - Component props
 * @param {Object} props.zones - Available zones
 * @param {string} props.selectedZone - Currently selected zone
 * @param {Function} props.onZoneChange - Callback when zone changes
 * @param {Object} props.timeRanges - Available time ranges
 * @param {string} props.selectedTimeRange - Currently selected time range
 * @param {Function} props.onTimeRangeChange - Callback when time range changes
 * @param {Function} props.onRefresh - Callback to refresh data
 */
function Controls({
  zones,
  selectedZone,
  onZoneChange,
  timeRanges,
  selectedTimeRange,
  onTimeRangeChange,
  onRefresh
}) {
  return (
    <div className="controls">
      <div className="selectors">
        <ZoneSelector
          zones={zones}
          selectedZone={selectedZone}
          onZoneChange={onZoneChange}
        />
        <TimeRangeSelector
          timeRanges={timeRanges}
          selectedTimeRange={selectedTimeRange}
          onTimeRangeChange={onTimeRangeChange}
        />
      </div>
      <div className="controls-actions">
        <button 
          onClick={onRefresh} 
          className="btn btn-refresh"
          title="Rafraîchir les données"
        >
          <span className="btn-icon">🔄</span>
          <span className="btn-text">Rafraîchir</span>
        </button>
      </div>
    </div>
  );
}

Controls.propTypes = {
  zones: PropTypes.object.isRequired,
  selectedZone: PropTypes.string.isRequired,
  onZoneChange: PropTypes.func.isRequired,
  timeRanges: PropTypes.object.isRequired,
  selectedTimeRange: PropTypes.string.isRequired,
  onTimeRangeChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default Controls;
