const lkr = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 });

/** 4500 -> "Rs. 4,500" */
export function formatLKR(amount) {
  return `Rs. ${lkr.format(Math.round(Number(amount) || 0))}`;
}
