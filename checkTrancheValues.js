const { ethers } = require('ethers');

const PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';

const ABI = [
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

async function checkTranches() {
  const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
    chainId: 1001,
    name: 'Kaia Kairos'
  });

  const contract = new ethers.Contract(PRODUCT_CATALOG_ADDRESS, ABI, provider);

  console.log('Checking tranche values from contract...\n');

  for (let trancheId = 1; trancheId <= 5; trancheId++) {
    const tranche = await contract.getTranche(trancheId);
    
    // Convert values - USDT has 6 decimals
    const trancheCap = ethers.formatUnits(tranche.trancheCap, 6);
    const perAccountMin = ethers.formatUnits(tranche.perAccountMin, 6);
    const perAccountMax = ethers.formatUnits(tranche.perAccountMax, 6);
    
    console.log(`Tranche ${trancheId}:`);
    console.log(`  - Tranche Cap: ${trancheCap} USDT`);
    console.log(`  - Per Account Min: ${perAccountMin} USDT`);
    console.log(`  - Per Account Max: ${perAccountMax} USDT`);
    console.log(`  - Premium Rate: ${Number(tranche.premiumRateBps) / 100}%`);
    console.log(`  - Active: ${tranche.active}`);
    console.log(`  - Round IDs: ${tranche.roundIds.map(id => Number(id))}`);
    console.log('');
  }
}

checkTranches().catch(console.error);