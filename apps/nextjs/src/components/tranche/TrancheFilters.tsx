"use client";

import React from "react";
import { getProductName } from "@/utils/productHelpers";

interface Product {
  productId: number;
  metadata?: {
    name: string;
  };
}

interface TrancheFilters {
  insuranceProduct: number | null;
  status: "all" | "active" | "open" | "settling";
}

interface TrancheFiltersProps {
  filters: TrancheFilters;
  products: Product[];
  onFilterChange: (filters: TrancheFilters) => void;
}

export const TrancheFilters: React.FC<TrancheFiltersProps> = ({
  filters,
  products,
  onFilterChange,
}) => {
  const handleInsuranceChange = (value: string) => {
    const productId = value === "all" ? null : parseInt(value);
    onFilterChange({ ...filters, insuranceProduct: productId });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value as "all" | "active" | "open" | "settling",
    });
  };

  const clearFilters = () => {
    onFilterChange({ insuranceProduct: null, status: "all" });
  };

  return (
    <div className="mb-8">
      <div className="flex w-full items-end gap-4">
        {/* Insurance Product Filter */}
        <div className="flex-1">
          <label className="mb-2 block font-medium text-gray-800">
            Insurance
          </label>
          <select
            value={filters.insuranceProduct || "all"}
            onChange={(e) => handleInsuranceChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none"
            style={{
              borderRadius: "8px",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 12px center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "20px",
            }}
          >
            <option value="all">All Products</option>
            {products.map((product) => (
              <option key={product.productId} value={product.productId}>
                {getProductName(product)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <label className="mb-2 block font-medium text-gray-800">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none"
            style={{
              borderRadius: "8px",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 12px center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "20px",
            }}
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
            className="flex items-center justify-center border border-gray-300 bg-transparent px-3 py-2 text-gray-600 transition-all duration-300 hover:scale-95 hover:border-[#86D99C] hover:text-[#86D99C]"
            style={{ borderRadius: "8px", height: "42px" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 4V10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.51 15A9 9 0 1 0 6 5L1 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.insuranceProduct || filters.status !== "all") && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-gray-600">Active filters:</span>
          {filters.insuranceProduct && (
            <span className="rounded-full bg-gradient-to-r from-[#86D99C] to-[#00B1B8] px-3 py-1 text-xs text-white">
              {(() => {
                const product = products.find(
                  (p) => p.productId === filters.insuranceProduct,
                );
                return product ? getProductName(product) : "Unknown Product";
              })()}
            </span>
          )}
          {filters.status !== "all" && (
            <span className="rounded-full bg-gradient-to-r from-[#86D99C] to-[#00B1B8] px-3 py-1 text-xs capitalize text-white">
              {filters.status}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
