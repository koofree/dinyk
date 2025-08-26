/**
 * Vitest Global Test Setup
 * This file is executed once before all test files
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

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