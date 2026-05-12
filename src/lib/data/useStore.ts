// Re-export from the shared context-based store
// This file exists so all existing imports still work without modifications.
export { useStore, StoreProvider, genId, nextFacturaNum } from "./StoreContext";
export type { StoreData, FinancialStatement, BalanceItem } from "./StoreContext";
