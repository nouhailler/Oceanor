import React from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fr } from 'date-fns/locale';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

/**
 * SST Chart component for displaying temperature and anomaly data
 * @param {Object} props - Component props
 * @param {Array} props.sstData - Sea Surface Temperature data
 * @param {Array} props.anomData - Anomaly data
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isOffline - Offline state
 */
function SSTChart({ sstData, anomData, loading, isOffline }) {
  // Prepare chart data
  const chartData = {
    labels: sstData.map(item => item.date),
    datasets: [
      {
        label: 'Température de surface (°C)',
        data: sstData.map(item => ({ x: item.date, y: item.value })),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'Anomalie (°C)',
        data: anomData.map(item => ({ x: item.date, y: item.value })),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const date = new Date(context.parsed.x).toLocaleDateString('fr-FR');
            return `${label}: ${value.toFixed(2)}°C (${date})`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1
      },
      title: {
        display: true,
        text: 'Évolution des températures océaniques et anomalies',
        font: {
          size: 16
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            month: 'MMM yyyy',
            year: 'yyyy'
          },
          locale: fr
        },
        title: {
          display: true,
          text: 'Date'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Température (°C)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        },
        min: Math.min(...sstData.map(d => d.value)) - 2,
        max: Math.max(...sstData.map(d => d.value)) + 2
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Anomalie (°C)'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#ef4444'
        },
        min: Math.min(...anomData.map(d => d.value), -3),
        max: Math.max(...anomData.map(d => d.value), 3)
      }
    }
  };

  if (loading && sstData.length === 0) {
    return (
      <div className="chart-container loading">
        <div className="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (sstData.length === 0) {
    return (
      <div className="chart-container empty">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {isOffline && (
        <div className="offline-banner">
          ⚠️ Mode hors-ligne - Données en cache
        </div>
      )}
      <div className="chart-wrapper">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

SSTChart.propTypes = {
  sstData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.instanceOf(Date),
      value: PropTypes.number
    })
  ).isRequired,
  anomData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.instanceOf(Date),
      value: PropTypes.number
    })
  ).isRequired,
  loading: PropTypes.bool,
  isOffline: PropTypes.bool
};

SSTChart.defaultProps = {
  loading: false,
  isOffline: false
};

export default SSTChart;
