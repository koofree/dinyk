const { ethers } = require('ethers');
const { ProductCatalogService } = require('./packages/contracts/dist/index.cjs');

async function testService() {
  const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
    chainId: 1001,
    name: 'Kaia Kairos'
  });

  const service = new ProductCatalogService(
    '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2',
    provider
  );

  console.log('Testing ProductCatalogService with pool data...\n');

  try {
    const tranche = await service.getTranche(1);
    console.log('Tranche 1 data:');
    console.log('  Available Capacity:', tranche?.availableCapacity?.toString());
    console.log('  Utilization Rate:', tranche?.utilizationRate);
    console.log('  Pool Address:', tranche?.poolAddress);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testService().catch(console.error);