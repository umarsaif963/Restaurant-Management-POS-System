/**
 * Shared sample dataset for the illustrative product previews on the public
 * website. Every preview draws from this single file so dishes, prices, order
 * numbers and totals stay consistent wherever they appear. Nothing here is
 * live application data - previews are labelled as illustrative.
 */

export const SAMPLE_VENUE = 'Bella Vista';

export type SampleCategory = 'Starters' | 'Mains' | 'Desserts' | 'Drinks';

export interface SampleDish {
  name: string;
  price: number;
  category: SampleCategory;
  /** Short prep hint shown under the name on the POS grid. */
  note: string;
}

export const SAMPLE_CATEGORIES: SampleCategory[] = ['Starters', 'Mains', 'Desserts', 'Drinks'];

export const SAMPLE_DISHES: SampleDish[] = [
  { name: 'Burrata & Tomato', price: 12.5, category: 'Starters', note: 'Plate' },
  { name: 'Garlic Bread', price: 6.0, category: 'Starters', note: 'Grill' },
  { name: 'Calamari Fritti', price: 11.0, category: 'Starters', note: 'Fryer' },
  { name: 'Bruschetta', price: 8.5, category: 'Starters', note: 'Cold' },
  { name: 'Rigatoni Amatriciana', price: 17.0, category: 'Mains', note: 'Pasta' },
  { name: 'Margherita Pizza', price: 14.0, category: 'Mains', note: 'Pizza oven' },
  { name: 'Grilled Salmon', price: 23.5, category: 'Mains', note: 'Grill' },
  { name: 'Chicken Milanese', price: 19.0, category: 'Mains', note: 'Fryer' },
  { name: 'Tiramisu', price: 8.0, category: 'Desserts', note: 'Cold' },
  { name: 'Panna Cotta', price: 7.5, category: 'Desserts', note: 'Cold' },
  { name: 'Espresso', price: 3.0, category: 'Drinks', note: 'Bar' },
  { name: 'House Red (glass)', price: 7.0, category: 'Drinks', note: 'Bar' },
];

export interface SampleTicketLine {
  name: string;
  qty: number;
  price: number;
}

export interface SampleTicket {
  id: string;
  table: string;
  server: string;
  lines: SampleTicketLine[];
  /** Minutes since the ticket was opened - drives the KDS elapsed badges. */
  minutes: number;
  status: 'Cooking' | 'Ready' | 'Served';
}

export const SAMPLE_TICKETS: SampleTicket[] = [
  {
    id: '#1042',
    table: 'Table 7',
    server: 'Maya',
    minutes: 3,
    status: 'Cooking',
    lines: [
      { name: 'Margherita Pizza', qty: 1, price: 14.0 },
      { name: 'House Red (glass)', qty: 2, price: 7.0 },
    ],
  },
  {
    id: '#1043',
    table: 'Table 3',
    server: 'Dan',
    minutes: 9,
    status: 'Cooking',
    lines: [
      { name: 'Grilled Salmon', qty: 1, price: 23.5 },
      { name: 'Burrata & Tomato', qty: 1, price: 12.5 },
      { name: 'Espresso', qty: 2, price: 3.0 },
    ],
  },
  {
    id: '#1044',
    table: 'Pickup',
    server: 'Counter',
    minutes: 14,
    status: 'Ready',
    lines: [
      { name: 'Chicken Milanese', qty: 2, price: 19.0 },
      { name: 'Garlic Bread', qty: 1, price: 6.0 },
    ],
  },
];

/** Sum of the illustrative open ticket on the POS preview. */
export const SAMPLE_TICKET_TOTAL = SAMPLE_TICKETS[1].lines.reduce(
  (sum, line) => sum + line.qty * line.price,
  0,
);

export const SAMPLE_STATS = [
  { label: 'Net sales today', value: '$4,281.50', delta: '+12.4%' },
  { label: 'Orders', value: '168', delta: '+9.1%' },
  { label: 'Average ticket', value: '$25.48', delta: '+3.0%' },
  { label: 'Table turn', value: '47 min', delta: '-4 min' },
];

/** Hourly sales bars for the reports preview (relative heights, 0-100). */
export const SAMPLE_SALES_BARS = [
  { hour: '11a', value: 24 },
  { hour: '12p', value: 58 },
  { hour: '1p', value: 72 },
  { hour: '2p', value: 46 },
  { hour: '3p', value: 22 },
  { hour: '4p', value: 18 },
  { hour: '5p', value: 38 },
  { hour: '6p', value: 64 },
  { hour: '7p', value: 88 },
  { hour: '8p', value: 100 },
  { hour: '9p', value: 76 },
  { hour: '10p', value: 41 },
];

export const SAMPLE_TOP_DISHES = [
  { name: 'Margherita Pizza', orders: 42, revenue: '$588.00' },
  { name: 'Rigatoni Amatriciana', orders: 31, revenue: '$527.00' },
  { name: 'Grilled Salmon', orders: 24, revenue: '$564.00' },
  { name: 'Calamari Fritti', orders: 22, revenue: '$242.00' },
];

/** Payment mix shown on the reports preview. Percentages sum to 100. */
export const SAMPLE_PAYMENT_MIX = [
  { label: 'Card', share: 64 },
  { label: 'Cash', share: 27 },
  { label: 'Other', share: 9 },
];
