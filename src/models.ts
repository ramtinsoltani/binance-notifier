export interface AppData {

  config: {
    key?: string;
    secret?: string;
    gilfoyleMode?: boolean;
    markets: {
      [name: string]: number;
    };
  };

  configPath: string;

}

export enum PriceState {

  BelowThreshold,
  AtThreshold,
  AboveThreshold,
  Unknown

}

export interface DataUpdate {

  [market: string]: {
    price: number,
    threshold: number,
    state: PriceState,
    notified: boolean
  };

}
