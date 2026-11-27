export interface HomeGoldTickInput {
  productId: string;
  buyPrice: string | number;
  sellPrice: string | number;
}

export interface NormalizedHomeGoldTick {
  productId: string;
  buyPrice: string;
  sellPrice: string;
  receivedAt: Date;
  adapterName: string;
}

export const HOMEGOLD_ADAPTER = "HOMEGOLD_ADAPTER";

export interface HomeGoldAdapter {
  readonly name: string;
  buildSampleTick(input: HomeGoldTickInput): NormalizedHomeGoldTick;
}
