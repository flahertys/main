"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { FC, ReactNode, useMemo } from "react";

// Import the wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const network =
    networkEnv === "mainnet" || networkEnv === "mainnet-beta"
      ? WalletAdapterNetwork.Mainnet
      : networkEnv === "testnet"
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

  // Prefer explicit RPC endpoint from env for reliability
  const endpoint = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_SOLANA_RPC;
    if (env && env.length > 0) return env;
    return clusterApiUrl(network);
  }, [network]);

  // Configure popular wallet adapters
  const wallets = useMemo(() => {
    return [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];
  }, [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
