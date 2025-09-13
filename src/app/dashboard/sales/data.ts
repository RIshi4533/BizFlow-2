
export type DealStatus = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

export type DealProduct = {
  sku: string;
  quantity: number;
  name: string;
};

export type Deal = {
  id: string;
  title: string;
  client: string;
  value: number;
  status: DealStatus;
  products: DealProduct[];
};
