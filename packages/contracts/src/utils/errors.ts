import { ErrorCode } from "../config/constants";

export class ContractError extends Error {
  constructor(
    public code: ErrorCode,
    public reason: string,
    public details?: any,
  ) {
    super(reason);
    this.name = "ContractError";
  }

  get isRetryable(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.RPC_ERROR,
      ErrorCode.GAS_ESTIMATION_FAILED,
    ].includes(this.code);
  }

  get userMessage(): string {
    switch (this.code) {
      case ErrorCode.INSUFFICIENT_FUNDS:
        return "Insufficient balance to complete this transaction";
      case ErrorCode.USER_REJECTED:
        return "Transaction was cancelled by user";
      case ErrorCode.ROUND_NOT_OPEN:
        return "This insurance round is not currently open for purchases";
      case ErrorCode.AMOUNT_TOO_LOW:
        return `Minimum purchase amount is ${this.details?.min || "N/A"} USDT`;
      case ErrorCode.AMOUNT_TOO_HIGH:
        return `Maximum purchase amount is ${this.details?.max || "N/A"} USDT`;
      case ErrorCode.TRANCHE_CAP_EXCEEDED:
        return "Purchase amount exceeds tranche capacity";
      case ErrorCode.INSUFFICIENT_LIQUIDITY:
        return "Insufficient liquidity available for this purchase";
      case ErrorCode.ORACLE_PRICE_STALE:
        return "Oracle price data is stale, please try again";
      case ErrorCode.ORACLE_UNAVAILABLE:
        return "Oracle service is currently unavailable";
      case ErrorCode.INVALID_ADDRESS:
        return "Invalid Ethereum address provided";
      case ErrorCode.INVALID_AMOUNT:
        return "Invalid amount specified";
      case ErrorCode.UNAUTHORIZED:
        return "You are not authorized to perform this action";
      default:
        return this.reason || "An error occurred processing your transaction";
    }
  }
}

export function parseContractError(error: any): ContractError {
  console.error("Contract error:", error);

  // Handle ethers.js specific errors
  if (error.code === "INSUFFICIENT_FUNDS") {
    return new ContractError(
      ErrorCode.INSUFFICIENT_FUNDS,
      "Insufficient funds for transaction",
      { originalError: error },
    );
  }

  if (error.code === "ACTION_REJECTED") {
    return new ContractError(
      ErrorCode.USER_REJECTED,
      "User rejected the transaction",
      { originalError: error },
    );
  }

  if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
    return new ContractError(
      ErrorCode.GAS_ESTIMATION_FAILED,
      "Gas estimation failed - transaction may revert",
      { originalError: error },
    );
  }

  if (error.code === "NETWORK_ERROR") {
    return new ContractError(
      ErrorCode.NETWORK_ERROR,
      "Network connection error",
      { originalError: error },
    );
  }

  // Handle contract revert reasons
  if (error.reason) {
    const reason = error.reason.toLowerCase();

    if (reason.includes("round not open")) {
      return new ContractError(ErrorCode.ROUND_NOT_OPEN, error.reason);
    }

    if (reason.includes("amount too low") || reason.includes("below minimum")) {
      return new ContractError(ErrorCode.AMOUNT_TOO_LOW, error.reason);
    }

    if (
      reason.includes("amount too high") ||
      reason.includes("exceeds maximum")
    ) {
      return new ContractError(ErrorCode.AMOUNT_TOO_HIGH, error.reason);
    }

    if (
      reason.includes("tranche cap") ||
      reason.includes("capacity exceeded")
    ) {
      return new ContractError(ErrorCode.TRANCHE_CAP_EXCEEDED, error.reason);
    }

    if (reason.includes("insufficient liquidity")) {
      return new ContractError(ErrorCode.INSUFFICIENT_LIQUIDITY, error.reason);
    }

    if (reason.includes("unauthorized") || reason.includes("access denied")) {
      return new ContractError(ErrorCode.UNAUTHORIZED, error.reason);
    }

    if (reason.includes("invalid address")) {
      return new ContractError(ErrorCode.INVALID_ADDRESS, error.reason);
    }

    if (reason.includes("invalid amount")) {
      return new ContractError(ErrorCode.INVALID_AMOUNT, error.reason);
    }
  }

  // Handle custom contract errors (Solidity custom errors)
  if (error.data?.message) {
    return parseCustomContractError(error.data.message);
  }

  // Default error
  return new ContractError(
    ErrorCode.CONTRACT_REVERT,
    error.message || "Transaction failed",
    { originalError: error },
  );
}

function parseCustomContractError(message: string): ContractError {
  // Parse custom Solidity errors
  if (message.includes("ZeroAddress")) {
    return new ContractError(
      ErrorCode.INVALID_ADDRESS,
      "Invalid address: zero address not allowed",
    );
  }

  if (message.includes("UnauthorizedAccess")) {
    return new ContractError(
      ErrorCode.UNAUTHORIZED,
      "Unauthorized access to this function",
    );
  }

  if (message.includes("ParameterExceedsBound")) {
    return new ContractError(
      ErrorCode.INVALID_PARAMETERS,
      "Parameter value exceeds allowed bounds",
    );
  }

  // Default for custom errors
  return new ContractError(ErrorCode.CONTRACT_REVERT, message);
}

// Error message helpers
export function getErrorMessage(error: unknown): string {
  if (error instanceof ContractError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ContractError) {
    return error.isRetryable;
  }

  return false;
}

// Error logging helper
export function logContractError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : "";

  console.error(`${timestamp}${contextStr} Contract Error:`, {
    error,
    message: getErrorMessage(error),
    retryable: isRetryableError(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
