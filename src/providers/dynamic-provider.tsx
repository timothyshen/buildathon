"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const cssOverrides = `
  .dynamic-widget-inline-controls,
  .dynamic-widget-card {
    font-family: inherit;
    border-radius: 12px;
  }
  .dynamic-widget-inline-controls {
    max-width: 100%;
  }
`;

export function DynamicProvider({ children }: { children: React.ReactNode }) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  // Skip Dynamic wrapper if environment ID is not configured
  if (!environmentId) {
    return <>{children}</>;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        cssOverrides,
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
