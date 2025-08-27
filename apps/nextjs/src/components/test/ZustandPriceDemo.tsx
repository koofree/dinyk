"use client";

import { useEffect } from "react";
import { usePriceStore } from "@dinsure/contracts";

export function ZustandPriceDemo() {
  // Simple direct access to state
  const btc = usePriceStore((state) => state.btc);
  const eth = usePriceStore((state) => state.eth);
  const kaia = usePriceStore((state) => state.kaia);
  
  // Access actions
  const fetchPrices = usePriceStore((state) => state.fetchPrices);
  const startAutoRefresh = usePriceStore((state) => state.startAutoRefresh);
  const stopAutoRefresh = usePriceStore((state) => state.stopAutoRefresh);
  const setRefreshInterval = usePriceStore((state) => state.setRefreshInterval);
  
  // Get refresh interval
  const refreshInterval = usePriceStore((state) => state.refreshInterval);
  const intervalId = usePriceStore((state) => state.intervalId);

  // Start auto-refresh on mount
  useEffect(() => {
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Zustand Price Store Demo (Much Simpler!)</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800 rounded">
          <p className="text-sm text-gray-400">BTC</p>
          <p className="text-2xl font-mono">
            ${btc.value.toLocaleString()}
          </p>
          {btc.loading && <p className="text-xs text-blue-400">Loading...</p>}
          {btc.error && <p className="text-xs text-red-400">Error</p>}
          {btc.lastUpdate && (
            <p className="text-xs text-gray-500">
              {new Date(btc.lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <p className="text-sm text-gray-400">ETH</p>
          <p className="text-2xl font-mono">
            ${eth.value.toLocaleString()}
          </p>
          {eth.loading && <p className="text-xs text-blue-400">Loading...</p>}
          {eth.error && <p className="text-xs text-red-400">Error</p>}
          {eth.lastUpdate && (
            <p className="text-xs text-gray-500">
              {new Date(eth.lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-800 rounded">
          <p className="text-sm text-gray-400">KAIA</p>
          <p className="text-2xl font-mono">
            ${kaia.value.toFixed(4)}
          </p>
          {kaia.loading && <p className="text-xs text-blue-400">Loading...</p>}
          {kaia.error && <p className="text-xs text-red-400">Error</p>}
          {kaia.lastUpdate && (
            <p className="text-xs text-gray-500">
              {new Date(kaia.lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-900 rounded">
        <p className="text-sm text-gray-400">Status</p>
        <p>Auto-refresh: {intervalId ? "Active" : "Stopped"}</p>
        <p>Interval: {refreshInterval / 1000} seconds</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => fetchPrices()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch Now
        </button>
        
        <button
          onClick={() => startAutoRefresh()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Start Auto
        </button>
        
        <button
          onClick={() => stopAutoRefresh()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop Auto
        </button>
        
        <button
          onClick={() => setRefreshInterval(5000)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Fast (5s)
        </button>
        
        <button
          onClick={() => setRefreshInterval(30000)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Normal (30s)
        </button>
      </div>
    </div>
  );
}