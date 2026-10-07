import React from 'react';
import PropTypes from 'prop-types';

/**
 * Time range selector component
 * @param {Object} props - Component props
 * @param {Object} props.timeRanges - Available time ranges
 * @param {string} props.selectedTimeRange - Currently selected time range
 * @param {Function} props.onTimeRangeChange - Callback when time range changes
 */
function TimeRangeSelector({ timeRanges, selectedTimeRange, onTimeRangeChange }) {
  const rangeOptions = [
    { id: 'year', label: '1 an' },
    { id: '5years', label: '5 ans' },
    { id: '10years', label: '10 ans' },
    { id: 'all', label: 'Historique complet (1982-Présent)' }
  ];

  return (
    <div className="selector-group">
      <label htmlFor="time-range-select">Période Temporelle:</label>
      <select
        id="time-range-select"
        value={selectedTimeRange}
        onChange={(e) => onTimeRangeChange(e.target.value)}
        className="selector"
      >
        {rangeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

TimeRangeSelector.propTypes = {
  timeRanges: PropTypes.object.isRequired,
  selectedTimeRange: PropTypes.string.isRequired,
  onTimeRangeChange: PropTypes.func.isRequired
};

export default TimeRangeSelector;
