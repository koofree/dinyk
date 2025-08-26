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
