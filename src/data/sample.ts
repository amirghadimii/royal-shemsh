import type { BoardSymbol, GoldProduct, SampleTrade } from "@/types/trading";

export const SAMPLE_USER = {
  fullName: "امیر قدیمی",
  isOnline: true,
};

export const SCREEN1_BOARD_SYMBOLS: BoardSymbol[] = [
  {
    id: "naghde-farda",
    name: "نقد فردا",
    badge: "طلا",
    subtitle: "تسویه فردا",
    buyPrice: 44_280_000,
    sellPrice: 44_320_000,
    href: "/trade",
  },
  {
    id: "naghde-pasfarda",
    name: "نقد پس\u200cفردا",
    badge: "طلا",
    subtitle: "تسویه ۲ روزه",
    buyPrice: 44_300_000,
    sellPrice: 44_350_000,
    href: "/trade",
  },
  {
    id: "emami-86",
    name: "سکه امامی ۸۶",
    badge: "طرح جدید",
    subtitle: "۸.۱۳۳ گرم ۲۲ عیار",
    buyPrice: 51_100_000,
    sellPrice: 51_250_000,
  },
  {
    id: "nim-sekkeh",
    name: "نیم سکه",
    badge: "بانکی",
    subtitle: "۴.۰۶۶ گرم ۲۲ عیار",
    buyPrice: 27_400_000,
    sellPrice: 27_550_000,
  },
  {
    id: "rob-sekkeh",
    name: "ربع سکه",
    badge: "بانکی",
    subtitle: "۲.۰۳۳ گرم ۲۲ عیار",
    buyPrice: 17_100_000,
    sellPrice: 17_250_000,
  },
  {
    id: "gerami-banki",
    name: "گرمی بانکی",
    badge: "وکیوم",
    subtitle: "۱.۰۱ گرم ۲۲ عیار",
    buyPrice: 8_400_000,
    sellPrice: 8_500_000,
  },
  {
    id: "usd-cash",
    name: "دلار آمریکا",
    badge: "اسکناس",
    subtitle: "تحویل تهران نقدی",
    buyPrice: 69_200,
    sellPrice: 69_400,
  },
];

export const SAMPLE_PRODUCTS: GoldProduct[] = [
  {
    id: "naghde-farda",
    name: "نقد فردا",
    unit: "تومان / گرم",
    buyPrice: 44_280_000,
    sellPrice: 44_320_000,
    purity: "شمش استانداردی ۲۴ عیار",
  },
];

export const SAMPLE_TRADES: SampleTrade[] = [
  {
    id: "TRD-1042",
    productName: "نقد فردا",
    side: "buy",
    amount: "۱۰ گرم",
    price: 44_280_000,
    total: 442_800_000,
    time: "۱۰:۴۵",
    status: "pending",
  },
];
