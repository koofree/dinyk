import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';

const ABI = [
  {
    "inputs": [],
    "name": "getActiveProducts",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "productId", "type": "uint256"}],
    "name": "getProduct",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "productId", "type": "uint256"},
          {"internalType": "bytes32", "name": "metadataHash", "type": "bytes32"},
          {"internalType": "bool", "name": "active", "type": "bool"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
          {"internalType": "uint256[]", "name": "trancheIds", "type": "uint256[]"}
        ],
        "internalType": "struct ProductCatalog.Product",
        "name": "product",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "trancheId", "type": "uint256"}],
    "name": "getTranche",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "trancheId", "type": "uint256"},
          {"internalType": "uint256", "name": "productId", "type": "uint256"},
          {"internalType": "enum ProductCatalog.TriggerType", "name": "triggerType", "type": "uint8"},
          {"internalType": "uint256", "name": "threshold", "type": "uint256"},
          {"internalType": "uint256", "name": "maturityTimestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "premiumRateBps", "type": "uint256"},
          {"internalType": "uint256", "name": "perAccountMin", "type": "uint256"},
          {"internalType": "uint256", "name": "perAccountMax", "type": "uint256"},
          {"internalType": "uint256", "name": "trancheCap", "type": "uint256"},
          {"internalType": "uint256", "name": "oracleRouteId", "type": "uint256"},
          {"internalType": "bool", "name": "active", "type": "bool"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
          {"internalType": "uint256[]", "name": "roundIds", "type": "uint256[]"}
        ],
        "internalType": "struct ProductCatalog.TrancheSpec",
        "name": "tranche",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
      chainId: 1001,
      name: 'Kaia Kairos'
    });

    const contract = new ethers.Contract(PRODUCT_CATALOG_ADDRESS, ABI, provider);

    // Get active products
    const activeIds = await contract.getActiveProducts();
    const productIds = activeIds.map((id: bigint) => Number(id));

    // Get product details
    const products = [];
    for (const id of productIds) {
      const product = await contract.getProduct(id);
      const tranches = [];
      
      // Get tranches for this product
      for (const trancheId of product.trancheIds) {
        const tranche = await contract.getTranche(trancheId);
        tranches.push({
          trancheId: Number(tranche.trancheId),
          productId: Number(tranche.productId),
          triggerType: Number(tranche.triggerType),
          threshold: tranche.threshold.toString(),
          premiumRateBps: Number(tranche.premiumRateBps),
          active: tranche.active,
          roundIds: tranche.roundIds.map((id: bigint) => Number(id))
        });
      }
      
      products.push({
        productId: Number(product.productId),
        active: product.active,
        trancheIds: product.trancheIds.map((id: bigint) => Number(id)),
        tranches
      });
    }

    return NextResponse.json({
      success: true,
      contractAddress: PRODUCT_CATALOG_ADDRESS,
      activeProductIds: productIds,
      products
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}