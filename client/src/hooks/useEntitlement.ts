/**
 * useEntitlement — Frontend entitlement hook
 *
 * This is the single hook for checking subscription-based access to modules
 * and services on the frontend. It pulls the list of granted feature keys from
 * the backend and uses them to gate access.
 *
 * Usage:
 *   const { isEntitled, isLoading } = useEntitlement("iot");
 *   const { isEntitled: canUseCrops } = useEntitlement("crop");
 */

import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";

interface UseEntitlementResult {
  /** Whether the org's subscription grants access to this feature */
  isEntitled: boolean;
  /** Whether the entitlement data is still loading */
  isLoading: boolean;
  /** All feature keys granted to this org */
  grantedFeatures: string[];
  /**
   * Whether the org has NO subscription at all (vs having one but feature not in plan).
   * Useful to show "contact admin" vs "upgrade plan" messages.
   */
  hasNoSubscription: boolean;
}

/**
 * @param featureKey - The module or service key to check (e.g. "crop", "iot").
 *                     Pass undefined to only get the full list of granted features.
 */
export function useEntitlement(featureKey?: string): UseEntitlementResult {
  const { currentFarm } = useFarm();
  const organizationId = currentFarm?.farm.organizationId ?? 0;

  const { data: grantedFeatures = [], isLoading } =
    trpc.subscriptions.getGrantedFeatures.useQuery(
      { organizationId },
      {
        enabled: !!organizationId,
        // Cache for 5 minutes — entitlements don't change frequently
        staleTime: 5 * 60 * 1000,
      }
    );

  // alwaysVisible modules (dashboard, tasks, settings) are always accessible
  const alwaysVisibleKeys = MODULE_REGISTRY.filter((m) => m.alwaysVisible).map((m) => m.key);

  const isEntitled =
    !featureKey ||
    alwaysVisibleKeys.includes(featureKey) ||
    grantedFeatures.includes(featureKey);

  // If loading AND organizationId is set, we have no subscription data yet
  const hasNoSubscription = !isLoading && organizationId > 0 && grantedFeatures.length === 0;

  return {
    isEntitled,
    isLoading,
    grantedFeatures,
    hasNoSubscription,
  };
}

/**
 * Returns the full set of granted module keys for the current org,
 * including always-visible ones.
 * Replaces the old `enabledModules` prop pattern.
 */
export function useGrantedModules(): {
  modules: string[];
  isLoading: boolean;
} {
  const { grantedFeatures, isLoading } = useEntitlement();
  const alwaysVisibleKeys = MODULE_REGISTRY.filter((m) => m.alwaysVisible).map((m) => m.key);

  const modules = Array.from(new Set([...alwaysVisibleKeys, ...grantedFeatures]));

  return { modules, isLoading };
}
