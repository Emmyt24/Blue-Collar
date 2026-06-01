"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { useWallet } from "@/context/WalletContext";

export default function TestnetFaucetButton() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "TESTNET";

  if (!isTestnet || !publicKey) return null;

  const fundWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fund wallet");
      }

      const data = await response.json();
      toast({
        title: "Wallet Funded!",
        description: `Successfully received testnet XLM. Transaction: ${data.hash}`,
        type: "success",
      });
    } catch (error) {
      console.error("[TestnetFaucetButton] error:", error);
      toast({
        title: "Error",
        description: "Failed to fund wallet. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={fundWallet}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Zap size={16} />
      {isLoading ? "Funding..." : "Fund Wallet (Testnet)"}
    </Button>
  );
}
