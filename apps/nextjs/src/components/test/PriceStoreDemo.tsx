"use client";

import { usePrice, usePriceStore, usePriceValues } from "@dinsure/contracts";

export function PriceStoreDemo() {
  // Method 1: Get all prices with full data
  const { btc, eth, kaia, refetch, setRefreshInterval } = usePriceStore();

  // Method 2: Get a specific price
  const btcOnly = usePrice('btc');

  // Method 3: Get just the values
  const prices = usePriceValues();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Price Store Demo</h2>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Method 1: Full Store Access</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">BTC</p>
            <p className="font-mono">
              ${btc.loading ? "Loading..." : btc.value.toLocaleString()}
            </p>
            {btc.error && <p className="text-red-500 text-sm">{btc.error.message}</p>}
            {btc.lastUpdate && (
              <p className="text-sm text-gray-400">
                Updated: {new Date(btc.lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">ETH</p>
            <p className="font-mono">
              ${eth.loading ? "Loading..." : eth.value.toLocaleString()}
            </p>
            {eth.error && <p className="text-red-500 text-sm">{eth.error.message}</p>}
            {eth.lastUpdate && (
              <p className="text-sm text-gray-400">
                Updated: {new Date(eth.lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">KAIA</p>
            <p className="font-mono">
              ${kaia.loading ? "Loading..." : kaia.value.toFixed(4)}
            </p>
            {kaia.error && <p className="text-red-500 text-sm">{kaia.error.message}</p>}
            {kaia.lastUpdate && (
              <p className="text-sm text-gray-400">
                Updated: {new Date(kaia.lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Method 2: Single Price Access</h3>
        <p>BTC (using usePrice): ${btcOnly.value.toLocaleString()}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Method 3: Values Only</h3>
        <p>Quick access: BTC=${prices.btc.toLocaleString()}, ETH=${prices.eth.toLocaleString()}, KAIA=${prices.kaia.toFixed(4)}</p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Manual Refetch
        </button>
        
        <button
          onClick={() => setRefreshInterval(1000)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Fast Updates (1s)
        </button>
        
        <button
          onClick={() => setRefreshInterval(10000)}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Normal Updates (10s)
        </button>
      </div>
    </div>
  );
}