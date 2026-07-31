/**
 * Provider Registry — Phase 5
 *
 * Central manager for all IoT communication providers.
 * Every provider registers itself here on startup.
 * The IoT Engine and Command Service never reference providers directly —
 * they always go through this registry using the device's protocol field.
 */

import type { BaseProvider } from "./BaseProvider";

class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();

  /**
   * Register a provider for a given protocol.
   * Called by each provider on module load.
   */
  register(provider: BaseProvider): void {
    this.providers.set(provider.protocol, provider);
    console.log(`[ProviderRegistry] Registered provider: ${provider.name} (protocol: ${provider.protocol})`);
  }

  /**
   * Look up the provider for a given protocol.
   * Returns null if no provider is registered for that protocol.
   */
  get(protocol: string): BaseProvider | null {
    return this.providers.get(protocol) ?? null;
  }

  /** Returns all registered providers */
  getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /** Returns a summary list (name + protocol) for admin inspection */
  getSummary(): { name: string; protocol: string }[] {
    return Array.from(this.providers.values()).map(p => ({
      name: p.name,
      protocol: p.protocol,
    }));
  }

  /** Connect all registered providers — called by IoT Core on server boot */
  async connectAll(): Promise<void> {
    for (const provider of Array.from(this.providers.values())) {
      try {
        await provider.connect();
      } catch (err) {
        console.error(`[ProviderRegistry] Failed to connect ${provider.name}:`, err);
      }
    }
  }

  /** Gracefully disconnect all providers — called on server shutdown */
  async disconnectAll(): Promise<void> {
    for (const provider of Array.from(this.providers.values())) {
      try {
        await provider.disconnect();
      } catch (err) {
        console.error(`[ProviderRegistry] Failed to disconnect ${provider.name}:`, err);
      }
    }
  }
}

export const providerRegistry = new ProviderRegistry();
