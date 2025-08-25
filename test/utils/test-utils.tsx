/**
 * Test Utilities for React Testing
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Web3Provider } from '@dinsure/contracts';
import { ContractProvider } from '@dinsure/contracts';
import { vi } from 'vitest';

// Mock providers for testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Web3Provider>
      <ContractProvider>
        {children}
      </ContractProvider>
    </Web3Provider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockProduct = (overrides = {}) => ({
  productId: 1,
  name: 'BTC Price Protection',
  description: 'Protects against BTC price drops',
  active: true,
  ...overrides,
});

export const mockTranche = (overrides = {}) => ({
  trancheId: 1,
  productId: 1,
  name: 'BTC -10% Protection',
  triggerType: 0,
  threshold: '54000000000000000000000', // 54000 in wei
  premiumRateBps: 500,
  trancheCap: '100000000000', // 100000 USDT in wei
  maturityTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  perAccountMin: '100000000', // 100 USDT
  perAccountMax: '10000000000', // 10000 USDT
  active: true,
  ...overrides,
});

export const mockRound = (overrides = {}) => ({
  roundId: 1,
  trancheId: 1,
  state: 1, // OPEN
  salesStartTime: Math.floor(Date.now() / 1000) - 3600,
  salesEndTime: Math.floor(Date.now() / 1000) + 3600,
  matchedAmount: '0',
  ...overrides,
});

// Mock contract responses
export const mockContractCall = (contract: any, method: string, response: any) => {
  if (!contract[method]) {
    contract[method] = vi.fn();
  }
  contract[method].mockResolvedValue(response);
};

// Mock transaction receipt
export const mockTransactionReceipt = (overrides = {}) => ({
  transactionHash: '0x' + '1'.repeat(64),
  blockNumber: 12345678,
  blockHash: '0x' + '2'.repeat(64),
  gasUsed: BigInt(150000),
  status: 1,
  ...overrides,
});

// Mock Web3 provider
export const mockWeb3Provider = () => ({
  isConnected: true,
  account: '0x' + '3'.repeat(40),
  signer: {
    getAddress: vi.fn().mockResolvedValue('0x' + '3'.repeat(40)),
    signMessage: vi.fn().mockResolvedValue('0xsignature'),
    sendTransaction: vi.fn().mockResolvedValue({
      hash: '0x' + '4'.repeat(64),
      wait: vi.fn().mockResolvedValue(mockTransactionReceipt()),
    }),
  },
  provider: {
    getNetwork: vi.fn().mockResolvedValue({ chainId: 1001 }),
    getBalance: vi.fn().mockResolvedValue(BigInt(1000000000000000000)), // 1 ETH
    getBlock: vi.fn().mockResolvedValue({ timestamp: Math.floor(Date.now() / 1000) }),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
  switchNetwork: vi.fn(),
});

// Wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock ethers utilities
export const mockEthers = {
  parseUnits: (value: string, decimals: number) => BigInt(Number(value) * 10 ** decimals),
  formatUnits: (value: bigint, decimals: number) => (Number(value) / 10 ** decimals).toString(),
  parseEther: (value: string) => BigInt(Number(value) * 10 ** 18),
  formatEther: (value: bigint) => (Number(value) / 10 ** 18).toString(),
  ZeroAddress: '0x0000000000000000000000000000000000000000',
  keccak256: (value: string) => '0x' + '5'.repeat(64),
  toUtf8Bytes: (value: string) => new Uint8Array(Buffer.from(value, 'utf8')),
};