import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export type FarmRole = "owner" | "administrator" | "farm_manager" | "worker" | "veterinary_officer" | "crop_officer" | "viewer";

export interface FarmSummary {
  farm: {
    id: number;
    name: string;
    farmType: string;
    location: string | null;
    currency: string;
    logoUrl: string | null;
    organizationId: number;
  };
  role: FarmRole;
}

interface FarmContextValue {
  currentFarm: FarmSummary | null;
  farms: FarmSummary[];
  role: FarmRole | null;
  isLoading: boolean;
  switchFarm: (farmId: number) => void;
  enabledModules: string[];
  can: (action: "read" | "write" | "manage" | "admin") => boolean;
  refetchFarms: () => void;
}

const FarmContext = createContext<FarmContextValue>({
  currentFarm: null,
  farms: [],
  role: null,
  isLoading: true,
  switchFarm: () => {},
  enabledModules: [],
  can: () => false,
  refetchFarms: () => {},
});

const STORAGE_KEY = "kilimohub_current_farm_id";

const ROLE_PERMISSIONS: Record<FarmRole, ("read" | "write" | "manage" | "admin")[]> = {
  viewer: ["read"],
  worker: ["read", "write"],
  crop_officer: ["read", "write"],
  veterinary_officer: ["read", "write"],
  farm_manager: ["read", "write", "manage"],
  administrator: ["read", "write", "manage", "admin"],
  owner: ["read", "write", "manage", "admin"],
};

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [currentFarmId, setCurrentFarmId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  const { data: farms = [], isLoading: farmsLoading, refetch: refetchFarms } = trpc.farms.list.useQuery(undefined, {
    retry: false,
  });

  const currentFarm = farms.find((f) => f.farm.id === currentFarmId) ?? farms[0] ?? null;
  const role = currentFarm?.role ?? null;

  // Auto-select first farm if none selected
  useEffect(() => {
    if (!farmsLoading && farms.length > 0 && !currentFarmId) {
      const first = farms[0];
      if (first) {
        setCurrentFarmId(first.farm.id);
        localStorage.setItem(STORAGE_KEY, String(first.farm.id));
      }
    }
  }, [farms, farmsLoading, currentFarmId]);

  const { data: modulesData = [] } = trpc.farms.getModules.useQuery(
    { farmId: currentFarm?.farm.id ?? 0 },
    { enabled: !!currentFarm?.farm.id }
  );

  const enabledModules = modulesData.filter((m) => m.isEnabled).map((m) => m.moduleKey);

  const switchFarm = (farmId: number) => {
    setCurrentFarmId(farmId);
    localStorage.setItem(STORAGE_KEY, String(farmId));
  };

  const can = (action: "read" | "write" | "manage" | "admin"): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
  };

  return (
    <FarmContext.Provider
      value={{
        currentFarm,
        farms,
        role,
        isLoading: farmsLoading,
        switchFarm,
        enabledModules,
        can,
        refetchFarms,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  return useContext(FarmContext);
}
