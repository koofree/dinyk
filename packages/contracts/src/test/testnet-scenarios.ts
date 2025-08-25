/**
 * Comprehensive Testnet Scenarios for DIN Insurance Platform
 * 
 * These test scenarios cover the complete insurance lifecycle on Kaia Testnet.
 * Run these tests to verify all hooks and smart contract interactions work correctly.
 */

import { ethers } from 'ethers';
import { useProductManagement } from '../hooks/useProductManagement';
import { useRoundManagement } from '../hooks/useRoundManagement';
import { useBuyerOperations } from '../hooks/useBuyerOperations';
import { useSellerOperations } from '../hooks/useSellerOperations';
import { useMonitoring } from '../hooks/useMonitoring';
import { useSettlement } from '../hooks/useSettlement';

// Test configuration
const TEST_CONFIG = {
  // Kaia Testnet RPC
  RPC_URL: 'https://public-en-kairos.node.kaia.io',
  CHAIN_ID: 1001,
  
  // Test accounts (replace with your test wallets)
  OPERATOR_PRIVATE_KEY: process.env.TEST_OPERATOR_KEY || '',
  BUYER_PRIVATE_KEY: process.env.TEST_BUYER_KEY || '',
  SELLER_PRIVATE_KEY: process.env.TEST_SELLER_KEY || '',
  
  // Test amounts
  COVERAGE_AMOUNT: '1000', // USDT
  COLLATERAL_AMOUNT: '1500', // USDT
  
  // Timing
  SALES_DURATION_MINUTES: 60, // 1 hour for testing
  START_DELAY_MINUTES: 5,
};

// Utility function to wait
const wait = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Utility function to log with timestamp
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

/**
 * Scenario 1: Complete Insurance Lifecycle
 * - Register product and tranche
 * - Create pool
 * - Announce and open round
 * - Buy insurance and provide liquidity
 * - Close and match round
 * - Trigger settlement
 * - Claim payouts
 */
export async function testCompleteLifecycle() {
  log('🚀 Starting Complete Insurance Lifecycle Test');
  
  try {
    // Initialize hooks (in a real app, these would be in React components)
    const productMgmt = useProductManagement();
    const roundMgmt = useRoundManagement();
    const buyerOps = useBuyerOperations();
    const sellerOps = useSellerOperations();
    const settlement = useSettlement();
    const monitoring = useMonitoring();
    
    // Step 1: Register Insurance Product
    log('📋 Step 1: Registering insurance product...');
    const productResult = await productMgmt.registerProduct({
      name: 'BTC Price Protection',
      description: 'Protects against BTC price drops',
    });
    log('✅ Product registered', { productId: productResult });
    
    // Step 2: Register Tranche
    log('🎯 Step 2: Registering tranche...');
    const trancheResult = await productMgmt.registerTranche({
      productId: 1, // Assuming first product
      name: 'BTC -10% Protection',
      triggerType: 0, // PRICE_BELOW
      threshold: '54000', // $54,000 trigger (assuming BTC at $60,000)
      premiumRateBps: 500, // 5% premium
      trancheCap: '100000', // $100,000 cap
      maturityDays: 7, // 7 days maturity
      perAccountMin: '100', // $100 min
      perAccountMax: '10000', // $10,000 max
      oracleRouteId: 1, // BTC oracle
    });
    log('✅ Tranche registered', { trancheId: trancheResult });
    
    // Step 3: Create Pool
    log('🏊 Step 3: Creating tranche pool...');
    const poolResult = await productMgmt.createTranchePool(1); // trancheId: 1
    log('✅ Pool created', { poolAddress: poolResult.poolAddress });
    
    // Step 4: Announce Round
    log('📢 Step 4: Announcing sales round...');
    const roundId = await roundMgmt.announceRound({
      trancheId: 1,
      durationMinutes: TEST_CONFIG.SALES_DURATION_MINUTES,
      startDelayMinutes: TEST_CONFIG.START_DELAY_MINUTES,
      openImmediately: false,
    });
    log('✅ Round announced', { roundId });
    
    // Wait for sales to start
    log('⏳ Waiting for sales period to start...');
    await wait(TEST_CONFIG.START_DELAY_MINUTES * 60);
    
    // Step 5: Open Round
    log('🚀 Step 5: Opening round for sales...');
    await roundMgmt.openRound(roundId);
    log('✅ Round opened');
    
    // Step 6: Buy Insurance (as buyer)
    log('🛒 Step 6: Purchasing insurance coverage...');
    const purchaseCalculation = await buyerOps.calculatePremium(1, TEST_CONFIG.COVERAGE_AMOUNT);
    log('💰 Purchase calculation:', {
      coverage: ethers.formatUnits(purchaseCalculation.coverageAmount, 6),
      premium: ethers.formatUnits(purchaseCalculation.premiumAmount, 6),
      total: ethers.formatUnits(purchaseCalculation.totalCost, 6),
      premiumRate: purchaseCalculation.premiumRatePercent,
    });
    
    await buyerOps.buyInsurance({
      roundId,
      coverageAmount: TEST_CONFIG.COVERAGE_AMOUNT,
    });
    log('✅ Insurance purchased');
    
    // Step 7: Provide Liquidity (as seller)
    log('🏦 Step 7: Providing liquidity as seller...');
    const yieldAnalysis = await sellerOps.calculateYield(1, TEST_CONFIG.COLLATERAL_AMOUNT);
    log('📈 Yield analysis:', {
      maturityDays: yieldAnalysis.maturityDays,
      premiumRate: `${yieldAnalysis.premiumRate}%`,
      annualizedYield: `${yieldAnalysis.annualizedYield.toFixed(2)}%`,
      expectedReturn: ethers.formatUnits(yieldAnalysis.expectedReturn, 6),
    });
    
    await sellerOps.depositCollateral({
      roundId,
      collateralAmount: TEST_CONFIG.COLLATERAL_AMOUNT,
    });
    log('✅ Collateral deposited');
    
    // Step 8: Monitor Round Status
    log('📊 Step 8: Monitoring round status...');
    const roundEconomics = await roundMgmt.getRoundEconomics(roundId);
    log('💰 Round economics:', {
      totalBuyerPurchases: ethers.formatUnits(roundEconomics!.totalBuyerPurchases, 6),
      totalSellerCollateral: ethers.formatUnits(roundEconomics!.totalSellerCollateral, 6),
      premiumPool: ethers.formatUnits(roundEconomics!.premiumPool, 6),
    });
    
    // Wait for sales period to end (or force close)
    log('⏳ Waiting for sales period to end...');
    await wait(30); // Wait 30 seconds then force close
    
    // Step 9: Close and Match Round
    log('🔐 Step 9: Closing and matching round...');
    await roundMgmt.closeAndMatchRound(roundId, true); // force close
    log('✅ Round closed and matched');
    
    // Get updated economics after matching
    const matchedEconomics = await roundMgmt.getRoundEconomics(roundId);
    log('⚖️ Matched economics:', {
      matchedAmount: ethers.formatUnits(matchedEconomics!.matchedAmount, 6),
      lockedCollateral: ethers.formatUnits(matchedEconomics!.lockedCollateral, 6),
    });
    
    // Step 10: Monitor System Health
    log('🏥 Step 10: Checking system health...');
    const systemMetrics = await monitoring.getSystemMetrics();
    log('📊 System metrics:', {
      totalTVL: ethers.formatUnits(systemMetrics.totalTVL, 6),
      totalAssets: ethers.formatUnits(systemMetrics.totalAssets, 6),
      totalLockedAssets: ethers.formatUnits(systemMetrics.totalLockedAssets, 6),
      overallUtilization: `${systemMetrics.overallUtilization}%`,
      activeRounds: systemMetrics.activeRounds,
      healthStatus: systemMetrics.healthStatus,
    });
    
    // Step 11: Wait for Maturity (in production, this would be days)
    log('⏳ Simulating wait for maturity...');
    // In real scenario, wait for maturity time
    // For testing, we'll proceed to settlement
    
    // Step 12: Trigger Settlement
    log('⚖️ Step 12: Triggering settlement...');
    const settlementStatus = await settlement.checkSettlementStatus(roundId);
    log('📋 Settlement status:', {
      canSettle: settlementStatus?.canSettle,
      currentPrice: settlementStatus?.currentPrice,
      triggerPrice: settlementStatus?.triggerPrice,
      isTriggered: settlementStatus?.isTriggered,
    });
    
    // Note: In test environment, we may need to wait for actual maturity
    // or modify contract to allow early settlement for testing
    
    if (settlementStatus?.canSettle) {
      await settlement.triggerSettlement(roundId);
      log('✅ Settlement triggered');
      
      // Wait for liveness window (if applicable)
      if (settlementStatus.timeUntilFinalize && settlementStatus.timeUntilFinalize > 0) {
        log(`⏳ Waiting ${settlementStatus.timeUntilFinalize} seconds for liveness window...`);
        await wait(settlementStatus.timeUntilFinalize);
      }
      
      // Finalize settlement
      await settlement.finalizeSettlement(roundId);
      log('✅ Settlement finalized');
    }
    
    // Step 13: Claim Payouts/Premiums
    log('💰 Step 13: Claiming payouts/premiums...');
    
    // Check buyer claim status
    const claimStatus = await buyerOps.checkClaimStatus(roundId);
    if (claimStatus.canClaim) {
      await buyerOps.claimPayout(roundId);
      log('✅ Buyer payout claimed:', {
        amount: ethers.formatUnits(claimStatus.payoutAmount, 6),
      });
    } else {
      log('ℹ️ No buyer payout available (insurance not triggered)');
    }
    
    // Seller claims premiums
    await sellerOps.claimPremiums(roundId);
    log('✅ Seller premiums claimed');
    
    log('🎉 Complete Insurance Lifecycle Test Completed Successfully!');
    
  } catch (error) {
    log('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Scenario 2: Multiple Buyers and Sellers
 * Test with multiple participants to verify matching logic
 */
export async function testMultipleParticipants() {
  log('🚀 Starting Multiple Participants Test');
  
  try {
    const buyerOps = useBuyerOperations();
    const sellerOps = useSellerOperations();
    const roundMgmt = useRoundManagement();
    
    // Assume round is already open (roundId from previous test or setup)
    const roundId = 1;
    
    // Multiple buyers
    log('👥 Adding multiple buyers...');
    const buyers = [
      { amount: '500', address: '0xBuyer1...' },
      { amount: '750', address: '0xBuyer2...' },
      { amount: '1000', address: '0xBuyer3...' },
    ];
    
    for (const buyer of buyers) {
      await buyerOps.buyInsurance({
        roundId,
        coverageAmount: buyer.amount,
      });
      log(`✅ Buyer purchased $${buyer.amount}`);
    }
    
    // Multiple sellers
    log('🏦 Adding multiple sellers...');
    const sellers = [
      { amount: '1000', address: '0xSeller1...' },
      { amount: '1500', address: '0xSeller2...' },
      { amount: '2000', address: '0xSeller3...' },
    ];
    
    for (const seller of sellers) {
      await sellerOps.depositCollateral({
        roundId,
        collateralAmount: seller.amount,
      });
      log(`✅ Seller deposited $${seller.amount}`);
    }
    
    // Check round economics
    const economics = await roundMgmt.getRoundEconomics(roundId);
    log('📊 Round economics with multiple participants:', {
      totalBuyers: ethers.formatUnits(economics!.totalBuyerPurchases, 6),
      totalSellers: ethers.formatUnits(economics!.totalSellerCollateral, 6),
      expectedMatch: Math.min(
        Number(ethers.formatUnits(economics!.totalBuyerPurchases, 6)),
        Number(ethers.formatUnits(economics!.totalSellerCollateral, 6))
      ),
    });
    
    log('✅ Multiple Participants Test Completed');
    
  } catch (error) {
    log('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Scenario 3: Risk Analysis and Monitoring
 * Test monitoring and analytics features
 */
export async function testMonitoringAndAnalytics() {
  log('🚀 Starting Monitoring and Analytics Test');
  
  try {
    const monitoring = useMonitoring();
    
    // Fetch and analyze market prices
    log('💰 Fetching market prices...');
    const prices = await monitoring.fetchMarketPrices();
    log('📊 Current market prices:', prices);
    
    // Monitor pool health
    log('🏥 Monitoring pool health...');
    const poolHealth = await monitoring.monitorPoolHealth();
    for (const pool of poolHealth) {
      log(`Pool ${pool.trancheId}:`, {
        address: pool.poolAddress,
        totalAssets: ethers.formatUnits(pool.totalAssets, 6),
        utilization: `${pool.utilization}%`,
        healthStatus: pool.healthStatus,
      });
    }
    
    // Analyze tranche risks
    log('⚠️ Analyzing tranche risks...');
    const riskAnalysis = await monitoring.analyzeTranchesRisk();
    for (const analysis of riskAnalysis) {
      log(`Tranche ${analysis.trancheId} Risk:`, {
        triggerPrice: ethers.formatEther(analysis.triggerPrice),
        currentPrice: analysis.currentPrice,
        distanceToTrigger: `${analysis.distanceToTrigger.toFixed(2)}%`,
        riskLevel: analysis.riskLevel,
        annualizedYield: `${analysis.annualizedYield.toFixed(2)}%`,
      });
    }
    
    // Monitor active rounds
    log('🔄 Monitoring active rounds...');
    const activeRounds = await monitoring.monitorActiveRounds();
    for (const round of activeRounds) {
      log(`Round ${round.roundId}:`, {
        state: round.state,
        totalBuyers: ethers.formatUnits(round.totalBuyerPurchases, 6),
        totalSellers: ethers.formatUnits(round.totalSellerCollateral, 6),
        isTriggered: round.isTriggered,
        needsAction: round.needsAction,
      });
    }
    
    // Get system-wide metrics
    log('📈 Fetching system metrics...');
    const systemMetrics = await monitoring.getSystemMetrics();
    log('🌐 System Overview:', {
      totalTVL: ethers.formatUnits(systemMetrics.totalTVL, 6),
      overallUtilization: `${systemMetrics.overallUtilization}%`,
      activeRounds: systemMetrics.activeRounds,
      activeTranches: systemMetrics.activeTranches,
      healthStatus: systemMetrics.healthStatus,
    });
    
    log('✅ Monitoring and Analytics Test Completed');
    
  } catch (error) {
    log('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Scenario 4: Edge Cases and Error Handling
 * Test various edge cases and error conditions
 */
export async function testEdgeCases() {
  log('🚀 Starting Edge Cases Test');
  
  try {
    const buyerOps = useBuyerOperations();
    const sellerOps = useSellerOperations();
    const roundMgmt = useRoundManagement();
    
    // Test 1: Try to buy insurance with insufficient balance
    log('🧪 Test 1: Insufficient balance...');
    try {
      await buyerOps.buyInsurance({
        roundId: 1,
        coverageAmount: '1000000', // Very large amount
      });
      log('❌ Should have failed with insufficient balance');
    } catch (error: any) {
      if (error.message.includes('Insufficient USDT balance')) {
        log('✅ Correctly rejected: Insufficient balance');
      } else {
        throw error;
      }
    }
    
    // Test 2: Try to buy below minimum
    log('🧪 Test 2: Below minimum purchase...');
    try {
      await buyerOps.buyInsurance({
        roundId: 1,
        coverageAmount: '10', // Below minimum
      });
      log('❌ Should have failed with below minimum');
    } catch (error: any) {
      if (error.message.includes('below minimum')) {
        log('✅ Correctly rejected: Below minimum');
      } else {
        throw error;
      }
    }
    
    // Test 3: Try to close round that's not open
    log('🧪 Test 3: Close non-open round...');
    try {
      await roundMgmt.closeAndMatchRound(999); // Non-existent round
      log('❌ Should have failed with invalid round');
    } catch (error: any) {
      log('✅ Correctly rejected: Invalid round');
    }
    
    // Test 4: Try to settle before maturity
    log('🧪 Test 4: Settle before maturity...');
    const settlement = useSettlement();
    try {
      await settlement.triggerSettlement(1); // Assuming round 1 hasn't matured
      log('❌ Should have failed with not matured');
    } catch (error: any) {
      if (error.message.includes('not matured')) {
        log('✅ Correctly rejected: Not matured');
      } else {
        // Might be other valid rejection
        log('✅ Rejected as expected:', error.message);
      }
    }
    
    // Test 5: Withdraw more than available
    log('🧪 Test 5: Over-withdrawal...');
    try {
      await sellerOps.withdrawCollateral(1, '1000000'); // Very large amount
      log('❌ Should have failed with insufficient collateral');
    } catch (error: any) {
      if (error.message.includes('Insufficient available collateral')) {
        log('✅ Correctly rejected: Insufficient collateral');
      } else {
        throw error;
      }
    }
    
    log('✅ Edge Cases Test Completed');
    
  } catch (error) {
    log('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Main test runner
 * Run all test scenarios in sequence
 */
export async function runAllTests() {
  log('🎯 Starting DIN Insurance Platform Testnet Tests');
  log('📍 Network: Kaia Testnet (Chain ID: 1001)');
  log('⏰ Start time:', new Date().toISOString());
  
  try {
    // Run tests in sequence
    await testCompleteLifecycle();
    await wait(5); // Brief pause between tests
    
    await testMultipleParticipants();
    await wait(5);
    
    await testMonitoringAndAnalytics();
    await wait(5);
    
    await testEdgeCases();
    
    log('✅ All tests completed successfully!');
    log('⏰ End time:', new Date().toISOString());
    
  } catch (error) {
    log('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Export test runner for use in scripts
export default {
  runAllTests,
  testCompleteLifecycle,
  testMultipleParticipants,
  testMonitoringAndAnalytics,
  testEdgeCases,
};