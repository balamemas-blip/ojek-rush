// Ojek Rush — best score, kept in the browser's local storage.
// Nothing leaves the machine; a fresh browser simply starts at zero.

const BEST_KEY = 'ojek-rush-best-rupiah';
const BEST_DELIVERIES_KEY = 'ojek-rush-best-deliveries';

export function loadBest() {
  try {
    const saved = window.localStorage.getItem(BEST_KEY);
    const value = saved === null ? 0 : parseInt(saved, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (error) {
    return 0;
  }
}

export function saveBest(rupiah) {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.floor(rupiah)));
  } catch (error) {
    // Private mode or disabled storage: the score just is not kept.
  }
}

// Most deliveries finished in one shift, also kept locally.
export function loadBestDeliveries() {
  try {
    const saved = window.localStorage.getItem(BEST_DELIVERIES_KEY);
    const value = saved === null ? 0 : parseInt(saved, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (error) {
    return 0;
  }
}

export function saveBestDeliveries(count) {
  try {
    window.localStorage.setItem(BEST_DELIVERIES_KEY, String(Math.floor(count)));
  } catch (error) {
    // Private mode or disabled storage: the record just is not kept.
  }
}

// Rupiah with thousands separators, as written in Indonesia: Rp 12.500.
export function formatRupiah(rupiah) {
  return 'Rp ' + Math.floor(rupiah).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
