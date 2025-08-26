import { ethers } from "ethers";

// MetaMask error codes
export const METAMASK_ERROR_CODES = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  UNRECOGNIZED_CHAIN: 4902,
  
  // EIP-1193 Provider Errors
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  INVALID_INPUT: -32000,
  RESOURCE_NOT_FOUND: -32001,
  RESOURCE_UNAVAILABLE: -32002,
  TRANSACTION_REJECTED: -32003,
  METHOD_NOT_SUPPORTED: -32004,
  LIMIT_EXCEEDED: -32005,
  JSON_RPC_VERSION_NOT_SUPPORTED: -32006,
} as const;

// Common Web3 error patterns
export const WEB3_ERROR_PATTERNS = {
  INSUFFICIENT_FUNDS: /insufficient funds|insufficient balance|not enough funds/i,
  NONCE_TOO_LOW: /nonce too low|already known|replacement transaction underpriced/i,
  GAS_TOO_LOW: /gas too low|intrinsic gas too low|out of gas/i,
  REVERTED: /execution reverted|VM Exception|revert/i,
  TIMEOUT: /timeout|timed out/i,
  RATE_LIMIT: /rate limit|too many requests|429/i,
  CONTRACT_NOT_DEPLOYED: /contract not deployed|no contract code|contract creation code storage out of gas/i,
} as const;

export interface Web3Error extends Error {
  code?: number | string;
  reason?: string;
  data?: {
    code?: number;
    message?: string;
    originalError?: unknown;
  };
  transaction?: {
    hash?: string;
    from?: string;
    to?: string;
  };
}

export interface ErrorHandlingResult {
  userMessage: string;
  technicalDetails?: string;
  action?: 'retry' | 'switch_network' | 'install_wallet' | 'increase_gas' | 'check_balance' | 'none';
  severity: 'error' | 'warning' | 'info';
}

export class Web3ErrorHandler {
  /**
   * Main error handler for Web3/MetaMask errors
   */
  static handle(error: unknown): ErrorHandlingResult {
    console.error('[Web3ErrorHandler] Original error:', error);
    
    // Convert to Web3Error for easier handling
    const web3Error = this.normalizeError(error);
    
    // Check for MetaMask-specific errors first
    const metamaskResult = this.handleMetaMaskError(web3Error);
    if (metamaskResult) return metamaskResult;
    
    // Check for ethers.js errors
    const ethersResult = this.handleEthersError(web3Error);
    if (ethersResult) return ethersResult;
    
    // Check for common patterns
    const patternResult = this.handlePatternError(web3Error);
    if (patternResult) return patternResult;
    
    // Default error
    return {
      userMessage: "An unexpected error occurred. Please try again.",
      technicalDetails: web3Error.message,
      action: 'retry',
      severity: 'error'
    };
  }

  /**
   * Normalize various error formats into Web3Error
   */
  private static normalizeError(error: unknown): Web3Error {
    if (!error) {
      return new Error('Unknown error') as Web3Error;
    }

    if (typeof error === 'string') {
      return new Error(error) as Web3Error;
    }

    if (error instanceof Error) {
      return error as Web3Error;
    }

    // Handle various error object formats
    const errorObj = error as any;
    const normalized: Web3Error = new Error(
      errorObj.message || errorObj.reason || 'Unknown error'
    ) as Web3Error;

    // Copy relevant properties
    normalized.code = errorObj.code || errorObj.error?.code;
    normalized.reason = errorObj.reason || errorObj.error?.reason;
    normalized.data = errorObj.data || errorObj.error?.data;
    normalized.transaction = errorObj.transaction;

    return normalized;
  }

  /**
   * Handle MetaMask-specific errors
   */
  private static handleMetaMaskError(error: Web3Error): ErrorHandlingResult | null {
    const code = typeof error.code === 'number' ? error.code : parseInt(String(error.code || '0'));
    
    switch (code) {
      case METAMASK_ERROR_CODES.USER_REJECTED:
        return {
          userMessage: "Transaction cancelled by user",
          action: 'none',
          severity: 'info'
        };
      
      case METAMASK_ERROR_CODES.UNAUTHORIZED:
        return {
          userMessage: "Please connect your wallet first",
          action: 'none',
          severity: 'warning'
        };
      
      case METAMASK_ERROR_CODES.UNRECOGNIZED_CHAIN:
        return {
          userMessage: "Please switch to the correct network",
          action: 'switch_network',
          severity: 'warning'
        };
      
      case METAMASK_ERROR_CODES.CHAIN_DISCONNECTED:
      case METAMASK_ERROR_CODES.DISCONNECTED:
        return {
          userMessage: "Wallet disconnected. Please reconnect.",
          action: 'none',
          severity: 'warning'
        };
      
      case METAMASK_ERROR_CODES.INTERNAL_ERROR:
        return {
          userMessage: "Wallet encountered an internal error. Please try again.",
          technicalDetails: error.message,
          action: 'retry',
          severity: 'error'
        };
      
      case METAMASK_ERROR_CODES.INVALID_PARAMS:
        return {
          userMessage: "Invalid transaction parameters. Please check your input.",
          technicalDetails: error.message,
          action: 'none',
          severity: 'error'
        };
      
      case METAMASK_ERROR_CODES.TRANSACTION_REJECTED:
        return {
          userMessage: "Transaction was rejected. Please try again.",
          action: 'retry',
          severity: 'warning'
        };
    }
    
    return null;
  }

  /**
   * Handle ethers.js specific errors
   */
  private static handleEthersError(error: Web3Error): ErrorHandlingResult | null {
    // Check if it's an ethers error
    if (!error.message) return null;
    
    // Handle ethers error codes
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return {
        userMessage: "Insufficient balance to complete this transaction",
        action: 'check_balance',
        severity: 'error'
      };
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return {
        userMessage: "Network connection error. Please check your internet connection.",
        action: 'retry',
        severity: 'error'
      };
    }
    
    if (error.code === 'TIMEOUT') {
      return {
        userMessage: "Request timed out. Please try again.",
        action: 'retry',
        severity: 'warning'
      };
    }
    
    if (error.code === 'REPLACEMENT_UNDERPRICED') {
      return {
        userMessage: "Previous transaction is still pending. Please wait or increase gas price.",
        action: 'increase_gas',
        severity: 'warning'
      };
    }
    
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return {
        userMessage: "Cannot estimate gas. The transaction may fail.",
        technicalDetails: error.reason || error.message,
        action: 'none',
        severity: 'error'
      };
    }
    
    if (error.code === 'CALL_EXCEPTION') {
      // Parse revert reason if available
      const revertReason = error.reason || 'Transaction would revert';
      return {
        userMessage: `Transaction failed: ${this.humanizeRevertReason(revertReason)}`,
        technicalDetails: revertReason,
        action: 'none',
        severity: 'error'
      };
    }
    
    return null;
  }

  /**
   * Handle errors by pattern matching
   */
  private static handlePatternError(error: Web3Error): ErrorHandlingResult | null {
    const message = (error.message || '').toLowerCase();
    const reason = (error.reason || '').toLowerCase();
    const combined = `${message} ${reason}`;
    
    if (WEB3_ERROR_PATTERNS.INSUFFICIENT_FUNDS.test(combined)) {
      return {
        userMessage: "Insufficient funds for transaction",
        action: 'check_balance',
        severity: 'error'
      };
    }
    
    if (WEB3_ERROR_PATTERNS.NONCE_TOO_LOW.test(combined)) {
      return {
        userMessage: "Transaction already processed or pending",
        action: 'none',
        severity: 'info'
      };
    }
    
    if (WEB3_ERROR_PATTERNS.GAS_TOO_LOW.test(combined)) {
      return {
        userMessage: "Gas limit too low. Please increase gas.",
        action: 'increase_gas',
        severity: 'warning'
      };
    }
    
    if (WEB3_ERROR_PATTERNS.REVERTED.test(combined)) {
      return {
        userMessage: "Transaction reverted. Please check your input.",
        technicalDetails: error.message,
        action: 'none',
        severity: 'error'
      };
    }
    
    if (WEB3_ERROR_PATTERNS.TIMEOUT.test(combined)) {
      return {
        userMessage: "Request timed out. Please try again.",
        action: 'retry',
        severity: 'warning'
      };
    }
    
    if (WEB3_ERROR_PATTERNS.RATE_LIMIT.test(combined)) {
      return {
        userMessage: "Too many requests. Please wait a moment.",
        action: 'retry',
        severity: 'warning'
      };
    }
    
    if (WEB3_ERROR_PATTERNS.CONTRACT_NOT_DEPLOYED.test(combined)) {
      return {
        userMessage: "Contract not found on this network",
        action: 'switch_network',
        severity: 'error'
      };
    }
    
    return null;
  }

  /**
   * Convert technical revert reasons to user-friendly messages
   */
  private static humanizeRevertReason(reason: string): string {
    const reasonMap: Record<string, string> = {
      'insufficient allowance': 'Insufficient token approval',
      'transfer amount exceeds balance': 'Insufficient token balance',
      'only owner': 'Only the owner can perform this action',
      'paused': 'Contract is currently paused',
      'not open': 'Round is not open for deposits',
      'already settled': 'This round has already been settled',
      'invalid amount': 'Invalid amount entered',
      'deadline passed': 'Transaction deadline has passed',
      'slippage exceeded': 'Price changed too much during transaction',
      'minimum not met': 'Minimum amount requirement not met',
      'maximum exceeded': 'Maximum amount exceeded',
    };
    
    const lowerReason = reason.toLowerCase();
    for (const [key, value] of Object.entries(reasonMap)) {
      if (lowerReason.includes(key)) {
        return value;
      }
    }
    
    return reason;
  }

  /**
   * Check if error is due to user rejection
   */
  static isUserRejection(error: unknown): boolean {
    const web3Error = this.normalizeError(error);
    const code = typeof web3Error.code === 'number' 
      ? web3Error.code 
      : parseInt(String(web3Error.code || '0'));
    
    return code === METAMASK_ERROR_CODES.USER_REJECTED ||
           (web3Error.message?.toLowerCase().includes('user rejected') ?? false) ||
           (web3Error.message?.toLowerCase().includes('user denied') ?? false) ||
           (web3Error.message?.toLowerCase().includes('cancelled') ?? false);
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error: unknown): boolean {
    const web3Error = this.normalizeError(error);
    const code = typeof web3Error.code === 'number' 
      ? web3Error.code 
      : parseInt(String(web3Error.code || '0'));
    
    return code === METAMASK_ERROR_CODES.UNRECOGNIZED_CHAIN ||
           code === METAMASK_ERROR_CODES.CHAIN_DISCONNECTED ||
           web3Error.code === 'NETWORK_ERROR' ||
           (web3Error.message?.toLowerCase().includes('network') ?? false);
  }

  /**
   * Check if error is due to insufficient funds
   */
  static isInsufficientFunds(error: unknown): boolean {
    const web3Error = this.normalizeError(error);
    return web3Error.code === 'INSUFFICIENT_FUNDS' ||
           WEB3_ERROR_PATTERNS.INSUFFICIENT_FUNDS.test(
             `${web3Error.message || ''} ${web3Error.reason || ''}`
           );
  }
}

/**
 * React hook for error handling
 */
export function useWeb3ErrorHandler() {
  const handleError = (error: unknown): ErrorHandlingResult => {
    return Web3ErrorHandler.handle(error);
  };

  return {
    handleError,
    isUserRejection: Web3ErrorHandler.isUserRejection,
    isNetworkError: Web3ErrorHandler.isNetworkError,
    isInsufficientFunds: Web3ErrorHandler.isInsufficientFunds,
  };
}