// Calendar-day arithmetic uses UTC ordinals to avoid DST and timezone jumps.
const DAY = 86400000;
const ordinal = key => Date.parse(`${key}T00:00:00Z`) / DAY;
const keyOf = day => new Date(day * DAY).toISOString().slice(0, 10);
function monday(day) {
  const weekday = new Date(day * DAY).getUTCDay();
  return day - (weekday + 6) % 7;
}

// One automatic grace day per Monday–Sunday week. Grace protects a run,
// but only actual check-in days increase the number. Today is never overdue.
export function streakSummary(keys, today) {
  const end = ordinal(today);
  const active = new Set(keys.filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .map(ordinal).filter(day => Number.isFinite(day) && day <= end));
  const total = active.size;
  if (!total) return {count:0,total:0,todayDone:false,graceDates:[],graceAvailable:true};
  let count = 0;
  let graceDates = [];
  const usedWeeks = new Set();
  const lastClosedDay = active.has(end) ? end : end - 1;
  for (let day = Math.min(...active); day <= lastClosedDay; day++) {
    if (active.has(day)) {
      count++;
    } else if (count > 0 && !usedWeeks.has(monday(day))) {
      usedWeeks.add(monday(day));
      graceDates.push(keyOf(day));
    } else {
      count = 0;
      graceDates = [];
    }
  }
  return {count,total,todayDone:active.has(end),graceDates,
    graceAvailable:!usedWeeks.has(monday(end))};
}
