"use client";

import { useEffect, useState } from "react";
import { useContracts, useProductManagement } from "@dinsure/contracts";

export default function TestDataPage() {
  const { productCatalog, tranchePoolFactory, isInitialized, error } = useContracts();
  const { getProducts, getActiveTranches } = useProductManagement();
  const [data, setData] = useState<any>({
    loading: true,
    products: [],
    activeTranches: [],
    trancheDetails: [],
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized) {
        console.log("Contracts not initialized yet");
        return;
      }

      try {
        console.log("Starting data fetch...");
        
        // 1. Get products
        console.log("Fetching products...");
        const products = await getProducts();
        console.log("Products fetched:", products);
        
        // 2. Get active tranches
        console.log("Fetching active tranches...");
        const activeTrancheIds = await getActiveTranches();
        console.log("Active tranche IDs:", activeTrancheIds);
        
        // 3. Get tranche details
        console.log("Fetching tranche details...");
        const trancheDetails = [];
        for (const id of activeTrancheIds) {
          try {
            console.log(`Fetching tranche ${id}...`);
            const tranche = await productCatalog?.getTranche(id);
            console.log(`Tranche ${id} data:`, tranche);
            trancheDetails.push({ id, data: tranche });
          } catch (err) {
            console.error(`Error fetching tranche ${id}:`, err);
            trancheDetails.push({ id, error: err.message });
          }
        }
        
        // 4. Get next product ID
        let nextProductId = null;
        try {
          nextProductId = await productCatalog?.nextProductId();
          console.log("Next product ID:", nextProductId?.toString());
        } catch (err) {
          console.error("Error getting next product ID:", err);
        }
        
        // 5. Get pool count
        let poolCount = null;
        try {
          poolCount = await tranchePoolFactory?.getPoolCount();
          console.log("Pool count:", poolCount?.toString());
        } catch (err) {
          console.error("Error getting pool count:", err);
        }
        
        setData({
          loading: false,
          products,
          activeTranches: activeTrancheIds,
          trancheDetails,
          nextProductId: nextProductId?.toString(),
          poolCount: poolCount?.toString(),
          error: null
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }));
      }
    };

    fetchData();
  }, [isInitialized, productCatalog, tranchePoolFactory, getProducts, getActiveTranches]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-white">Contract Data Test</h1>
        
        {/* Contract Status */}
        <div className="mb-6 rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-blue-400">Contract Status</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>Initialized: <span className={isInitialized ? "text-green-400" : "text-red-400"}>{String(isInitialized)}</span></p>
            <p>ProductCatalog: <span className={productCatalog ? "text-green-400" : "text-red-400"}>{productCatalog ? "✓" : "✗"}</span></p>
            <p>TranchePoolFactory: <span className={tranchePoolFactory ? "text-green-400" : "text-red-400"}>{tranchePoolFactory ? "✓" : "✗"}</span></p>
            {error && <p className="text-red-400">Error: {error.message}</p>}
          </div>
        </div>

        {/* Loading State */}
        {data.loading && (
          <div className="rounded-lg bg-gray-800 p-6">
            <p className="text-gray-400">Loading data...</p>
          </div>
        )}

        {/* Error State */}
        {data.error && (
          <div className="mb-6 rounded-lg bg-red-900 p-6">
            <h2 className="mb-2 text-xl font-semibold text-red-400">Error</h2>
            <p className="text-red-300">{data.error}</p>
          </div>
        )}

        {/* Data Display */}
        {!data.loading && !data.error && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-green-400">Summary</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Products Found: <span className="text-white font-bold">{data.products.length}</span></p>
                <p>Active Tranches: <span className="text-white font-bold">{data.activeTranches.length}</span></p>
                <p>Next Product ID: <span className="text-white font-bold">{data.nextProductId || "N/A"}</span></p>
                <p>Pool Count: <span className="text-white font-bold">{data.poolCount || "N/A"}</span></p>
              </div>
            </div>

            {/* Products */}
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-yellow-400">Products ({data.products.length})</h2>
              <pre className="overflow-x-auto text-xs text-gray-300">
                {JSON.stringify(data.products, null, 2)}
              </pre>
            </div>

            {/* Active Tranche IDs */}
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-purple-400">Active Tranche IDs ({data.activeTranches.length})</h2>
              <div className="flex flex-wrap gap-2">
                {data.activeTranches.map(id => (
                  <span key={id} className="rounded bg-purple-600 px-3 py-1 text-sm text-white">
                    Tranche #{id}
                  </span>
                ))}
              </div>
            </div>

            {/* Tranche Details */}
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-cyan-400">Tranche Details</h2>
              {data.trancheDetails.map((tranche, idx) => (
                <div key={idx} className="mb-4 rounded bg-gray-700 p-4">
                  <h3 className="mb-2 font-semibold text-cyan-300">Tranche #{tranche.id}</h3>
                  {tranche.error ? (
                    <p className="text-red-400">Error: {tranche.error}</p>
                  ) : (
                    <pre className="overflow-x-auto text-xs text-gray-300">
                      {JSON.stringify(tranche.data, (key, value) => 
                        typeof value === 'bigint' ? value.toString() : value
                      , 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Console Instructions */}
        <div className="mt-8 rounded-lg bg-blue-900 p-6">
          <h2 className="mb-2 text-lg font-semibold text-blue-300">📋 Check Browser Console</h2>
          <p className="text-sm text-blue-200">
            Open your browser's developer console (F12) to see detailed logs of the data fetching process.
          </p>
        </div>
      </div>
    </div>
  );
}