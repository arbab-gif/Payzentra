/**
 * Simulated Home data. In the live app these come from the wallet, crypto and
 * activity services; crypto values in naira are indicative and timestamped.
 */

export type TxnKind = "transfer_in" | "transfer_out" | "airtime" | "bill" | "crypto";
export type TxnStatus = "Completed" | "Processing" | "Failed";

export type Txn = {
  id: string;
  kind: TxnKind;
  title: string;
  when: string;
  /** Naira amount in kobo-free units; sign comes from direction. */
  amount: number;
  direction: "in" | "out";
  status: TxnStatus;
  /** Biller shown with its brand badge, e.g. "MTN". */
  merchant?: string;
  /** Coin traded, shown with its logo. */
  coin?: "BTC" | "ETH" | "USDT" | "USDC";
  /** Extra line for crypto, e.g. "+0.00016 BTC". */
  note?: string;
};

export type Asset = {
  code: "NGN" | "BTC" | "USDT";
  name: string;
  /** Amount held in the asset's own unit. */
  quantity: number;
  /** Naira value. Authoritative for NGN, indicative for crypto. */
  ngn: number;
};

export type HomeData = {
  naira: number;
  assets: Asset[];
  /** Indicative naira value of all crypto, or null when there's none. */
  cryptoNgn: number | null;
  pricedAt: string;
  activity: Txn[];
};

const BTC_NGN = 152_400_000;
const USDT_NGN = 1_538;

export const activeHome: HomeData = {
  naira: 248_560.75,
  assets: [
    { code: "NGN", name: "Naira", quantity: 248_560.75, ngn: 248_560.75 },
    { code: "BTC", name: "Bitcoin", quantity: 0.00812, ngn: 0.00812 * BTC_NGN },
    { code: "USDT", name: "Tether", quantity: 150, ngn: 150 * USDT_NGN },
  ],
  cryptoNgn: 0.00812 * BTC_NGN + 150 * USDT_NGN,
  pricedAt: "2 min ago",
  activity: [
    { id: "t1", kind: "transfer_in", title: "Chinedu Okafor", when: "Today, 09:14", amount: 50_000, direction: "in", status: "Completed" },
    { id: "t2", kind: "airtime", merchant: "MTN", title: "MTN airtime", when: "Today, 08:02", amount: 2_000, direction: "out", status: "Completed" },
    { id: "t3", kind: "crypto", coin: "BTC", title: "Bought Bitcoin", when: "Yesterday, 21:47", amount: 25_000, direction: "out", status: "Processing", note: "+0.00016 BTC" },
    { id: "t4", kind: "bill", merchant: "Ikeja Electric", title: "Ikeja Electric", when: "Yesterday, 18:40", amount: 15_000, direction: "out", status: "Failed" },
    { id: "t5", kind: "transfer_out", title: "Amaka Eze", when: "11 Oct, 13:05", amount: 12_500, direction: "out", status: "Completed" },
  ],
};

export const newHome: HomeData = {
  naira: 0,
  assets: [{ code: "NGN", name: "Naira", quantity: 0, ngn: 0 }],
  cryptoNgn: null,
  pricedAt: "just now",
  activity: [],
};

/** 248560.75 → "248,560.75" */
export function money(n: number, decimals = 2) {
  const [int, frac] = Math.abs(n).toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${grouped}.${frac}` : grouped;
}
