/**
 * Vitest Global Test Setup
 * This file is executed once before all test files
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web3 Provider
beforeAll(() => {
  // Mock window.ethereum
  global.window = global.window || {};
  (global.window as any).ethereum = {
    isMetaMask: true,
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    selectedAddress: null,
    chainId: '0x1',
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.localStorage = localStorageMock as any;

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.sessionStorage = sessionStorageMock as any;

  // Mock fetch
  global.fetch = vi.fn();

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock crypto
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });

  // Mock console methods to reduce noise in tests
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

// Restore all mocks after tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Environment variables for testing
process.env.NEXT_PUBLIC_CHAIN_ID = '1001';
process.env.NEXT_PUBLIC_RPC_URL = 'https://public-en-kairos.node.kaia.io';
process.env.NEXT_PUBLIC_REGISTRY_ADDRESS = '0x0000760e713fed5b6F866d3Bad87927337DF61c0';
process.env.NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';
process.env.NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS = '0x147f4660515aE91c81FdB43Cf743C6faCACa9903';
process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS = '0x563e95673d4210148eD59eDb6310AC7d488F5Ec0';
process.env.NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS = '0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D';
process.env.NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS = '0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37';
process.env.NEXT_PUBLIC_USDT_ADDRESS = '0x53232164780a589dfAe08fB16D1962bD78591Aa0';

// Custom matchers
expect.extend({
  toBeValidAddress(received: string) {
    const pass = /^0x[a-fA-F0-9]{40}$/.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid Ethereum address`
          : `Expected ${received} to be a valid Ethereum address`,
    };
  },
  toBeValidTransactionHash(received: string) {
    const pass = /^0x[a-fA-F0-9]{64}$/.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid transaction hash`
          : `Expected ${received} to be a valid transaction hash`,
    };
  },
});