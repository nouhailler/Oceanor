import { useState, useEffect } from 'react';
import useErddapData from './hooks/useErddapData';
import useOfflineCache from './hooks/useOfflineCache';
import { generateCacheKey } from './hooks/useOfflineCache';
import { registerServiceWorker, isPWA } from './utils/pwaUtils';
import Header from './components/Header';
import Controls from './components/Controls';
import SSTChart from './components/SSTChart';
import DataInfo from './components/DataInfo';
import './App.css';

function App() {
  const {
    data,
    loading,
    error,
    lastUpdated,
    isOffline,
    selectedZone,
    selectedTimeRange,
    zones,
    timeRanges,
    handleZoneChange,
    handleTimeRangeChange,
    refreshData
  } = useErddapData('nino34', '5years');

  const { saveCache, getCached } = useOfflineCache();
  const [pwaPrompt, setPwaPrompt] = useState(null);

  // Register service worker
  useEffect(() => {
    registerServiceWorker();
    
    // Check if we should show PWA install prompt
    const checkPwaPrompt = () => {
      if ('BeforeInstallPromptEvent' in window) {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          setPwaPrompt(e);
        });
      }
    };
    
    checkPwaPrompt();
  }, []);

  // Cache data when fetched
  useEffect(() => {
    if (data.sst.length > 0 && !loading) {
      const cacheKey = generateCacheKey(selectedZone, selectedTimeRange);
      saveCache(cacheKey, data);
    }
  }, [data, loading, selectedZone, selectedTimeRange, saveCache]);

  // Try to load cached data when offline
  useEffect(() => {
    if (isOffline && data.sst.length === 0 && !loading) {
      const cacheKey = generateCacheKey(selectedZone, selectedTimeRange);
      const cachedData = getCached(cacheKey);
      if (cachedData) {
        console.log('Loaded cached data for', selectedZone, selectedTimeRange);
      }
    }
  }, [isOffline, data.sst.length, loading, selectedZone, selectedTimeRange, getCached]);

  const handleInstallPWA = () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      pwaPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted');
        }
        setPwaPrompt(null);
      });
    }
  };

  const dataPointCount = data.sst.length;

  return (
    <div className="app">
      <Header />
      
      {error && (
        <div className="error-banner">
          ⚠️ Erreur: {error}
          <button onClick={refreshData} className="btn btn-retry">
            Réessayer
          </button>
        </div>
      )}

      <Controls
        zones={zones}
        selectedZone={selectedZone}
        onZoneChange={handleZoneChange}
        timeRanges={timeRanges}
        selectedTimeRange={selectedTimeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={refreshData}
      />

      <main className="main-content">
        <SSTChart
          sstData={data.sst}
          anomData={data.anom}
          loading={loading}
          isOffline={isOffline}
        />
        
        <DataInfo
          lastUpdated={lastUpdated}
          isOffline={isOffline}
          dataPoints={dataPointCount}
        />
      </main>

      {/* PWA Install Prompt */}
      {!isPWA() && pwaPrompt && (
        <div className="pwa-prompt">
          <p>Installer cette application sur votre écran d'accueil pour un accès rapide ?</p>
          <div className="pwa-prompt-actions">
            <button onClick={handleInstallPWA} className="btn btn-primary">
              Installer
            </button>
            <button onClick={() => setPwaPrompt(null)} className="btn btn-secondary">
              Plus tard
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>
          Données: NOAA OISST v2.1 | ERDDAP CoastWatch | 
          Baseline: 1991-2020
        </p>
      </footer>
    </div>
  );
}

export default App;
