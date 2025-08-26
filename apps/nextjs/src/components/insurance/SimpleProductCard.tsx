"use client";

import React from "react";

import type { InsuranceProduct } from "@/app/page";

interface SimpleProductCardProps {
  product: InsuranceProduct;
  tranches: Tranche[];
  onViewTranches: () => void;
}

export const SimpleProductCard: React.FC<SimpleProductCardProps> = ({
  product,
  tranches,
  onViewTranches,
}) => {
  // Display all product properties dynamically
  const productName = product.name;

  // Calculate aggregated statistics
  const totalTranches = tranches.length;

  // Calculate premium range
  const premiumRates = tranches.map((t) => t.premiumRateBps ?? 0);
  const minPremium =
    premiumRates.length > 0 ? Math.min(...premiumRates) / 100 : 0;
  const maxPremium =
    premiumRates.length > 0 ? Math.max(...premiumRates) / 100 : 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-xl font-semibold text-white">
            {productName}
          </h3>
          <p className="text-sm text-gray-400">
            Product ID: {product.productId}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            product.active
              ? "bg-green-900 text-green-300"
              : "bg-gray-700 text-gray-400"
          }`}
        >
          {product.active ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Product Metadata */}
      <div className="mb-4 space-y-2">
        {product.metadataHash && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Metadata Hash:</span>
            <span className="ml-2 font-mono">
              {product.metadataHash.slice(0, 10)}...
            </span>
          </div>
        )}
        {product.createdAt && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Created:</span>
            <span className="ml-2">
              {new Date(product.createdAt * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs text-gray-500">Tranches</p>
          <p className="text-lg font-semibold text-white">
            {totalTranches}{" "}
            <span className="text-sm text-gray-400">/ {totalTranches}</span>
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-500">Premium Range</p>
          <p className="text-lg font-semibold text-blue-400">
            {minPremium.toFixed(1)}-{maxPremium.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tranches Preview */}
      {tranches.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-gray-500">Available Tranches</p>
          <div className="flex flex-wrap gap-2">
            {tranches.slice(0, 3).map((tranche) => (
              <div
                key={tranche.trancheId}
                className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300"
              >
                #{tranche.trancheId} -{" "}
                {(tranche.premiumRateBps / 100).toFixed(1)}%
              </div>
            ))}
            {tranches.length > 3 && (
              <div className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
                +{tranches.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Product Properties (Debug) */}
      <details className="mb-4">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400">
          View All Properties
        </summary>
        <div className="mt-2 rounded bg-gray-900 p-2 text-xs">
          <pre className="overflow-x-auto text-gray-400">
            {JSON.stringify(
              product,
              (key, value) =>
                typeof value === "bigint" ? value.toString() : value,
              2,
            )}
          </pre>
        </div>
      </details>

      {/* Action Button */}
      <button
        onClick={onViewTranches}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
      >
        View Tranches ({totalTranches})
      </button>
    </div>
  );
};
