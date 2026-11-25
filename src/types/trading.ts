export type NavTabId = "more" | "trade" | "home" | "preorder" | "deals";

export type TradeSide = "buy" | "sell";

export type TradeStatus = "pending" | "approved" | "rejected";

export interface BoardSymbol {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  buyPrice: number;
  sellPrice: number;
  href?: string;
}

export interface GoldProduct {
  id: string;
  name: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  purity?: string;
}

export interface SampleTrade {
  id: string;
  productName: string;
  side: TradeSide;
  amount: string;
  price: number;
  total: number;
  time: string;
  status: TradeStatus;
}
