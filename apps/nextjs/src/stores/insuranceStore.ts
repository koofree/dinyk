import { create } from "zustand";

interface Tranche {
  id: number;
  name: string;
  triggerType: number;
  triggerDirection: "PRICE_BELOW" | "PRICE_ABOVE";
  triggerPrice: string;
  premiumRateBps: number;
  perAccountMin: string;
  perAccountMax: string;
  trancheCap: string;
  maturityDays: number;
  oracleRouteId: number;
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  metadata: string;
  tranches: Tranche[];
}

interface InsurancesData {
  products: Product[];
}

interface InsuranceStore {
  data: InsurancesData | null;
  isLoading: boolean;
  error: string | null;
  loadInsurances: () => Promise<void>;
  getProduct: (productId: number) => Product | undefined;
  getTranche: (trancheId: number) => Tranche | undefined;
  getProductByTranche: (trancheId: number) => Product | undefined;
}

export const useInsuranceStore = create<InsuranceStore>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,

  loadInsurances: async () => {
    if (get().data) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/json/insurances.json");
      if (!response.ok) {
        throw new Error(`Failed to load insurances: ${response.statusText}`);
      }
      const data = (await response.json()) as InsurancesData;
      set({ data, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load insurances",
        isLoading: false,
      });
    }
  },

  getProduct: (productId) => {
    const state = get();
    return state.data?.products.find((p) => p.id === productId);
  },

  getTranche: (trancheId) => {
    const state = get();
    if (!state.data) return undefined;

    for (const product of state.data.products) {
      const tranche = product.tranches.find((t) => t.id === trancheId);
      if (tranche) return tranche;
    }
    return undefined;
  },

  getProductByTranche: (trancheId) => {
    const state = get();
    if (!state.data) return undefined;

    return state.data.products.find((product) =>
      product.tranches.some((t) => t.id === trancheId),
    );
  },
}));
