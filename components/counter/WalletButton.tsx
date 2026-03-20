"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWallet } from "@/lib/wallet-provider";


export function WalletButton() {
  const { address, status, connect, disconnect } = useWallet();

  const label =
    status === "CONNECTED"
      ? `${address ?? "Connected"}`
      : status === "CONNECTING"
        ? "CONNECTING..."
        : "CONNECT CHAIN ACCOUNT";

  const action = status === "CONNECTED" ? disconnect : connect;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={action}
            disabled={status === "CONNECTING"}
            className="inline-flex min-w-[180px] items-center justify-center rounded-md border border-white/20 bg-black px-4 py-2 text-xs font-mono tracking-wide text-cyan-300 transition-colors hover:border-cyan-400/70 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status === "CONNECTED" ? "Disconnect" : "Connect"} chain session</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
