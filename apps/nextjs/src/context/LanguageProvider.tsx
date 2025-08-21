"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 번역 데이터
const translations = {
  en: {
    // Navigation
    'nav.insurance': 'Insurance',
    'nav.liquidity': 'Liquidity',
    'nav.portfolio': 'Portfolio',
    
    // Hero Section
    'hero.title': 'Decentralized Insurance',
    'hero.subtitle': 'on Kaia',
    'hero.description': 'Protect your crypto assets with on-chain parametric insurance products.\nEarn premiums by providing liquidity to insurance pools.',
    'hero.buyInsurance': 'Buy Insurance',
    'hero.provideLiquidity': 'Provide Liquidity',
    
    // Connect Wallet Notice
    'connect.notice': 'Connect your wallet to start using DIN insurance platform',
    
    // Metrics
    'metrics.totalTVL': 'Total TVL',
    'metrics.activePools': 'Active Pools',
    'metrics.totalPremiums': 'Total Premiums',
    
    // Featured Products
    'products.title': 'Featured Insurance Products',
    'products.btcProtection': 'BTC Protection',
    'products.ethProtection': 'ETH Protection',
    'products.kaiaProtection': 'KAIA Protection',
    'products.trigger': 'Trigger',
    'products.duration': 'Duration',
    'products.premium': 'Premium',
    'products.viewDetails': 'View Details',
    
    // Wallet
    'wallet.connect': 'Connect Wallet',
    'wallet.connecting': 'Connecting...',
    'wallet.disconnect': 'Disconnect',
    'wallet.switchNetwork': 'Switch to {network}',
    'wallet.connectModal.title': 'Connect Your Wallet',
    'wallet.metamask': 'MetaMask',
    'wallet.metamask.desc': 'Recommended',
    'wallet.kaia': 'Kaia Wallet',
    'wallet.kaia.desc': 'Official Kaia Wallet',
    'wallet.walletconnect': 'WalletConnect',
    'wallet.walletconnect.desc': 'Coming Soon',
    'wallet.cancel': 'Cancel',
    'wallet.terms': 'By connecting, you agree to our Terms of Service',
    
    // Language
    'lang.en': 'EN',
    'lang.ko': 'KO',
  },
  ko: {
    // Navigation
    'nav.insurance': '보험',
    'nav.liquidity': '유동성',
    'nav.portfolio': '포트폴리오',
    
    // Hero Section
    'hero.title': '탈중앙화 보험',
    'hero.subtitle': '카이아에서',
    'hero.description': '온체인 파라메트릭 보험 상품으로 암호화폐 자산을 보호하세요. 보험 풀에 유동성을 제공하여 프리미엄을 획득하세요.',
    'hero.buyInsurance': '보험 구매',
    'hero.provideLiquidity': '유동성 제공',
    
    // Connect Wallet Notice
    'connect.notice': 'DIN 보험 플랫폼을 사용하려면 지갑을 연결하세요',
    
    // Metrics
    'metrics.totalTVL': '총 TVL',
    'metrics.activePools': '활성 풀',
    'metrics.totalPremiums': '총 프리미엄',
    
    // Featured Products
    'products.title': '주요 보험 상품',
    'products.btcProtection': 'BTC 보호',
    'products.ethProtection': 'ETH 보호',
    'products.kaiaProtection': 'KAIA 보호',
    'products.trigger': '트리거',
    'products.duration': '기간',
    'products.premium': '프리미엄',
    'products.viewDetails': '상세 보기',
    
    // Wallet
    'wallet.connect': '지갑 연결',
    'wallet.connecting': '연결 중...',
    'wallet.disconnect': '연결 해제',
    'wallet.switchNetwork': '{network}로 전환',
    'wallet.connectModal.title': '지갑 연결',
    'wallet.metamask': '메타마스크',
    'wallet.metamask.desc': '권장',
    'wallet.kaia': '카이아 지갑',
    'wallet.kaia.desc': '공식 카이아 지갑',
    'wallet.walletconnect': '월렛커넥트',
    'wallet.walletconnect.desc': '출시 예정',
    'wallet.cancel': '취소',
    'wallet.terms': '연결하면 서비스 약관에 동의하는 것으로 간주됩니다',
    
    // Language
    'lang.en': 'EN',
    'lang.ko': 'KO',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 서버사이드 렌더링과 클라이언트 렌더링 간의 불일치를 방지하기 위해 useEffect로 초기화
  const [language, setLanguage] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const t = (key: string): string => {
    // 서버사이드 렌더링 시에는 기본값 반환
    if (!isClient) {
      return key;
    }
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    return translation || key;
  };

  // 언어 변경 시 폰트 적용
  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (language === 'ko') {
      // 한국어: Pretendard만 사용
      root.style.setProperty('--font-sans', 'Pretendard, system-ui, sans-serif');
      root.style.setProperty('--font-display', 'Pretendard, system-ui, sans-serif');
      root.style.setProperty('--font-header', 'Pretendard, system-ui, sans-serif');
      body.classList.add('ko');
      body.classList.remove('en');
    } else {
      // 영어: Outfit(타이틀 및 강조와 버튼 내부), Pretendard(모든 바디)
      root.style.setProperty('--font-sans', 'Pretendard, Outfit, system-ui, sans-serif');
      root.style.setProperty('--font-display', 'Outfit, Pretendard, system-ui, sans-serif');
      root.style.setProperty('--font-header', 'Outfit, Pretendard, system-ui, sans-serif');
      body.classList.add('en');
      body.classList.remove('ko');
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
