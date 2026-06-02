function bestKick(kicks) {
  if (kicks.length === 0) return null;
  return kicks.reduce((best, k) => (k.distance > best.distance ? k : best), kicks[0]);
}

function groupByDate(kicks) {
  const groups = {};
  kicks.forEach((k) => {
    if (!groups[k.date]) groups[k.date] = [];
    groups[k.date].push(k);
  });
  return groups;
}

function average(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((total, n) => total + n, 0);
  return sum / numbers.length;
}

function bestDailyAverage(kicks) {
  if (kicks.length === 0) return null;
  const groups = groupByDate(kicks);
  let best = null;
  Object.entries(groups).forEach(([date, dayKicks]) => {
    const avg = average(dayKicks.map((k) => k.distance));
    if (best === null || avg > best.average) {
      best = { date, average: avg, count: dayKicks.length };
    }
  });
  return best;
}

function touchbackCounts(kicks) {
  let touchbacks = 0;
  let inside20 = 0;
  kicks.forEach((k) => {
    if (k.result === 'touchback') touchbacks += 1;
    else if (k.result === 'inside20') inside20 += 1;
  });
  return { touchbacks, inside20 };
}
