(function () {
  function isLightTheme() {
    return document.documentElement.dataset.theme === "light";
  }

  function getColors() {
    var light = isLightTheme();
    return {
      blue:   light ? "#2563a8" : "#72b7ff",
      teal:   light ? "#0d9488" : "#65d6c9",
      orange: light ? "#b84b19" : "#ff9a66",
      amber:  light ? "#92400e" : "#f6c85f",
      gray:   light ? "#6b7280" : "#888780",
      text:   light ? "#101821" : "#f4f1ea",
      muted:  light ? "#55606a" : "#b9b4aa",
      grid:   light ? "rgba(15,25,35,0.10)" : "rgba(255,255,255,0.10)",
      axis:   light ? "rgba(15,25,35,0.30)" : "rgba(255,255,255,0.22)",
      bg:     light ? "#ffffff" : "transparent"
    };
  }

  var colors = getColors();

  var axis = {
    line: "line",
    scatter: "scatter",
    bar: "bar"
  };

  var chartRenderState = {};
  var chartTooltip = null;

  // Source: published KTH thesis TRITA-ITM-EX 2026:14.
  // Only verified tabulated results; no interpolated or illustrative profiles.
  var chartDefinitions = {
    meshPressure: {
      canvasId: "meshPressureChart", type: axis.line,
      labels: ["Coarse","Baseline","Fine"], yLabel: "Pressure drop (Pa)",
      fallback: {title: "Tables 4.2, 4.4 · adiabatic mesh study",lines:["Legacy: 36214 / 36285 / 35797","Redesigned: 38810 / 39146 / 39387"]},
      datasets: [
        {label:"Legacy",data:[36214,36285,35797],color:"orange"},
        {label:"Redesigned",data:[38810,39146,39387],color:"blue"}
      ]
    },
    meshMach: {
      canvasId: "meshMachChart", type: axis.line,
      labels: ["Coarse","Baseline","Fine"], yLabel: "Maximum Mach",
      fallback: {title: "Tables 4.2, 4.4 · adiabatic mesh study",lines:["Legacy: 1.0099 / 1.0148 / 1.0164","Redesigned: 0.9888 / 0.9903 / 0.9887"]},
      datasets: [
        {label:"Legacy",data:[1.0099,1.0148,1.0164],color:"orange"},
        {label:"Redesigned",data:[0.9888,0.9903,0.9887],color:"blue"}
      ]
    },
    chtPressure: {
      canvasId: "chtPressureChart", type: axis.line,
      labels: ["A","B","C"], yLabel: "Pressure drop (Pa)",
      fallback: {title: "Table 4.6 · CHT cases",lines:["Legacy: 8777 / 24752 / 36720","Redesigned: 9114 / 25319 / 37810"]},
      datasets: [
        {label:"Legacy",data:[8777,24752,36720],color:"orange"},
        {label:"Redesigned",data:[9114,25319,37810],color:"blue"}
      ]
    },
    chtMach: {
      canvasId: "chtMachChart", type: axis.line,
      labels: ["A","B","C"], yLabel: "Maximum Mach",
      fallback: {title: "Table 4.6 · CHT cases",lines:["Legacy: 0.412 / 0.767 / 1.006","Redesigned: 0.352 / 0.674 / 0.99"]},
      datasets: [
        {label:"Legacy",data:[0.412,0.767,1.006],color:"orange"},
        {label:"Redesigned",data:[0.352,0.674,0.99],color:"blue"}
      ]
    },
    heatLoss: {
      canvasId: "heatLossChart", type: axis.line,
      labels: ["A","B","C"], yLabel: "External heat loss (W)",
      fallback: {title: "Table 4.6 · CHT cases",lines:["Legacy: 18.59 / 18.93 / 18.88","Redesigned: 53.36 / 56.58 / 57.21"]},
      datasets: [
        {label:"Legacy",data:[18.59,18.93,18.88],color:"orange"},
        {label:"Redesigned",data:[53.36,56.58,57.21],color:"blue"}
      ]
    },
    outletTemp: {
      canvasId: "outletTempChart", type: axis.line,
      labels: ["A","B","C"], yLabel: "Outlet static temperature (K)",
      fallback: {title: "Table 4.6 · CHT cases",lines:["Legacy: 657.29 / 629.34 / 585.45","Redesigned: 649.49 / 624.59 / 582.1"]},
      datasets: [
        {label:"Legacy",data:[657.29,629.34,585.45],color:"orange"},
        {label:"Redesigned",data:[649.49,624.59,582.1],color:"blue"}
      ]
    },
    flux: {
      canvasId: "fluxChart", type: axis.line,
      labels: ["A","B","C"], yLabel: "External heat flux density (W/m²)",
      fallback: {title: "Table 4.6 · CHT cases",lines:["Legacy: 3230 / 3288 / 3279","Redesigned: 2768 / 2935 / 2967"]},
      datasets: [
        {label:"Legacy",data:[3230,3288,3279],color:"orange"},
        {label:"Redesigned",data:[2768,2935,2967],color:"blue"}
      ]
    },
    outletGap: {
      canvasId:"outletGapChart",type:axis.bar, labels:["A","B","C","C insulated"],
      yLabel:"Legacy minus redesigned (K)",
      fallback:{title:"Tables 4.6–4.7 · outlet static temperature difference",
        lines:["Legacy advantage uninsulated: +7.80 / +4.75 / +3.36 K.",
               "Insulated Case C: redesign warmer by 1.24 K."]},
      datasets:[{label:"Legacy − redesigned",data:[7.80,4.75,3.36,-1.24],color:["orange","orange","orange","blue"]}]
    }
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function color(value) {
    if (Array.isArray(value)) return value.map(color);
    return colors[value] || value || colors.gray;
  }

  function prepareCanvas(canvas) {
    // Re-read theme on every render so toggling dark↔light repaints correctly
    colors = getColors();

    var rect = canvas.getBoundingClientRect();
    var ratio = window.devicePixelRatio || 1;
    var width = Math.max(320, Math.floor(rect.width));
    var height = Math.max(220, Math.floor(rect.height));
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // Fill background so canvas is never transparent on light page
    if (colors.bg !== "transparent") {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.font = "12px Roboto, system-ui, sans-serif";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return { ctx: ctx, width: width, height: height, plot: { left: 48, right: width - 16, top: 20, bottom: height - 58 } };
  }

  function formatTick(value) {
    if (!Number.isFinite(value)) return "";
    if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString("en-US");
    if (Math.abs(value) >= 10) return value.toFixed(0);
    if (Math.abs(value) >= 1) return value.toFixed(1);
    return value.toFixed(3);
  }

  function escapeText(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatTooltipValue(value) {
    if (!Number.isFinite(value)) return "n/a";
    if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString("en-US");
    if (Math.abs(value) >= 100) return value.toFixed(1);
    if (Math.abs(value) >= 10) return value.toFixed(2);
    if (Math.abs(value) >= 1) return value.toFixed(3);
    return value.toPrecision(3);
  }

  function range(values, logScale, fallbackRange) {
    var fallback = Array.isArray(fallbackRange) && fallbackRange.length === 2 ? fallbackRange : [0, 1];
    var nums = values.filter(function (value) { return value !== null && Number.isFinite(value); });
    if (logScale) {
      nums = nums.filter(function (value) { return value > 0; }).map(function (value) { return Math.log10(value); });
    }
    if (nums.length === 0) return fallback;
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;
    if (min === max) {
      min -= 1;
      max += 1;
    }
    var pad = (max - min) * 0.08;
    return [min - pad, max + pad];
  }

  function scale(value, domain, start, end) {
    if (!Number.isFinite(value) || domain[0] === domain[1]) return start;
    return start + ((value - domain[0]) / (domain[1] - domain[0])) * (end - start);
  }

  function drawAxes(ctx, plot, width, height, yRange, chart) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.muted;
    ctx.font = "11px Roboto, system-ui, sans-serif";

    for (var i = 0; i <= 4; i += 1) {
      var y = plot.bottom - ((plot.bottom - plot.top) * i) / 4;
      var value = yRange[0] + ((yRange[1] - yRange[0]) * i) / 4;
      var label = chart.log ? "1e" + Math.round(value) : formatTick(value);
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.right, y);
      ctx.stroke();
      ctx.fillText(label, 6, y + 4);
    }

    ctx.strokeStyle = colors.axis;
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.top);
    ctx.lineTo(plot.left, plot.bottom);
    ctx.lineTo(plot.right, plot.bottom);
    ctx.stroke();

    if (chart.yLabel) {
      ctx.save();
      ctx.translate(13, (plot.top + plot.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(chart.yLabel, -ctx.measureText(chart.yLabel).width / 2, 0);
      ctx.restore();
    }
    if (chart.xLabel) {
      ctx.fillText(chart.xLabel, plot.left + (plot.right - plot.left) / 2 - ctx.measureText(chart.xLabel).width / 2, height - 12);
    }
  }

  function drawLegend(ctx, datasets, plot) {
    var x = plot.left;
    var y = plot.bottom + 24;
    ctx.font = "11px Roboto, system-ui, sans-serif";
    datasets.forEach(function (dataset) {
      var swatchColor = color(dataset.color);
      ctx.fillStyle = Array.isArray(swatchColor) ? swatchColor[0] : swatchColor;
      ctx.fillRect(x, y - 8, 12, 8);
      ctx.fillStyle = colors.muted;
      ctx.fillText(dataset.label, x + 18, y);
      x += Math.min(178, ctx.measureText(dataset.label).width + 38);
      if (x > plot.right - 130) {
        x = plot.left;
        y += 16;
      }
    });
  }

  function drawCategoryLabels(ctx, labels, plot, xRange) {
    ctx.fillStyle = colors.muted;
    labels.forEach(function (label, index) {
      // Use exactly the same padded numeric x-domain as the plotted series.
      var x = scale(index, xRange, plot.left, plot.right);
      ctx.fillText(String(label), x - ctx.measureText(String(label)).width / 2, plot.bottom + 16);
    });
  }

  function drawSeries(ctx, dataset, points, yRange, chart, plot) {
    var strokeColor = color(dataset.color);
    var pointColor = Array.isArray(strokeColor) ? strokeColor[0] : strokeColor;
    var hits = [];
    ctx.strokeStyle = pointColor;
    ctx.fillStyle = pointColor;
    ctx.lineWidth = 2.5;
    if (dataset.dash) ctx.setLineDash([7, 5]);
    ctx.beginPath();
    var started = false;
    points.forEach(function (point) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || (chart.log && point.y <= 0)) {
        started = false;
        return;
      }
      var yValue = chart.log ? Math.log10(point.y) : point.y;
      var x = scale(point.x, chart.xRange, plot.left, plot.right);
      var y = scale(yValue, yRange, plot.bottom, plot.top);
      hits.push({
        type: "point",
        x: x,
        y: y,
        dataset: dataset.label,
        xValue: point.x,
        xLabel: chart.type === axis.line ? String((chart.labels || [])[point.x] || point.x) : formatTooltipValue(point.x),
        yValue: point.y,
        yLabel: chart.yLabel || "Value",
        color: pointColor
      });
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
    hits.forEach(function (hit) {
      ctx.beginPath();
      ctx.fillStyle = pointColor;
      ctx.arc(hit.x, hit.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.bg !== "transparent" ? colors.bg : "rgba(7,8,7,0.82)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    return hits;
  }

  function valuesFor(chart) {
    var values = [];
    chart.datasets.forEach(function (dataset) {
      var source = chart.type === axis.scatter ? dataset.y : dataset.data;
      source.forEach(function (value) { values.push(value); });
    });
    return values;
  }

  function xValuesFor(chart) {
    var values = [];
    if (chart.type === axis.scatter) {
      chart.datasets.forEach(function (dataset) {
        dataset.x.forEach(function (value) { values.push(value); });
      });
      return values;
    }
    return (chart.labels || []).map(function (_label, index) { return index; });
  }

  function drawLineLike(chart, prepared) {
    var ctx = prepared.ctx;
    var plot = prepared.plot;
    var hits = [];
    chart.xRange = range(xValuesFor(chart), false, [0, 1]);
    var yRange = range(valuesFor(chart), chart.log, chart.log ? [-8, 4] : [0, 1]);
    drawAxes(ctx, plot, prepared.width, prepared.height, yRange, chart);

    if (chart.type === axis.line) {
      drawCategoryLabels(ctx, chart.labels || [], plot, chart.xRange);
    }

    chart.datasets.forEach(function (dataset) {
      var points = chart.type === axis.scatter
        ? dataset.x.map(function (x, index) { return { x: x, y: dataset.y[index] }; })
        : dataset.data.map(function (y, index) { return { x: index, y: y }; });
      hits = hits.concat(drawSeries(ctx, dataset, points, yRange, chart, plot));
    });
    drawLegend(ctx, chart.datasets, plot);
    chartRenderState[chart.canvasId] = { chart: chart, hits: hits };
  }

  function drawBar(chart, prepared) {
    var ctx = prepared.ctx;
    var plot = prepared.plot;
    var hits = [];
    var yRange = range(valuesFor(chart).concat([0]), false, [0, 1]);
    drawAxes(ctx, plot, prepared.width, prepared.height, yRange, chart);

    var labels = chart.labels || [];
    var groupWidth = (plot.right - plot.left) / Math.max(1, labels.length);
    var barWidth = Math.min(28, (groupWidth - 14) / Math.max(1, chart.datasets.length));
    labels.forEach(function (label, labelIndex) {
      var center = plot.left + groupWidth * labelIndex + groupWidth / 2;
      ctx.fillStyle = colors.muted;
      ctx.fillText(label, center - ctx.measureText(label).width / 2, plot.bottom + 16);
      chart.datasets.forEach(function (dataset, datasetIndex) {
        var value = dataset.data[labelIndex] || 0;
        var x = center - (barWidth * chart.datasets.length) / 2 + datasetIndex * barWidth;
        var yZero = scale(0, yRange, plot.bottom, plot.top);
        var y = scale(value, yRange, plot.bottom, plot.top);
        var barHeight = Math.max(2, Math.abs(yZero - y));
        var fill = color(dataset.color);
        ctx.fillStyle = Array.isArray(fill) ? fill[labelIndex] : fill;
        ctx.fillRect(x, Math.min(y, yZero), Math.max(2, barWidth - 3), barHeight);
        hits.push({
          type: "bar",
          x: x,
          y: Math.min(y, yZero),
          width: Math.max(2, barWidth - 3),
          height: barHeight,
          dataset: dataset.label,
          xLabel: String(label),
          yValue: value,
          yLabel: chart.yLabel || "Value",
          color: Array.isArray(fill) ? fill[labelIndex] : fill
        });
      });
    });
    drawLegend(ctx, chart.datasets, plot);
    chartRenderState[chart.canvasId] = { chart: chart, hits: hits };
  }

  function ensureFallback(canvas, chart) {
    var shell = canvas.closest(".chart-shell");
    if (!shell || shell.querySelector(".chart-fallback") || !chart.fallback) return;
    var fallback = document.createElement("div");
    fallback.className = "chart-fallback";
    var title = document.createElement("strong");
    title.textContent = chart.fallback.title;
    fallback.appendChild(title);
    chart.fallback.lines.forEach(function (line) {
      var span = document.createElement("span");
      span.textContent = line;
      fallback.appendChild(span);
    });
    shell.appendChild(fallback);
  }

  function renderChart(chart) {
    var canvas = document.getElementById(chart.canvasId);
    if (!canvas) return;
    ensureFallback(canvas, chart);
    var prepared = prepareCanvas(canvas);
    if (chart.type === axis.bar) {
      drawBar(chart, prepared);
    } else {
      drawLineLike(chart, prepared);
    }
  }

  function renderAll() {
    colors.text = cssVar("--text", colors.text);
    colors.muted = cssVar("--muted", colors.muted);
    Object.keys(chartDefinitions).forEach(function (key) {
      renderChart(chartDefinitions[key]);
    });
  }

  function getTooltip() {
    if (chartTooltip) return chartTooltip;
    chartTooltip = document.createElement("div");
    chartTooltip.className = "chart-tooltip";
    chartTooltip.setAttribute("role", "status");
    chartTooltip.setAttribute("aria-live", "polite");
    document.body.appendChild(chartTooltip);
    return chartTooltip;
  }

  function hideTooltip() {
    if (chartTooltip) chartTooltip.classList.remove("is-visible");
  }

  function nearestHit(state, x, y) {
    var best = null;
    var bestDistance = Infinity;
    (state.hits || []).forEach(function (hit) {
      if (hit.type === "bar") {
        var inside = x >= hit.x && x <= hit.x + hit.width && y >= hit.y && y <= hit.y + hit.height;
        if (inside) {
          best = hit;
          bestDistance = 0;
        }
        return;
      }
      var distance = Math.hypot(hit.x - x, hit.y - y);
      if (distance < bestDistance && distance <= 18) {
        best = hit;
        bestDistance = distance;
      }
    });
    return best;
  }

  function showTooltip(event, hit) {
    var tooltip = getTooltip();
    tooltip.innerHTML = [
      "<strong>" + escapeText(hit.dataset) + "</strong>",
      "<span>" + escapeText(hit.xLabel) + "</span>",
      "<span>" + escapeText(hit.yLabel) + ": " + escapeText(formatTooltipValue(hit.yValue)) + "</span>"
    ].join("");
    tooltip.classList.add("is-visible");
    var x = event.clientX + 14;
    var y = event.clientY + 14;
    var rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 12) x = event.clientX - rect.width - 14;
    if (y + rect.height > window.innerHeight - 12) y = event.clientY - rect.height - 14;
    tooltip.style.left = Math.max(12, x) + "px";
    tooltip.style.top = Math.max(12, y) + "px";
  }

  function initChartTooltips() {
    var canvases = Array.prototype.slice.call(document.querySelectorAll(".chart-shell canvas"));
    canvases.forEach(function (canvas) {
      if (canvas.dataset.tooltipReady === "true") return;
      canvas.dataset.tooltipReady = "true";
      canvas.addEventListener("mousemove", function (event) {
        var state = chartRenderState[canvas.id];
        if (!state) return hideTooltip();
        var rect = canvas.getBoundingClientRect();
        var hit = nearestHit(state, event.clientX - rect.left, event.clientY - rect.top);
        if (!hit) return hideTooltip();
        showTooltip(event, hit);
      });
      canvas.addEventListener("mouseleave", hideTooltip);
      canvas.addEventListener("blur", hideTooltip);
    });
  }

  function initEvidenceFilters() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-evidence-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-evidence-group]"));
    if (!buttons.length || !cards.length) return;

    function applyFilter(filter) {
      buttons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-evidence-filter") === filter);
      });
      cards.forEach(function (card) {
        var group = card.getAttribute("data-evidence-group");
        card.hidden = filter !== "all" && group !== filter;
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyFilter(button.getAttribute("data-evidence-filter") || "all");
      });
    });

    applyFilter("all");
  }

  function initEvidenceDensity() {
    var dashboard = document.querySelector(".evidence-dashboard");
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-evidence-density]"));
    if (!dashboard || !buttons.length) return;

    function applyDensity(density) {
      var nextDensity = density === "expanded" ? "expanded" : "compact";
      dashboard.setAttribute("data-evidence-density-mode", nextDensity);
      buttons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-evidence-density") === nextDensity);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyDensity(button.getAttribute("data-evidence-density"));
      });
    });

    applyDensity("compact");
  }

  function initChartFocus() {
    var dashboard = document.querySelector(".evidence-dashboard");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".thesis-chart-card"));
    if (!dashboard || !cards.length) return;

    function clearFocus() {
      dashboard.classList.remove("has-focused-chart");
      cards.forEach(function (card) {
        card.classList.remove("is-focused");
        var button = card.querySelector("[data-chart-focus]");
        if (button) button.textContent = "Focus";
      });
    }

    cards.forEach(function (card) {
      var header = card.querySelector(".chart-card-header");
      if (!header || header.querySelector("[data-chart-focus]")) return;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chart-focus-button";
      button.setAttribute("data-chart-focus", "");
      button.textContent = "Focus";
      header.appendChild(button);
      button.addEventListener("click", function () {
        var focused = card.classList.contains("is-focused");
        clearFocus();
        if (!focused) {
          dashboard.classList.add("has-focused-chart");
          card.classList.add("is-focused");
          button.textContent = "Release";
          card.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(renderAll, 260);
        } else {
          setTimeout(renderAll, 120);
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        clearFocus();
        setTimeout(renderAll, 120);
      }
    });
  }

  function initMediaDialog() {
    var dialog = document.querySelector(".thesis-media-dialog");
    var mediaButtons = Array.prototype.slice.call(document.querySelectorAll("[data-thesis-media]"));
    if (!dialog || !mediaButtons.length || typeof dialog.showModal !== "function") return;

    var image = dialog.querySelector("[data-thesis-media-image]");
    var caption = dialog.querySelector("[data-thesis-media-caption]");
    var closeButton = dialog.querySelector("[data-thesis-media-close]");

    mediaButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        image.src = button.getAttribute("data-thesis-media") || "";
        image.alt = button.querySelector("img") ? button.querySelector("img").alt : "Thesis media";
        caption.textContent = button.getAttribute("data-thesis-caption") || "";
        dialog.showModal();
      });
    });

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        dialog.close();
      });
    }

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  ready(function () {
    try {
      renderAll();
      initEvidenceFilters();
      initEvidenceDensity();
      initChartFocus();
      initChartTooltips();
      // The Control Volume case runtime handles the accessible thesis image dialog.
      document.documentElement.classList.add("charts-ready");
    } catch (error) {
      document.documentElement.classList.add("charts-failed");
      console.error("Thesis chart rendering failed", error);
    }
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        try {
          renderAll();
        } catch (error) {
          document.documentElement.classList.add("charts-failed");
          console.error("Thesis chart resize failed", error);
        }
      }, 150);
    });

    // Re-render charts when the user toggles dark/light theme
    var themeObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === "data-theme") {
          setTimeout(renderAll, 50);
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
})();
