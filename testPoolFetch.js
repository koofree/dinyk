const { ethers } = require('ethers');

const POOL_FACTORY_ADDRESS = '0x563e95673d4210148eD59eDb6310AC7d488F5Ec0';

const FACTORY_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "trancheId", "type": "uint256"}],
    "name": "getTranchePool",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const POOL_ABI = [
  {
    "inputs": [],
    "name": "poolAccounting",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "totalAssets", "type": "uint256"},
          {"internalType": "uint256", "name": "totalShares", "type": "uint256"},
          {"internalType": "uint256", "name": "lockedAssets", "type": "uint256"},
          {"internalType": "uint256", "name": "premiumReserve", "type": "uint256"},
          {"internalType": "uint256", "name": "navPerShare", "type": "uint256"}
        ],
        "internalType": "struct TranchePoolCore.PoolAccounting",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testPools() {
  const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
    chainId: 1001,
    name: 'Kaia Kairos'
  });

  const factory = new ethers.Contract(POOL_FACTORY_ADDRESS, FACTORY_ABI, provider);

  console.log('Testing pool fetching...\n');

  for (let trancheId = 1; trancheId <= 5; trancheId++) {
    try {
      const poolAddress = await factory.getTranchePool(trancheId);
      console.log(`Tranche ${trancheId}: Pool address = ${poolAddress}`);
      
      if (poolAddress === ethers.ZeroAddress) {
        console.log(`  No pool created yet\n`);
        continue;
      }

      const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
      const accounting = await pool.poolAccounting();
      
      const totalAssets = ethers.formatUnits(accounting.totalAssets, 6);
      const lockedAssets = ethers.formatUnits(accounting.lockedAssets, 6);
      const availableAssets = Number(totalAssets) - Number(lockedAssets);
      const utilization = Number(totalAssets) > 0 ? (Number(lockedAssets) / Number(totalAssets) * 100) : 0;
      
      console.log(`  Total Assets: ${totalAssets} USDT`);
      console.log(`  Locked Assets: ${lockedAssets} USDT`);
      console.log(`  Available: ${availableAssets.toFixed(6)} USDT`);
      console.log(`  Utilization: ${utilization.toFixed(2)}%\n`);
      
    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }
  }
}

testPools().catch(console.error);