import type { ExternalProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: ExternalProvider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export {};
