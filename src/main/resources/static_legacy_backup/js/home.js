const palette = [
  "#1d6f42", "#f2994a", "#2c5c8a", "#a5680f", "#6a3d9a",
  "#c0392b", "#16a085", "#8e44ad", "#2980b9", "#d35400",
];

function renderBarChart(canvasId, labels, values, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

function renderLineChart(canvasId, labels, values, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: "#1d6f42",
          backgroundColor: "rgba(29, 111, 66, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

async function loadHomeData() {
  const alertBox = document.getElementById("alert-box");
  try {
    const [summary, byDomain, byUniversity, trend] = await Promise.all([
      apiFetch("/analytics/summary"),
      apiFetch("/analytics/by-domain"),
      apiFetch("/analytics/by-university"),
      apiFetch("/analytics/trend?period=monthly"),
    ]);

    const statsMount = document.getElementById("summary-stats");
    const statCards = [
      { label: "Total Challenges Reported", value: summary.totalChallenges },
      ...summary.labels.map((label, i) => ({ label: formatEnum(label), value: summary.values[i] })),
    ];
    statsMount.innerHTML = statCards
      .map(
        (s) => `<div class="card stat"><div class="value">${s.value}</div><div class="label">${escapeHtml(
          s.label
        )}</div></div>`
      )
      .join("");

    renderBarChart("chart-domain", byDomain.labels.map(formatEnum), byDomain.values, "Challenges");
    renderBarChart("chart-university", byUniversity.labels, byUniversity.values, "Challenges");
    renderLineChart("chart-trend", trend.labels, trend.values, "Challenges");
  } catch (err) {
    showAlert(alertBox, err.message || "Unable to load analytics right now.", "error");
  }
}

renderNav("home");
loadHomeData();
