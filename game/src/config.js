// Warung Rush — config: dishes, timings, prices, layout.
// One place for every number the game tunes from.

export const VIEW = { w: 1280, h: 720 };

export const DAY = {
  lengthSeconds: 150, // the dinner rush lasts this long
  targetServed: 12, // serve this many orders to win the day
  hearts: 3, // angry customers cost one heart each
};

export const DISHES = {
  nasi: { name: 'Nasi Goreng', short: 'NASI', cookSeconds: 4.0, price: 12, color: '#e8a13a', key: '1' },
  mie: { name: 'Mie Ayam', short: 'MIE', cookSeconds: 5.0, price: 10, color: '#d95f43', key: '2' },
  teh: { name: 'Es Teh', short: 'TEH', cookSeconds: 2.5, price: 5, color: '#7fb069', key: '3' },
};

export const DISH_KEYS = ['nasi', 'mie', 'teh'];

// Customers: how fast they come, how long they wait, how often they order two items.
export const CUSTOMERS = {
  firstArriveSeconds: 2,
  arriveIntervalStart: 7, // seconds between arrivals at day start
  arriveIntervalEnd: 3.5, // seconds between arrivals at day end
  patienceStart: 42, // seconds of patience at day start
  patienceEnd: 26, // seconds of patience at day end
  doubleOrderChanceStart: 0.2,
  doubleOrderChanceEnd: 0.5,
  sitDelaySeconds: 0.8, // time between sitting down and showing the order
};

// Layout of the warung scene (canvas 1280x720).
export const LAYOUT = {
  hudHeight: 60,
  railY: 64, // order tickets rail
  railHeight: 56,
  tables: [
    { x: 170, y: 300 },
    { x: 470, y: 300 },
    { x: 770, y: 300 },
    { x: 1070, y: 300 },
  ],
  tableRadius: 78,
  kitchenY: 500, // top of the kitchen row
  kitchenHeight: 150,
  stations: [
    { dish: 'nasi', x: 200, w: 240, label: 'WOK — Nasi Goreng' },
    { dish: 'mie', x: 520, w: 240, label: 'PANCI — Mie Ayam' },
    { dish: 'teh', x: 840, w: 240, label: 'KULKAS — Es Teh' },
  ],
};

// Tip: up to +50% of the order price, scaled by patience left, times combo.
export const TIP = { maxBonus: 0.5, comboStep: 0.1, comboCap: 0.5 };

export const COLORS = {
  wall: '#f7e8c9',
  floor: '#d9a05b',
  floorLine: '#c78d4e',
  awningA: '#c0392b',
  awningB: '#f5f0e1',
  table: '#8b5a2b',
  tableTop: '#a9713f',
  chair: '#6b4a2f',
  hudBg: '#3d2b1f',
  hudText: '#ffe9b8',
  counter: '#5d4037',
  counterTop: '#795548',
  station: '#4e342e',
  stationReady: '#2e7d32',
  railBg: '#efe0bd',
  title: '#c0392b',
  good: '#2e7d32',
  bad: '#c0392b',
};
