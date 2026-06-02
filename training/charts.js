let distanceChart = null;

function chartDatasetFromSessions() {
  const sessions = getAllSessions().filter((s) => s.finishedAt !== null);
  const allKicks = getAllKicks();
  return sessions
    .map((s) => ({ session: s, summary: sessionSummary(s, allKicks) }))
    .filter((row) => row.summary.count > 0)
    .sort((a, b) =>
      (a.session.finishedAt || '').localeCompare(b.session.finishedAt || '')
    );
}

function chartLabel(session) {
  const [, m, d] = session.date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function buildDistanceChartConfig(labels, distances) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Avg Distance',
          data: distances,
          borderColor: '#c8a13c',
          backgroundColor: 'rgba(200, 161, 60, 0.18)',
          borderWidth: 2.5,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#1a1a1a',
          pointBorderColor: '#c8a13c',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleColor: '#e6b94a',
          bodyColor: '#ffffff',
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} yd avg`,
          },
        },
      },
      scales: {
        y: {
          title: { display: true, text: 'Avg distance (yd)', font: { size: 11, weight: 'bold' } },
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            font: { family: 'SF Mono, Menlo, Consolas, monospace', size: 11 },
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'SF Mono, Menlo, Consolas, monospace', size: 11 },
          },
        },
      },
    },
  };
}

function renderDistanceChart() {
  const canvas = document.getElementById('distance-chart');
  const emptyMsg = document.getElementById('distance-chart-empty');
  if (!canvas || !emptyMsg) return;

  const data = chartDatasetFromSessions();
  const labels = data.map(({ session }) => chartLabel(session));
  const distances = data.map(({ summary }) => Number(summary.avgDistance.toFixed(1)));

  if (data.length < 2) {
    canvas.hidden = true;
    emptyMsg.hidden = false;
    emptyMsg.textContent = data.length === 0
      ? 'Finish a session to start tracking your trend.'
      : 'One more session — the trend line needs at least 2 finished sessions.';
    if (distanceChart) {
      distanceChart.destroy();
      distanceChart = null;
    }
    return;
  }

  canvas.hidden = false;
  emptyMsg.hidden = true;

  if (distanceChart) {
    distanceChart.data.labels = labels;
    distanceChart.data.datasets[0].data = distances;
    distanceChart.update();
    return;
  }

  if (typeof Chart === 'undefined') return;
  distanceChart = new Chart(canvas, buildDistanceChartConfig(labels, distances));
}
