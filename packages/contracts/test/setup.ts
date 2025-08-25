import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.ethereum
global.window = global.window || {};
(global.window as any).ethereum = {
  isMetaMask: true,
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  selectedAddress: null,
  chainId: '0x3E9', // Kaia testnet
};

// Mock environment variables
process.env.NEXT_PUBLIC_CHAIN_ID = '1001';
process.env.NEXT_PUBLIC_RPC_URL = 'https://public-en-kairos.node.kaia.io';
process.env.NEXT_PUBLIC_REGISTRY_ADDRESS = '0x0000760e713fed5b6F866d3Bad87927337DF61c0';
process.env.NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';
process.env.NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS = '0x147f4660515aE91c81FdB43Cf743C6faCACa9903';
process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS = '0x563e95673d4210148eD59eDb6310AC7d488F5Ec0';
process.env.NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS = '0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D';
process.env.NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS = '0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37';
process.env.NEXT_PUBLIC_USDT_ADDRESS = '0x53232164780a589dfAe08fB16D1962bD78591Aa0';