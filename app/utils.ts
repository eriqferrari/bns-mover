export function shortenAddress(address: string, length: number = 4): string {
  if (address.length <= length * 2) {
    return address; // Return full address if it's already shorter than desired length
  }

  const start = address.slice(0, length);
  const end = address.slice(-length);

  return `${start}...${end}`;
}

interface StxAddresses {
  testnet: string;
  mainnet: string;
}

export function getStxAddress(stxAddress: StxAddresses) {
  if (process.env.NEXT_PUBLIC_NETWORK === 'testnet') {
    return stxAddress.testnet;
  }

  return stxAddress.mainnet;
}

export function getHiroApi() {
  if (process.env.NEXT_PUBLIC_NETWORK === 'testnet') {
    return 'https://api.testnet.hiro.so/extended/v1';
  }

  return 'https://api.hiro.so/extended/v1';
}

export function formatNumber(value: string | number, decimals?: number) {
  // Handle null, undefined, or empty string
  if (!value && value !== 0) return '0';

  const num = Number(value);
  // Handle NaN
  if (isNaN(num)) return '0';

  if (decimals !== undefined) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // For numbers less than 1000, don't add commas
  if (Math.abs(num) < 1000) {
    return num.toString();
  }

  return num.toLocaleString('en-US');
}

export async function estimateRewards(wallet: string) {
  const response = await fetch('/api/cached-calculator');
  const data = await response.json();
  const rewards = data.rewards;
  return rewards.find((reward) => reward.wallet === wallet) || 0;
}
