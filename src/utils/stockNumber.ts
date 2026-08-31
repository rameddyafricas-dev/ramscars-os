export function generateStockNumber(): string {
  const key = 'ramscars_stock_seq';
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const today = `${y}${m}${d}`;
  let stored: any = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    stored = null;
  }
  let sequence = 1;
  if (stored && stored.date === today) {
    sequence = (stored.sequence || 0) + 1;
  }
  localStorage.setItem(key, JSON.stringify({ date: today, sequence }));
  const seq = sequence.toString().padStart(2, '0');
  return `RC-${today}-${seq}`;
}
