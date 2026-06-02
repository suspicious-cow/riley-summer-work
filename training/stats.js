function bestKick(kicks) {
  if (kicks.length === 0) return null;
  return kicks.reduce((best, k) => (k.distance > best.distance ? k : best), kicks[0]);
}

function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((s, n) => s + n, 0) / numbers.length;
}

function standardDeviation(numbers) {
  if (numbers.length < 2) return 0;
  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => (n - avg) ** 2);
  const variance = squaredDiffs.reduce((s, d) => s + d, 0) / numbers.length;
  return Math.sqrt(variance);
}

function sessionSummary(session, kicks) {
  const sessionKicks = kicks.filter((k) => k.sessionId === session.id);
  if (sessionKicks.length === 0) {
    return {
      count: 0,
      avgDistance: 0,
      avgHangtime: 0,
      bestDistance: 0,
      bestHangtime: 0,
      stdDevDistance: 0,
    };
  }
  const distances = sessionKicks.map((k) => k.distance);
  const hangtimes = sessionKicks.map((k) => k.hangtime);
  return {
    count: sessionKicks.length,
    avgDistance: average(distances),
    avgHangtime: average(hangtimes),
    bestDistance: Math.max(...distances),
    bestHangtime: Math.max(...hangtimes),
    stdDevDistance: standardDeviation(distances),
  };
}

function allTimeStats(kicks) {
  if (kicks.length === 0) return null;
  const dists = kicks.map((k) => k.distance);
  const sessionIds = new Set(kicks.map((k) => k.sessionId).filter(Boolean));
  return {
    avgDistance: average(dists),
    kickCount: kicks.length,
    sessionCount: sessionIds.size,
  };
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
