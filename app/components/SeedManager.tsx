"use client";
import React, { useEffect, useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Copy, Loader2, ArrowUpRight, RefreshCw, BadgeCheck, ChevronDown, ChevronLeft, Moon, Sun} from "lucide-react";
import OwnerBox from "@/components/owner-box";
import { ConnectContext } from '@/app/providers/ConnectProvider';
import Link from 'next/link'
import Image from 'next/image'
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  getHiroApi,
  formatNumber,
  shortenAddress,
} from '../utils';
import { decodeFQNToString, decodeFQNSimple } from "@/components/decodeFQNToString";
import { generateWallet, generateSecretKey, getStxAddress, restoreWalletAccounts } from '@stacks/wallet-sdk';
import { TransactionVersion,  makeContractCall ,sponsorTransaction , deserializeTransaction, broadcastTransaction, Cl, Pc} from '@stacks/transactions';
import { bytesToHex } from '@stacks/common';
import BNSicon from "@/assets/images/icon.png"

interface Wallet {
  /** Used when generating app private keys, which encrypt app-specific data */
  salt: string;
  /** The private key associated with the root of a BIP39 keychain */
  rootKey: string;
  /** A private key used to encrypt configuration data */
  configPrivateKey: string;
  /** The encrypted secret key */
  encryptedSecretKey: string;
  /** A list of accounts generated by this wallet */
  accounts: Account[];
}

interface Account {
  /** The private key used for STX payments */
  stxPrivateKey: string;
  /** The private key used in Stacks 1.0 to register BNS names */
  dataPrivateKey: string;
  /** The salt is the same as the wallet-level salt. Used for app-specific keys */
  salt: string;
  /** A single username registered via BNS for this account */
  username?: string;
  /** A profile object that is publicly associated with this account's username */
  profile?: Profile;
  /** The root of the keychain used to generate app-specific keys */
  appsKey: string;
  /** The index of this account in the user's wallet. Zero-indexed */
  index: number;
}




export default function SeedManager() {
  const {
    profile,
    disconnect,
    authenticate,
  } = useContext(ConnectContext);
  const [seed, setSeed] = useState<string[]>([])
  const [mainKey, setMainKey] = useState<string>("")
  const [ready, setReady] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [wallet, setWallet] = useState<Wallet>({salt: "", rootkey: "", configPrivateKey: "", encryptedSecretKey: "", accounts: []})
  const [total, setTotal] = useState<number>(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [fee, setFee] = useState<string>("0.0005")
  const [page, setPage] = useState<number>(1)
  const [pages, setPages] = useState<number>(1)
  const [limit,setLimit] = useState<number>(10)
  const [sponsorBalance,setSponsorBalance] = useState<number>(0)
  const [open, setOpen] = useState<boolean>(true)
  const { theme, setTheme } = useTheme();


  useEffect(() => {
    if (seed.length > 0) {setLoading(true); generate()}
    else {setWallet({salt: "", rootkey: "", configPrivateKey: "", encryptedSecretKey: "", accounts: []}); setReady(false)}
  }, [seed])

  useEffect(() => {
    setLoading(true)
    const start = (page -1) * limit 
    const end = start + limit 
    setActiveAccounts(accounts.slice(start, end))
    setTimeout(()=> setLoading(false), 300)
  }, [page])

  const generate = async () => {
    const password = '';
    const secretKey = seed.join(" ") // generateSecretKey();

    const w = await generateWallet({
      secretKey,
      password,
    });
    
    const restoredWallet = await restoreWalletAccounts({
      wallet: w,
      gaiaHubUrl: 'https://hub.blockstack.org',
      network: "mainnet",
    });

    const accs = restoredWallet.accounts
    const sponsorAcc = getStxAddress({ account: accs[0], transactionVersion: "mainnet" })
    const url = `${getHiroApi()}/address/${sponsorAcc}/balances?unanchored=true`;
    getBalance(url); 
    setWallet(restoredWallet)
    setTotal(accs.length)
    setAccounts(accs)
    setMainKey(accs[0].stxPrivateKey)
    setActiveAccounts(accs.slice(0,limit))
    setPages(Math.ceil(accs.length / limit))
    setLoading(false)
    setReady(true)
  }

  const handleSeedChange = async (value: string) => {
    let splitted = []
    if (value.includes(";")) {splitted = value.split(";")}
    else if (value.includes(",")) {splitted = value.split(",")}
    else if (value.includes(" ")) {splitted = value.split(" ")}
    
    if (splitted.length === 12 || splitted.length === 24) {setSeed(splitted); }
    else {setSeed([])}
  }

  const getAddress = (index: number) => {
    if (!ready) {return}
    const account = wallet.accounts[index]
    return getStxAddress({ account, transactionVersion: "mainnet" })
  }

  const getBalance = async (url: string) => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    setSponsorBalance(json.stx.balance)

   
  };

  const NavBar = () => {
    return (
      <div className="flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center justify-start text-2xl">
          <Image
            src={BNSicon.src}
            className="mr-2 w-12"
            title="BNS logo"
            alt="BNS logo"
            width={48}
            height={48}
          />
          BNS Mover
        </Link>
        <span>
        <Button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          variant="ghost" size="icon"
          className="mr-4 p-0"
          >
          {theme === 'dark' ? <Sun className="w-6 h-6 animate-in fade-in" /> : <Moon className="w-6 h-6 animate-in fade-in" />}
        </Button>
        {!profile ? 
          <Button 
            onClick={authenticate}
          >
          Connect
          </Button>
          :
          <Button 
            onClick={() => {disconnect(); window.location.reload();}}
          >
          disconnect
          </Button>
        }
        </span>
      </div>

      )
  }

  const refresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const handleFee = (value: string) => {
    if (value.length > 8) {return}
    const numericValue = parseFloat(value);
    setFee(isNaN(numericValue) ? '' : value);
  }

  const displayAccounts = () => {
    const list = []
    for (var i = 0; i < activeAccounts.length; i++) {
      const account = activeAccounts[i]
      list.push({index: 1 + i + ((page -1) * limit),account, address: getStxAddress({ account, transactionVersion: "mainnet" })})
    }
    
    return (
        <div className="p-4 border border-gray-500/10 rounded-xl mt-4 bg-white/20 dark:bg-white/5">
          <h4 className="p-4 border-gray-500/10 border-b flex justify-between items-center">
          <span className="flex items-center">
            Active accounts: {total} <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} onClick={refresh}/>
          </span>
          <span className="flex items-center">
            Transfer Fee
            <Input
              className="text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
              type="text"
              pattern="^[0-9]*[.]?[0-9]*$"
              onChange={(e) => handleFee(e.target.value)}
              className="h-10 bg-white text-black p-2"
              placeholder="0.00"
              value={fee}
            />
            <span className="flex items-center"><span className="absolute text-gray-500 -ml-10">STX</span></span>
          </span>
          </h4>
          {loading ? 
            <div className="flex items-center justify-center p-4 mt-4 ">
              <Loader2 className="w-10 h-10 my-16 animate-spin" />
            </div>
            : 
            <ul>
            {list.map((li) => 
              <li key={li.index} className="px-4 py-6 flex items-center gap-4 border-gray-500/10 border-b">
              <span className="whitespace-nowrap py-2 w-1/4 flex items-center">
              
              Account #{li.index}:
              {li.index === 1 && 
                <TooltipProvider delayDuration={0}>
                  <Tooltip >
                    <TooltipTrigger asChild >
                      <BadgeCheck className={`w-4 h-4 ml-1 ${sponsorBalance > 0 ? "text-green-500" : "text-gray-400"}`}/>
                      </TooltipTrigger>
                    <TooltipContent className="text-white">
                      {`Sponsor Wallet: balance: ${sponsorBalance / 10**6} STX` }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>}
              </span>
              <span className="whitespace-nowrap py-2 w-1/4">
                <OwnerBox owner={li.address || ""} view="long"/>
              </span>
              <WalletNames address={li.address} user={profile.stxAddress.mainnet} account={li.account} mainKey={mainKey} fee={Number(fee) * 10**6}/>
              </li>
              )}
            </ul>
          }
          <div className="flex justify-between items-center p-4 mt-4">

            <Button 
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
            >
            Previous
            </Button>
            <span className="text-sm text-gray-500">
            Page {page} of {pages}
            </span>
            <Button 
              onClick={() => setPage(page + 1)}
              disabled={page === pages}
              variant="outline"
            >
            Next
            </Button>

          </div>
        </div>
      )
  }

  if (!profile) {
    return (
        <main className="container mx-auto max-w-4xl px-8 py-8 ">
        {NavBar()}
        <section className="flex flex-col gap-4 mt-8">
          <div className="flex w-full flex-1 flex-wrap items-center gap-4 mt-16">
            Connect the wallet where you want to receive your BNS Names
          
          </div>
         
        </section>
        </main>
      )
  }

  return (
    <main className="container mx-auto max-w-4xl px-8 py-8">
      {NavBar()}
      <section className="flex flex-col gap-4 mt-8">
        <div className="flex w-full flex-1 flex-wrap items-center gap-4">
          <h1 className="mt-0 text-4xl -ml-2">{/*<ProfilePicture />*/}<OwnerBox owner={profile.stxAddress.mainnet || ""} view="string"/></h1>
        
        </div>
        <div className="-mt-4 inline-flex items-center gap-2 text-gray-500">
          <OwnerBox owner={profile.stxAddress.mainnet || ""} view="long"/>
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h4 className="flex items-center justify-between" >How it works
        {open ? <ChevronDown className="w-4 h-4" onClick={()=> setOpen(false)} /> : <ChevronLeft className="w-4 h-4" onClick={()=> setOpen(true)} />}
        </h4>
        {open && 
        <>
        <span className="text-sm text-gray-500 flex w-full">Connect the wallet where you want to receive your BNS Names</span>
        <span className="text-sm text-gray-500 flex w-full">Paste your seed phrase in the text area</span>
        <span className="text-sm text-gray-500 flex w-full">Fund Account #1 to sponsor all the transactions fees</span>
        <span className="text-sm text-gray-500 flex w-full">Set the transaction Fee (min. suggested 0.0005 STX)</span>
        <span className="text-sm text-gray-500 flex w-full">Click to Transfer your airdropped Name
          <TooltipProvider delayDuration={0}>
            <Tooltip >
              <TooltipTrigger asChild >
                <Info className={`w-4 h-4 ml-1`}/>
              </TooltipTrigger>
              <TooltipContent className="text-white w-[200px]">
                This tool is designed to facilitate the transfer of large quantities of airdropped BNS names to a single address. It only works if the address holds a single name

              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
        </>
        }
        
        <span className="text-sm text-gray-500 flex w-full p-4"></span>
        <Textarea 
            id="seed-phrase"
            className="resize-x-none border-gray-900 focus:border-gray-500 bg-gray-300/40 dark:bg-gray-300/5 focus:bg-transparent blur-md focus:blur-none shadow-sm"
            placeholder={"Paste your seed phrase here..."}
            value={seed.join(" ").toString()}
            onChange={(e) => handleSeedChange(e.target.value)}
        />

      </section>

      <div className="flex flex-col gap-10">
        {!ready && loading && 
          <div className="flex items-center justify-center p-4 mt-4 ">
              <Loader2 className="w-10 h-10 my-16 animate-spin" />
          </div>
        }

        {ready && displayAccounts() }
      </div>
    </main>
  );
}



function WalletNames({address, user, account, mainKey, fee}) {

const [names, setNames] = useState<Domain[]>([])
const [total, setTotal] = useState<number>(0)
const [id, setId] = useState<number>(0)
const [loaded, setLoaded] = useState<boolean>(false)
const [ready, setReady] = useState<boolean>(false)
const [done, setDone] = useState<boolean>(false)
const [isSending, setSending] = useState<boolean>(false)

useEffect(() => {
    if (address && !loaded) {setLoaded(true); fetchNames(); }

  }, [address])

const fetchId = async (fullname: string) => {
    const res = await fetch("https://api.bnsv2.com/names/"+fullname+"/id", {next: {revalidate: 60}})
    const results = await res.json()
    setId(Number(results.id))
}

const fetchNames = async () => {
    const res = await fetch("https://api.bnsv2.com/names/address/"+address+"/valid", {next: {revalidate: 60}})
    const results = await res.json()
    setNames(results.names)
    setTotal(results.total)
    if (results.total === 1) {fetchId(results.names[0].full_name)}
    setReady(true)
}



const handleTransfer = async (id: number) => {
setSending(true)
const nftConditions = Pc.principal(address).willSendAsset().nft("SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF.BNS-V2::BNS-V2", Cl.uint(id));

const txOptions = {
    contractAddress: 'SP2QEZ06AGJ3RKJPBV14SY1V5BBFNAW33D96YPGZF',
    contractName: 'BNS-V2',
    functionName: 'transfer',
    functionArgs: [Cl.uint(Number(id)), Cl.standardPrincipal(address), Cl.standardPrincipal(user)],
    senderKey: account.stxPrivateKey,
    fee: 0,
    postConditions: [nftConditions],
    validateWithAbi: true,
    sponsored: true,
    network: "mainnet",

  };

const transaction = await makeContractCall(txOptions);
const serializedTx = bytesToHex(transaction.serializeBytes());

const deserializedTx = deserializeTransaction(serializedTx);
const sponsorOptions = {
  transaction: deserializedTx,
  sponsorPrivateKey: mainKey,
  fee: fee,
  network: "mainnet",
};
const sponsoredTx = await sponsorTransaction(sponsorOptions);

const broadcastResponse = await broadcastTransaction({
  transaction: sponsoredTx,
});

// const broadcastResponse = await broadcastTransaction({transaction} );

const txId = broadcastResponse.txid;
setDone(true)
setSending(false)

}





if (!ready || !address) {
  return (
    <Loader2 className="w-4 h-4 ml-2 animate-spin"/>
    )
}

if (total === 0 ) {
  return (
    <span className="flex justify-end w-1/2 text-gray-500 text-sm">No names found</span>
    )
}

if (total > 1) {
  return (
    <span className="flex w-1/2 items-center justify-between">Names: {total}
    <Link 
      target="_blank"
      title="View Wallet on BNS One"
      href={"https://bns.one/wallet/"+address}
      className="text-sm text-gray-300 hover:text-gray-400 hover:underline"
    >
    View on BNS One
    </Link>
    </span>
    )
}

return (
  <span className="flex w-1/2 items-center justify-between">
  {decodeFQNToString(names[0].full_name)}
  <Button 
    className="text-sm flex items-center"
    disabled={done || fee === 0}
    onClick={()=> handleTransfer(id)}
  >
  {isSending ? <Loader2 className="w-3 h-3 mx-6 animate-spin" /> : done ? "Tx sent" : "Transfer"}
  </Button>
  </span>
  )


}