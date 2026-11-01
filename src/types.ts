export type PfandType = {
  id: string;
  label: string;
  amountCents: number;
};

export type HappyHour = {
  startMinutes: number;
  endMinutes: number;
  priceCents: number;
};

export type Drink = {
  id: string;
  iconName: string;
  label: string;
  size: string;
  priceCents: number;
  pfandTypeId: string | null;
  happyHour?: HappyHour;
  /** Anfangsbestand. null/undefined = unbegrenzt. */
  stockStart?: number | null;
};

export type OrderLine = { drinkId: string; qty: number };
export type ReturnLine = { pfandTypeId: string; qty: number };

export type State = {
  drinks: Drink[];
  pfandTypes: PfandType[];
  order: OrderLine[];
  returns: ReturnLine[];
};
