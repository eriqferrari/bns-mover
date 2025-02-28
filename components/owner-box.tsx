"use client";

import { useEffect, useState } from "react";

import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, ExternalLink } from "lucide-react";
import { decodeFQNTruncated } from "@/components/decodeFQNToString";
import { useRouter } from "next/navigation";
import { getPrimaryName } from 'bns-v2-sdk';

function truncateAddress(address: string) {
  return `${address.slice(0,5)}...${address.slice(-5)}`
}

export default function OwnerBox({
  owner,
  view,
}: {
  owner: string;
  view: "box" | "flat" | "string" | "long";
}) {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [resolution, setResolution] = useState<string>(owner);
  const [copied, setCopied] = useState<boolean>(false);
  const router = useRouter()

  useEffect(() => {
    const fetchResolution = async () => {
      try {
        const priRes = await getPrimaryName({address: owner, network: "mainnet"})
        let reverse = ""
        if (priRes?.name) {
          reverse = `${priRes?.name}.${priRes?.namespace}` 
        }
        setResolution(reverse || truncateAddress(owner));
      } catch (error) {
        console.error("Failed to resolve address:", error);
        setResolution(truncateAddress(owner));
      } finally {
        setLoaded(true);
      }
    };

    fetchResolution();
  }, [owner]);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(owner).then(() => {
      setCopied(true);
      setTooltipOpen(true);
      setTimeout(() => {
        setTooltipOpen(false); // Close the tooltip after 1 second
      }, 1000);
    });
  };
  const handlePointerLeave = () => {
    setTooltipOpen(false)
    setCopied(false);
  };



  return (
    <div className={`cursor-pointer ${view === "long" ? "text-left inline-flex items-center" : view === "string" ? "text-current px-2" : view === "flat" ? "text-left inline-flex items-center" : 
    "rounded-xl border border-white/40 bg-slate-900/40 px-2 py-1 text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 shadow-sm"}`}
      onClick={(e) => {e.stopPropagation(); router.push("https://bns.one/wallet/"+owner)}}
      >
      {!loaded ? "" : view === "long" ? truncateAddress(owner) : decodeFQNTruncated(resolution)}
      {view !== "box" && view !== "string" && loaded && (
          <>
          <TooltipProvider delayDuration={0}>
            <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
              <TooltipTrigger asChild onPointerLeave={handlePointerLeave}>
                <Copy
                  onClick={(e) => {e.stopPropagation(); handleCopy()}}
                  className={`w-4 h-4 ml-1 cursor-pointer opacity-70 transition-opacity duration-200 hover:opacity-100 ${
                    copied ? "stroke-green-500" : "stroke-current"
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent
                className={`text-sans text-sm ${
                  copied ? "text-green-500" : "text-white"
                }`}
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip >
              <TooltipTrigger asChild >
                <ExternalLink className="w-4 h-4 ml-1 opacity-70 transition-opacity duration-200 hover:opacity-100 cursor-pointer"
                              onClick={(e) => {e.stopPropagation(); window.open(`https://explorer.hiro.so/address/${owner}?chain=mainnet`, "_blank")}}/>

                </TooltipTrigger>
              <TooltipContent className="text-white">
                {`View ${resolution?.startsWith("0x") ? owner : resolution} on Hiro Explorer` }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          </>
        )}
    </div>
  );
}
