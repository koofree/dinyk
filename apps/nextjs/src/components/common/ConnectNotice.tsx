"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageProvider";

export const ConnectNotice: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <p className="text-center text-sm bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent font-medium">
          {t('connect.notice')}
        </p>
      </div>
    </div>
  );
};
