# MetaMask Error Handling Guide

## Overview
This guide demonstrates how to properly handle MetaMask and Web3 errors in the DIN insurance platform.

## Error Handler Utility

The `Web3ErrorHandler` utility (`packages/contracts/src/utils/web3-errors.ts`) provides comprehensive error handling for:
- MetaMask user rejections
- Network errors
- Insufficient funds
- Transaction failures
- Contract reverts

## Usage Examples

### 1. Basic Error Handling in Components

```typescript
import { 
  Web3ErrorHandler,
  type ErrorHandlingResult 
} from "@dinsure/contracts";
import { ErrorAlert } from "@/components/common/ErrorAlert";

function MyComponent() {
  const [error, setError] = useState<ErrorHandlingResult | null>(null);
  
  const handleTransaction = async () => {
    try {
      // Your transaction code
      await someWeb3Method();
    } catch (err) {
      const result = Web3ErrorHandler.handle(err);
      setError(result);
    }
  };

  return (
    <>
      {error && (
        <ErrorAlert 
          error={error}
          onRetry={handleTransaction}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
}
```

### 2. Checking for Specific Error Types

```typescript
import { Web3ErrorHandler } from "@dinsure/contracts";

try {
  await connectWallet();
} catch (err) {
  if (Web3ErrorHandler.isUserRejection(err)) {
    // User cancelled - don't show error
    console.log("User cancelled connection");
    return;
  }
  
  if (Web3ErrorHandler.isNetworkError(err)) {
    // Network issue - prompt to switch
    await switchNetwork();
    return;
  }
  
  if (Web3ErrorHandler.isInsufficientFunds(err)) {
    // Not enough balance
    alert("Please add funds to your wallet");
    return;
  }
  
  // Handle other errors
  const result = Web3ErrorHandler.handle(err);
  showError(result.userMessage);
}
```

### 3. Hook Usage

```typescript
import { useWeb3ErrorHandler } from "@dinsure/contracts";

function useMyCustomHook() {
  const { handleError, isUserRejection } = useWeb3ErrorHandler();
  
  const executeTransaction = async () => {
    try {
      // Transaction logic
    } catch (err) {
      if (!isUserRejection(err)) {
        const result = handleError(err);
        // Handle the error result
      }
    }
  };
  
  return { executeTransaction };
}
```

## Error Types and Handling

### MetaMask Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| 4001 | User Rejected | "Transaction cancelled by user" |
| 4100 | Unauthorized | "Please connect your wallet first" |
| 4902 | Unrecognized Chain | "Please switch to the correct network" |
| 4900 | Disconnected | "Wallet disconnected. Please reconnect." |
| -32603 | Internal Error | "Wallet encountered an internal error" |

### Common Web3 Patterns

| Pattern | Detection | User Message |
|---------|-----------|--------------|
| Insufficient Funds | `/insufficient funds/i` | "Insufficient balance" |
| Gas Too Low | `/gas too low/i` | "Gas limit too low" |
| Transaction Reverted | `/execution reverted/i` | "Transaction failed" |
| Timeout | `/timeout/i` | "Request timed out" |

## Error Alert Component

The `ErrorAlert` component provides a consistent UI for displaying errors:

```typescript
<ErrorAlert 
  error={errorResult}
  onRetry={() => retryFunction()}
  onSwitchNetwork={() => switchNetwork()}
  onCheckBalance={() => checkBalance()}
  onClose={() => clearError()}
/>
```

### Props
- `error`: ErrorHandlingResult from Web3ErrorHandler
- `onRetry`: Called when retry action is triggered
- `onSwitchNetwork`: Called when network switch is needed
- `onCheckBalance`: Called when balance check is needed
- `onClose`: Called when user dismisses the alert

## Best Practices

1. **Always handle user rejections silently**
   ```typescript
   if (Web3ErrorHandler.isUserRejection(err)) {
     return; // Don't show error for user cancellations
   }
   ```

2. **Provide actionable error messages**
   ```typescript
   const result = Web3ErrorHandler.handle(err);
   if (result.action === 'switch_network') {
     // Show network switch button
   }
   ```

3. **Log technical details for debugging**
   ```typescript
   const result = Web3ErrorHandler.handle(err);
   console.error('Technical details:', result.technicalDetails);
   ```

4. **Use severity levels appropriately**
   - `error`: Critical failures requiring user attention
   - `warning`: Issues that can be resolved
   - `info`: Informational messages

## Integration with Web3Provider

The Web3Provider already includes basic error handling. Enhanced error handling can be added:

```typescript
const connectWallet = async (type: ProviderType = ProviderType.METAMASK) => {
  try {
    // Connection logic
  } catch (err) {
    const result = Web3ErrorHandler.handle(err);
    setError(result);
    
    // Take action based on error type
    if (result.action === 'install_wallet') {
      window.open('https://metamask.io/download/', '_blank');
    }
    
    throw err; // Re-throw for component handling
  }
};
```

## Testing Error Scenarios

### Simulate User Rejection
1. Trigger a transaction
2. Click "Reject" in MetaMask popup
3. Verify no error is shown to user

### Simulate Network Error
1. Switch to wrong network
2. Attempt transaction
3. Verify network switch prompt appears

### Simulate Insufficient Funds
1. Use account with no balance
2. Attempt transaction
3. Verify balance error message

## Contract Revert Handling

For contract-specific errors:

```typescript
try {
  await contract.buyInsurance(amount);
} catch (err) {
  const result = Web3ErrorHandler.handle(err);
  
  // Check for specific revert reasons
  if (result.technicalDetails?.includes('not open')) {
    setError({
      userMessage: "Insurance round is not open yet",
      severity: 'warning',
      action: 'none'
    });
  } else {
    setError(result);
  }
}
```

## Troubleshooting

### Error not being caught
Ensure async functions use try-catch:
```typescript
// Wrong
const handleClick = () => {
  doAsyncOperation(); // Error not caught
};

// Correct
const handleClick = async () => {
  try {
    await doAsyncOperation();
  } catch (err) {
    // Handle error
  }
};
```

### Generic error messages
Check console for technical details:
```typescript
console.error('[Transaction Failed]', {
  error: err,
  result: Web3ErrorHandler.handle(err)
});
```

### User stuck on wrong network
Implement automatic network switching:
```typescript
if (Web3ErrorHandler.isNetworkError(err)) {
  await switchToKaiaNetwork();
  // Retry operation
}
```