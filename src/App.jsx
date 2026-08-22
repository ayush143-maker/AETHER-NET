import { useState, useEffect } from 'react';
import GlobalMatrix from './subpages/GlobalMatrix';
import ThreatAnalytics from './subpages/ThreatAnalytics';
import TerminalConsole from './components/TerminalConsole';
import {
  fetchDomainMetadata,
  generateTraceroutePipeline,
  validateInput,
} from './services/networkService';

/**
 * Main Orchestration Hub
 * Manages global state, tab navigation, and trace pipeline
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [networkData, setNetworkData] = useState(null);
  const [routingHops, setRoutingHops] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState('IDLE');
  const [validationError, setValidationError] = useState('');
  const [matrixRain, setMatrixRain] = useState([]);
  
  // Generate matrix rain background columns
  useEffect(() => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]';
    const columns = Array.from({ length: 15 }, (_, i) => ({
      left: `${(i / 15) * 100}%`,
      text: Array.from({ length: 30 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join(''),
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 5,
    }));
    setMatrixRain(columns);
  }, []);
  
  const addLog = (message) => {
    setConsoleLogs(prev => [...prev, message]);
  };
  
  // Main trace pipeline
  const handleSearch = async (e) => {
    e.preventDefault();
    
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setValidationError('Enter a target to begin trace');
      return;
    }
    
    const validation = validateInput(trimmed);
    if (!validation.valid) {
      setValidationError('Invalid input. Use domain (google.com) or IPv4 (8.8.8.8)');
      return;
    }
    
    setValidationError('');
    setSystemStatus('RESOLVING');
    setNetworkData(null);
    setRoutingHops(null);
    setConsoleLogs([]);
    
    try {
      // Phase 1: DNS Resolution
      addLog(`> INITIATING DNS RESOLUTION FOR ${trimmed}`);
      addLog(`> QUERY TYPE: ${validation.type.toUpperCase()}`);
      await sleep(400);
      
      addLog('> ESTABLISHING SECURE CONNECTION TO GEOIP API...');
      await sleep(300);
      
      addLog('> SENDING A RECORD QUERY...');
      await sleep(250);
      
      const metadata = await fetchDomainMetadata(trimmed);
      setNetworkData(metadata);
      
      addLog('✓ DNS RESOLUTION COMPLETE');
      addLog(`├─ TARGET IP: ${metadata.ip}`);
      addLog(`├─ GEO: ${metadata.city}, ${metadata.region}, ${metadata.country}`);
      addLog(`├─ COORDS: ${metadata.lat.toFixed(4)}°N, ${metadata.lon.toFixed(4)}°E`);
      addLog(`├─ ISP: ${metadata.isp}`);
      addLog(`└─ AS: ${metadata.as}`);
      await sleep(500);
      
      // Phase 2: Traceroute
      setSystemStatus('TRACING');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('> INITIATING MULTI-HOP TRACEROUTE PIPELINE');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await sleep(400);
      
      const pipeline = generateTraceroutePipeline(
        metadata.ip, metadata.lat, metadata.lon
      );
      
      addLog(`> SOURCE REGION: ${pipeline.sourceRegion}`);
      addLog(`> TARGET REGION: ${pipeline.targetRegion}`);
      addLog(`> PLANNED HOPS: ${pipeline.hops.length}`);
      await sleep(300);
      
      // Stream hops progressively
      for (let i = 0; i < pipeline.hops.length; i++) {
        const hop = pipeline.hops[i];
        await sleep(450);
        
        addLog('');
        addLog(`> HOP ${hop.hop}: ${hop.name}`);
        addLog(`  ├─ IP: ${hop.ip}`);
        addLog(`  ├─ LATENCY: ${hop.latency}ms`);
        addLog(`  ├─ ISP: ${hop.isp}`);
        if (hop.asn) addLog(`  ├─ ASN: ${hop.asn}`);
        addLog(`  └─ TYPE: ${hop.type}`);
        
        // Progressive map update
        setRoutingHops({
          ...pipeline,
          hops: pipeline.hops.slice(0, i + 1),
        });
      }
      
      await sleep(400);
      
      // Phase 3: Complete
      setSystemStatus('SUCCESS');
      addLog('');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('✓ TRACEROUTE ANALYSIS COMPLETE');
      addLog(`├─ TOTAL HOPS: ${pipeline.hops.length}`);
      addLog(`├─ TOTAL LATENCY: ${pipeline.totalLatency}ms`);
      addLog(`├─ TOTAL DISTANCE: ${pipeline.totalDistance}km`);
      addLog(`└─ ESTIMATED THROUGHPUT: ${pipeline.throughput}Mbps`);
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('> ROUTE VISUALIZATION ACTIVE');
      addLog('> TELEMETRY STREAM ONLINE');
      addLog('> ENTER NEW TARGET TO RETRACE');
      
      setRoutingHops(pipeline);
    } catch (error) {
      setSystemStatus('ERROR');
      addLog('');
      addLog(`✗ ERROR: ${error.message}`);
      addLog('> TRACE TERMINATED');
      addLog('> SYSTEM STANDING BY');
    }
  };
  
  const handleClear = () => {
    setSearchQuery('');
    setNetworkData(null);
    setRoutingHops(null);
    setConsoleLogs([]);
    setSystemStatus('IDLE');
    setValidationError('');
  };
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const statusConfig = {
    IDLE: { color: 'text-gray-500', icon: '⏸', label: 'STANDING BY' },
    RESOLVING: { color: 'text-yellow-400', icon: '⟳', label: 'RESOLVING DNS' },
    TRACING: { color: 'text-cyan-400', icon: '📡', label: 'TRACING ROUTE' },
    SUCCESS: { color: 'text-green-400', icon: '✓', label: 'TRACE COMPLETE' },
    ERROR: { color: 'text-red-400', icon: '✗', label: 'TRACE FAILED' },
  };
  
  const status = statusConfig[systemStatus];
  const isBusy = systemStatus === 'RESOLVING' || systemStatus === 'TRACING';
  
  return (
    <div className="min-h-screen bg-[#05050a] text-white relative overflow-hidden">
      {/* Matrix rain background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {matrixRain.map((col, idx) => (
          <div
            key={idx}
            className="matrix-column"
            style={{
              left: col.left,
              animationDuration: `${col.duration}s`,
              animationDelay: `${col.delay}s`,
            }}
          >
            {col.text}
          </div>
        ))}
      </div>
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-transparent via-[#05050a]/80 to-[#05050a]" />
      
      {/* Main container */}
      <div className="relative z-10 container mx-auto px-3 md:px-6 py-4 md:py-6 max-w-[1600px]">
        {/* Header */}
        <header className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-fuchsia-400 bg-clip-text text-transparent leading-tight">
                WEB TRAFFIC MATRIX
              </h1>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1 font-mono tracking-wider">
                GLOBAL ROUTING TELEMETRY & NETWORK ANALYTICS v3.2
              </p>
            </div>
            
            <div className={`
              flex items-center gap-3 bg-black/80 border border-cyan-500/30 
              rounded-lg px-4 py-2 backdrop-blur-sm self-start md:self-auto
            `}>
              <div className={`text-xl md:text-2xl ${
                isBusy ? 'animate-spin' : ''
              }`}>
                {status.icon}
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  System Status
                </div>
                <div className={`text-xs md:text-sm font-bold ${status.color} tracking-wider`}>
                  {status.label}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-cyan-500/20 mb-4">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`
                px-4 md:px-6 py-2.5 font-mono text-[11px] md:text-xs tracking-widest
                transition-all relative border-b-2 uppercase
                ${activeTab === 'matrix'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-gray-500 border-transparent hover:text-cyan-300'}
              `}
            >
              <span className="flex items-center gap-1.5">
                <span>🌐</span>
                <span>Global Matrix</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('threats')}
              className={`
                px-4 md:px-6 py-2.5 font-mono text-[11px] md:text-xs tracking-widest
                transition-all relative border-b-2 uppercase
                ${activeTab === 'threats'
                  ? 'text-fuchsia-400 border-fuchsia-400'
                  : 'text-gray-500 border-transparent hover:text-fuchsia-300'}
              `}
            >
              <span className="flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Threat Analytics</span>
              </span>
            </button>
          </div>
          
          {/* Search input */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-mono text-sm select-none">
                  {'>'}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="target:// google.com or 8.8.8.8"
                  disabled={isBusy}
                  className="w-full bg-black/80 border border-green-500/30 rounded-lg pl-7 pr-4 py-2.5 md:py-3 text-green-400 font-mono text-xs md:text-sm placeholder-green-700/50 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 disabled:opacity-50 transition-all"
                  spellCheck="false"
                  autoComplete="off"
                />
                {validationError && (
                  <div className="absolute left-0 -bottom-5 text-red-400 text-[10px] font-mono">
                    ⚠ {validationError}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isBusy || !searchQuery.trim()}
                  className="flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold rounded-lg hover:from-green-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono text-xs md:text-sm tracking-wider shadow-lg shadow-green-500/20 uppercase"
                >
                  {isBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⟳</span>
                      <span>Tracing</span>
                    </span>
                  ) : (
                    'Trace'
                  )}
                </button>
                
                {networkData && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 md:px-6 py-2.5 md:py-3 bg-red-600/10 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-600/20 transition-all font-mono text-xs md:text-sm tracking-wider uppercase"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
        </header>
        
        {/* Main grid */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tab content */}
          <div className="lg:col-span-2 bg-black/40 border border-cyan-500/20 rounded-lg backdrop-blur-sm overflow-hidden min-h-[600px]">
            {activeTab === 'matrix' ? (
              <GlobalMatrix networkData={networkData} routingHops={routingHops} />
            ) : (
              <ThreatAnalytics networkData={networkData} routingHops={routingHops} />
            )}
          </div>
          
          {/* Terminal console */}
          <div className="min-h-[400px] lg:min-h-[600px]">
            <TerminalConsole logs={consoleLogs} status={systemStatus} />
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-6 md:mt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-600 font-mono mb-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              API: ip-api.com
            </span>
            <span>•</span>
            <span>GeoIP Database v3.2</span>
            <span>•</span>
            <span>Traceroute Engine v2.1</span>
            <span>•</span>
            <span>Vercel Edge</span>
          </div>
          <div className="text-[10px] text-gray-700 font-mono">
            Built with React + Vite + Tailwind CSS • Network Intelligence Platform
          </div>
        </footer>
      </div>
    </div>
  );
}
