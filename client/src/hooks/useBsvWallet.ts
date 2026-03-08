import { useCallback, useState } from "react";
import {
  buildContributionPayload,
  encodePayload,
} from "../lib/inscription";

export interface YoursWallet {
  connect(): Promise<{ address: string; ordAddress: string }>;
  isConnected(): Promise<boolean>;
  inscribe(params: {
    dataB64: string;
    contentType: string;
  }): Promise<{ txid: string }>;
}

declare global {
  interface Window {
    yours?: YoursWallet;
  }
}

interface UseBsvWalletState {
  connected: boolean;
  address: string;
  ordAddress: string;
  connecting: boolean;
  error: string | null;
}

interface UseBsvWallet extends UseBsvWalletState {
  connect: () => Promise<void>;
  inscribeContribution: (
    projectId: string,
    text: string
  ) => Promise<{ txid: string }>;
}

export function useBsvWallet(): UseBsvWallet {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [ordAddress, setOrdAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);

    if (typeof window === "undefined" || !window.yours) {
      const message = "Yours Wallet not detected. Open this page in a real browser tab (not Replit preview) with Yours Wallet installed.";
      setError(message);
      return;
    }

    setConnecting(true);

    try {
      const result = await window.yours.connect();
      setConnected(true);
      setAddress(result.address);
      setOrdAddress(result.ordAddress);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Yours Wallet.";
      setConnected(false);
      setAddress("");
      setOrdAddress("");
      setError(message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const inscribeContribution = useCallback(
    async (projectId: string, text: string): Promise<{ txid: string }> => {
      if (!connected) {
        const message = "Wallet is not connected.";
        setError(message);
        return Promise.reject(new Error(message));
      }

      if (typeof window === "undefined" || !window.yours) {
        const message = "Yours Wallet is not available in this environment.";
        setError(message);
        return Promise.reject(new Error(message));
      }

      setError(null);

      const payload = buildContributionPayload(projectId, text);
      const dataB64 = encodePayload(payload);

      try {
        const result = await window.yours.inscribe({
          dataB64,
          contentType: "application/json",
        });

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to inscribe contribution with Yours Wallet.";
        setError(message);
        return Promise.reject(new Error(message));
      }
    },
    [connected]
  );

  return {
    connected,
    address,
    ordAddress,
    connecting,
    error,
    connect,
    inscribeContribution,
  };
}

