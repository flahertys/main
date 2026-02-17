"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type WalletState = {
  address: string | null;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  balance: string;
  chain: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [balance, setBalance] = useState("0.00");
  const [chain, setChain] = useState<string | null>(null);

  const connect = async () => {
    setStatus('CONNECTING');
    // Simulated multi-chain logic - ready for custom RPC integration
    setTimeout(() => {
      setAddress("0x74a2...f2e9");
      setBalance("1,250.40");
      setChain("HAX_CHAIN_MAINNET");
      setStatus('CONNECTED');
    }, 1500);
  };

  const disconnect = () => {
    setAddress(null);
    setBalance("0.00");
    setChain(null);
    setStatus('DISCONNECTED');
  };

  return (
    <WalletContext.Provider value={{ address, status, balance, chain, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
