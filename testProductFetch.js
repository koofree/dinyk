const { ethers } = require('ethers');

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
  }
];

async function test() {
  const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
    chainId: 1001,
    name: 'Kaia Kairos'
  });

  const contract = new ethers.Contract(PRODUCT_CATALOG_ADDRESS, ABI, provider);

  console.log('Testing ProductCatalog at:', PRODUCT_CATALOG_ADDRESS);

  try {
    // Test getActiveProducts
    console.log('\n1. Testing getActiveProducts()...');
    const activeIds = await contract.getActiveProducts();
    console.log('Active product IDs:', activeIds.map(id => Number(id)));

    // Test getProduct(1)
    console.log('\n2. Testing getProduct(1)...');
    const product = await contract.getProduct(1);
    console.log('Product 1:');
    console.log('  - ID:', Number(product.productId));
    console.log('  - Active:', product.active);
    console.log('  - Tranche IDs:', product.trancheIds.map(id => Number(id)));
    console.log('  - MetadataHash:', product.metadataHash);

  } catch (error) {
    console.error('Error:', error);
  }
}

test();