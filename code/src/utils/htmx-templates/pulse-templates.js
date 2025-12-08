/**
 * HTMX Templates for Pulse Analytics (Instructor View)
 * code/src/utils/htmx-templates/pulse-templates.js
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Get emoji for pulse value
 * @param {number} value - Pulse value (1-5)
 * @returns {string} Emoji string
 */
function getPulseEmoji(value) {
  const emojis = {
    1: "😞",
    2: "😐",
    3: "🙂",
    4: "😃",
    5: "🤩",
  };
  return emojis[value] || "🙂";
}

/**
 * Format date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date as short (MM/DD)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted short date string
 */
function formatDateShort(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });
}

/**
 * Render pulse analytics page
 * @param {Object} data
 * @param {Object} data.classInfo - Class information
 * @param {number} data.range - Current time range (1, 7, or 30)
 * @param {Array} data.analyticsData - Array of {date, averagePulse, count}
 * @param {Object} data.summaryAverages - {day1, day7, day30}
 * @param {string|null} data.selectedDate - Currently selected date for details
 * @param {Array} data.detailsData - Array of student pulse entries for selected date
 * @returns {string} HTML string for pulse analytics page
 */
export function renderPulseAnalyticsPage(data) {
  const {
    classInfo,
    range = 7,
    analyticsData = [],
    summaryAverages = {},
    selectedDate = null,
    detailsData = [],
  } = data;

  const summaryCards = renderSummaryCards(summaryAverages);
  const chartContainer = renderChartContainer(
    classInfo.id,
    range,
    analyticsData,
    selectedDate,
  );
  const detailsTable = renderDetailsTable(
    classInfo.id,
    selectedDate,
    detailsData,
  );

  return `
    <div class="pulse-analytics-container">
      <div class="pulse-analytics-header" style="margin-bottom: var(--space-6);">
        <h2 style="font-size: var(--text-2xl); font-weight: var(--weight-bold);">
          Pulse Analytics
        </h2>
      </div>

      <!-- Summary Cards -->
      <div class="pulse-summary-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
        ${summaryCards}
      </div>

      <!-- Range Filter -->
      <div class="pulse-range-filter" style="margin-bottom: var(--space-6);">
        <div class="segmented-control" style="display: inline-flex; background: var(--color-bg-canvas); border-radius: var(--radius-md); padding: 4px; gap: 4px;">
          ${renderRangeButtons(classInfo.id, range, selectedDate)}
        </div>
      </div>

      <!-- Chart Container -->
      <div id="pulse-chart-container" class="bento-card" style="margin-bottom: var(--space-6);">
        ${chartContainer}
      </div>

      <!-- Details Table -->
      <div id="pulse-details-container" class="pulse-details-container">
        ${detailsTable}
      </div>
    </div>

    <style>
      .pulse-analytics-container {
        padding: var(--space-4);
      }

      .segmented-control-button {
        padding: var(--space-2) var(--space-4);
        border: none;
        background: transparent;
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s;
      }

      .segmented-control-button.active {
        background: var(--color-brand-deep);
        color: white;
      }

      .pulse-chart {
        min-height: 220px;
        position: relative;
      }

      .pulse-details-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-bg-surface);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }

      .pulse-details-table th {
        background: var(--color-bg-canvas);
        padding: var(--space-3);
        text-align: left;
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        color: var(--color-text-muted);
        border-bottom: 1px solid var(--color-border);
      }

      .pulse-details-table td {
        padding: var(--space-3);
        border-bottom: 1px solid var(--color-border);
        font-size: var(--text-sm);
      }

      .pulse-details-table tr:last-child td {
        border-bottom: none;
      }

      .pulse-emoji-display {
        font-size: var(--text-lg);
        margin-right: var(--space-2);
      }

      .pulse-chart-point:hover {
        r: 8;
        fill: var(--color-brand-medium);
      }
    </style>

    <script>
      function loadPulseDetails(classId, date) {
        // Reload the analytics page with the selected date
        const currentRange = ${range};
        const currentDate = '${selectedDate || ""}';
        
        // Toggle date selection - if same date is clicked, clear it
        const newDate = currentDate === date ? '' : date;
        const newUrl = '/classes/' + classId + '/pulse/page?range=' + currentRange + (newDate ? '&date=' + newDate : '');
        
        // Use HTMX to reload the tab content
        if (typeof htmx !== 'undefined') {
          htmx.ajax('GET', newUrl, {
            target: '#tab-content',
            swap: 'innerHTML'
          });
        } else {
          // Fallback: full page reload
          window.location.href = newUrl;
        }
      }

      // Update active tab state when pulse analytics loads
      (function() {
        // Mark pulse tab as active
        const pulseTab = document.querySelector('a[href*="/pulse/page"]');
        if (pulseTab) {
          // Remove active from all tabs
          document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
            tab.style.color = 'var(--color-text-muted)';
            tab.style.borderBottom = '2px solid transparent';
          });
          
          // Mark pulse tab as active
          pulseTab.classList.add('active');
          pulseTab.style.color = 'var(--color-brand-deep)';
          pulseTab.style.borderBottom = '2px solid var(--color-accent-gold)';
        }
      })();
    </script>
  `;
}

/**
 * Render summary cards
 * @param {Object} summaryAverages - Object with day1, day7, day30 average pulse values
 * @returns {string} HTML string for summary cards
 */
function renderSummaryCards(summaryAverages) {
  const { day1 = null, day7 = null, day30 = null } = summaryAverages;

  return `
    <div class="bento-card">
      <div class="card-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div class="stat-label">Today's Average</div>
        <div class="stat-value">${day1 !== null ? day1.toFixed(1) : "—"}</div>
        <div class="stat-label">Last 1 day</div>
      </div>
    </div>
    <div class="bento-card">
      <div class="card-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div class="stat-label">7-Day Average</div>
        <div class="stat-value">${day7 !== null ? day7.toFixed(1) : "—"}</div>
        <div class="stat-label">Last 7 days</div>
      </div>
    </div>
    <div class="bento-card">
      <div class="card-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div class="stat-label">30-Day Average</div>
        <div class="stat-value">${day30 !== null ? day30.toFixed(1) : "—"}</div>
        <div class="stat-label">Last 30 days</div>
      </div>
    </div>
  `;
}

/**
 * Render range filter buttons
 * @param {string} classId - Class ID
 * @param {number} currentRange - Current time range (1, 7, or 30)
 * @param {string|null} selectedDate - Currently selected date for details
 * @returns {string} HTML string for range buttons
 */
function renderRangeButtons(classId, currentRange, selectedDate = null) {
  const ranges = [
    { value: 1, label: "1 Day" },
    { value: 7, label: "7 Days" },
    { value: 30, label: "30 Days" },
  ];

  return ranges
    .map((r) => {
      // Build URL with range and optionally preserve date
      const urlParams = new URLSearchParams({ range: r.value.toString() });
      if (selectedDate) {
        urlParams.set("date", selectedDate);
      }
      const url = `/classes/${classId}/pulse/page?${urlParams.toString()}`;

      return `
      <button
        class="segmented-control-button ${currentRange === r.value ? "active" : ""}"
        hx-get="${url}"
        hx-target="#tab-content"
        hx-swap="innerHTML"
        type="button"
      >
        ${r.label}
      </button>
    `;
    })
    .join("");
}

/**
 * Render chart container
 * @param {string} classId - Class ID
 * @param {number} range - Current time range (1, 7, or 30)
 * @param {Array} analyticsData - Array of {date, averagePulse, count}
 * @param {string|null} selectedDate - Currently selected date for details
 * @returns {string} HTML string for chart container
 */
function renderChartContainer(
  classId,
  range,
  analyticsData,
  selectedDate = null,
) {
  if (analyticsData.length === 0) {
    return `
      <div style="text-align: center; padding: var(--space-8); color: var(--color-text-muted);">
        <i class="fa-solid fa-chart-line" style="font-size: 48px; margin-bottom: var(--space-4); opacity: 0.5;"></i>
        <p>No pulse data available for the selected time range.</p>
      </div>
    `;
  }

  // Generate SVG line chart
  const chartSvg = renderLineChart(classId, range, analyticsData, selectedDate);

  return `
    <div class="pulse-chart">
      <h3 style="font-size: var(--text-lg); font-weight: var(--weight-medium); margin-bottom: var(--space-4);">
        Daily Average Pulse
      </h3>
      ${chartSvg}
    </div>
  `;
}

/**
 * Render SVG line chart
 * @param {string} classId - Class ID
 * @param {number} range - Current time range (1, 7, or 30)
 * @param {Array} data - Array of {date, averagePulse, count}
 * @param {string|null} selectedDate - Currently selected date for details
 * @returns {string} HTML string for SVG chart
 */
function renderLineChart(classId, range, data, selectedDate = null) {
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale values
  const maxPulse = 5;
  const minPulse = 1;
  const pulseRange = maxPulse - minPulse;

  // Calculate points
  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      ((item.averagePulse - minPulse) / pulseRange) * chartHeight;
    return { x, y, ...item };
  });

  // Generate path for line
  const pathD =
    points.length > 0
      ? points
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
          )
          .join(" ")
      : "";

  // Generate area path
  const areaPathD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${(padding.top + chartHeight).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padding.top + chartHeight).toFixed(2)} Z`
      : "";

  // Generate grid lines
  const gridLines = [];
  for (let i = 1; i <= 5; i++) {
    const y =
      padding.top + chartHeight - ((i - minPulse) / pulseRange) * chartHeight;
    gridLines.push(
      `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--color-border)" stroke-width="1" opacity="0.3" />`,
    );
    gridLines.push(
      `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="var(--color-text-muted)" font-size="12">${i}</text>`,
    );
  }

  // Generate date labels
  const dateLabels = [];
  if (data.length > 0) {
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) {
      const point = points[i];
      const date = formatDateShort(data[i].date);
      dateLabels.push(
        `<text x="${point.x}" y="${height - padding.bottom + 20}" text-anchor="middle" fill="var(--color-text-muted)" font-size="11">${escapeHtml(date)}</text>`,
      );
    }
    // Always show last date
    if (data.length > 0 && (data.length - 1) % step !== 0) {
      const lastPoint = points[points.length - 1];
      const lastDate = formatDateShort(data[data.length - 1].date);
      dateLabels.push(
        `<text x="${lastPoint.x}" y="${height - padding.bottom + 20}" text-anchor="middle" fill="var(--color-text-muted)" font-size="11">${escapeHtml(lastDate)}</text>`,
      );
    }
  }

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">
      <!-- Grid lines -->
      ${gridLines.join("")}
      
      <!-- Area fill -->
      <path d="${areaPathD}" fill="var(--color-brand-deep)" opacity="0.1" />
      
      <!-- Line -->
      <path d="${pathD}" fill="none" stroke="var(--color-brand-deep)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Data points (clickable) -->
      ${points
        .map((p) => {
          const isSelected = selectedDate === p.date;
          return `
        <circle
          cx="${p.x}"
          cy="${p.y}"
          r="${isSelected ? "8" : "6"}"
          fill="${isSelected ? "var(--color-accent-gold)" : "var(--color-brand-deep)"}"
          stroke="white"
          stroke-width="2"
          style="cursor: pointer;"
          class="pulse-chart-point ${isSelected ? "selected" : ""}"
          data-date="${p.date}"
          onclick="loadPulseDetails('${classId}', '${p.date}')"
        />
        <title>${formatDate(p.date)}: ${p.averagePulse.toFixed(2)} (${p.count} responses)</title>
      `;
        })
        .join("")}
      
      <!-- Date labels -->
      ${dateLabels.join("")}
      
      <!-- Y-axis label -->
      <text x="15" y="${height / 2}" text-anchor="middle" fill="var(--color-text-muted)" font-size="12" transform="rotate(-90, 15, ${height / 2})">Average Pulse</text>
    </svg>
  `;
}

/**
 * Render details table
 * @param {string} classId - Class ID
 * @param {string|null} selectedDate - Currently selected date for details
 * @param {Array} detailsData - Array of student pulse entries for selected date
 * @returns {string} HTML string for details table
 */
function renderDetailsTable(classId, selectedDate, detailsData) {
  if (!selectedDate) {
    return `
      <div style="background: var(--color-bg-surface); border-radius: var(--radius-lg); padding: var(--space-6); text-align: center; color: var(--color-text-muted);">
        <p>Click on a date in the chart to view detailed student responses.</p>
      </div>
    `;
  }

  if (detailsData.length === 0) {
    return `
      <div style="background: var(--color-bg-surface); border-radius: var(--radius-lg); padding: var(--space-6);">
        <h3 style="font-size: var(--text-lg); font-weight: var(--weight-medium); margin-bottom: var(--space-4);">
          Student Responses - ${formatDate(selectedDate)}
        </h3>
        <p style="color: var(--color-text-muted);">No pulse submissions for this date.</p>
      </div>
    `;
  }

  const tableRows = detailsData
    .map(
      (entry) => `
      <tr>
        <td>${escapeHtml(entry.studentName)}</td>
        <td>
          <span class="pulse-emoji-display">${getPulseEmoji(entry.pulse)}</span>
          <span>${entry.pulse}</span>
        </td>
        <td>${formatDate(entry.date)}</td>
      </tr>
    `,
    )
    .join("");

  return `
    <div style="background: var(--color-bg-surface); border-radius: var(--radius-lg); overflow: hidden;">
      <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: var(--text-lg); font-weight: var(--weight-medium); margin: 0;">
          Student Responses - ${formatDate(selectedDate)}
        </h3>
        <button 
          onclick="loadPulseDetails('${classId}', '${selectedDate}')" 
          style="padding: var(--space-2) var(--space-3); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--color-text-muted); cursor: pointer;"
          title="Clear selection"
        >
          <i class="fa-solid fa-times"></i> Clear
        </button>
      </div>
      <table class="pulse-details-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Pulse</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render chart partial (for HTMX updates)
 * @param {string} classId - Class ID
 * @param {number} range - Current time range (1, 7, or 30)
 * @param {Array} analyticsData - Array of {date, averagePulse, count}
 * @returns {string} HTML string for chart container
 */
export function renderChartPartial(classId, range, analyticsData) {
  return renderChartContainer(classId, range, analyticsData);
}

/**
 * Render details table partial (for HTMX updates)
 * @param {string} classId - Class ID
 * @param {string|null} selectedDate - Currently selected date for details
 * @param {Array} detailsData - Array of student pulse entries for selected date
 * @returns {string} HTML string for details table
 */
export function renderDetailsPartial(classId, selectedDate, detailsData) {
  return renderDetailsTable(classId, selectedDate, detailsData);
}
