import { useEffect } from "react";

import { useInsuranceStore } from "~/stores/insuranceStore";

export const useNames = () => {
  const { getProduct, getTranche, loadInsurances } = useInsuranceStore();

  useEffect(() => {
    void loadInsurances();
  }, [loadInsurances]);

  const getProductName = (productId: number): string | undefined => {
    const product = getProduct(productId);
    return product?.name;
  };

  const getTrancheName = (trancheId: number): string | undefined => {
    const tranche = getTranche(trancheId);
    return tranche?.name;
  };

  return {
    getProductName,
    getTrancheName,
  };
};
