"use client";

import React from "react";
import type { Product } from "@dinsure/contracts";

interface TrancheFilters {
  insuranceProduct: number | null;
  status: 'all' | 'active' | 'open' | 'settling';
}

interface TrancheFiltersProps {
  filters: TrancheFilters;
  products: Product[];
  onFilterChange: (filters: TrancheFilters) => void;
}

export const TrancheFilters: React.FC<TrancheFiltersProps> = ({
  filters,
  products,
  onFilterChange
}) => {
  const handleInsuranceChange = (value: string) => {
    const productId = value === 'all' ? null : parseInt(value);
    onFilterChange({ ...filters, insuranceProduct: productId });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ 
      ...filters, 
      status: value as 'all' | 'active' | 'open' | 'settling' 
    });
  };

  const clearFilters = () => {
    onFilterChange({ insuranceProduct: null, status: 'all' });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Insurance Product Filter */}
        <div>
          <label className="block text-white font-medium mb-2">Insurance</label>
          <select
            value={filters.insuranceProduct || 'all'}
            onChange={(e) => handleInsuranceChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Products</option>
            {products.map(product => (
              <option key={product.productId} value={product.productId}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-white font-medium mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="open">Open for Sales</option>
            <option value="settling">Settling</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div>
          <button
            onClick={clearFilters}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors w-full md:w-auto"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {(filters.insuranceProduct || filters.status !== 'all') && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-gray-400">Active filters:</span>
          {filters.insuranceProduct && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
              {products.find(p => p.productId === filters.insuranceProduct)?.name || 'Unknown Product'}
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs capitalize">
              {filters.status}
            </span>
          )}
        </div>
      )}
    </div>
  );
};