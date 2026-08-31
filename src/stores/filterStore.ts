import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { DEFAULT_FILTERS, filterKey, type FilterState } from "@/lib/data";

interface FilterStore extends FilterState {
  setMonth: (month: string) => void;
  setEnvironment: (environment: string) => void;
  setTeam: (team: string) => void;
  setSeverity: (severity: string) => void;
  setFilters: (partial: Partial<FilterState>) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...DEFAULT_FILTERS,
  setMonth: (month) => set({ month }),
  setEnvironment: (environment) => set({ environment }),
  setTeam: (team) => set({ team }),
  setSeverity: (severity) => set({ severity }),
  setFilters: (partial) => set(partial),
  reset: () => set({ ...DEFAULT_FILTERS }),
}));

/** Current filter slice as a plain object (shallow-compared) */
export const useFilters = (): FilterState =>
  useFilterStore(
    useShallow((s) => ({ month: s.month, environment: s.environment, team: s.team, severity: s.severity })),
  );

/** Stable key that changes whenever any filter changes — for filter-morph re-animation */
export const useFilterKey = (): string => useFilterStore((s) => filterKey(s));
