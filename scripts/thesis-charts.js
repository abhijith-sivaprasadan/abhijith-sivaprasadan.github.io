(function () {
  var colors = {
    blue: "#2563a8",
    teal: "#65d6c9",
    orange: "#d0622c",
    amber: "#f6c85f",
    gray: "#888780",
    text: "#f4f1ea",
    muted: "#b9b4aa",
    grid: "rgba(255,255,255,0.10)"
  };

  var axis = {
    line: "line",
    scatter: "scatter",
    bar: "bar"
  };

  var chartDefinitions = {
    meshPressure: {
      canvasId: "meshPressureChart",
      type: axis.line,
      labels: ["Coarse", "Baseline", "Fine"],
      yLabel: "Pressure drop (Pa)",
      fallback: {
        title: "Pressure drop convergence",
        lines: ["Redesigned: 38,810 -> 39,146 -> 39,387 Pa.", "Legacy: 36,814 -> 36,285 -> 35,797 Pa."]
      },
      datasets: [
        { label: "Redesigned", data: [38810, 39146, 39387], color: "blue" },
        { label: "Legacy", data: [36814, 36285, 35797], color: "orange" }
      ]
    },
    meshMach: {
      canvasId: "meshMachChart",
      type: axis.line,
      labels: ["Coarse", "Baseline", "Fine"],
      yLabel: "Maximum Mach",
      fallback: {
        title: "Maximum Mach convergence",
        lines: ["Redesigned remains stable at Ma 0.9888-0.9904.", "Legacy baseline/fine: Ma 1.0148 -> 1.0164."]
      },
      datasets: [
        { label: "Redesigned", data: [0.9888, 0.9904, 0.9887], color: "blue" },
        { label: "Legacy", data: [null, 1.0148, 1.0164], color: "orange" }
      ]
    },
    convergence: {
      canvasId: "convergenceChart",
      type: axis.line,
      labels: [0, 100, 250, 500, 750, 1000, 1250, 1500],
      yLabel: "Scaled residual",
      xLabel: "Iteration",
      log: true,
      fallback: {
        title: "Solver convergence",
        lines: [
          "Continuity residuals finished at 5.1e-7 for the redesigned reducer and 1.7e-6 for the legacy reducer.",
          "Higher legacy turbulence residuals align with the stronger jet and separated-flow physics."
        ]
      },
      datasets: [
        { label: "New continuity", data: [0.097, 0.041, 0.008, 0.0012, 0.00014, 0.000016, 0.0000022, 0.00000051], color: "teal" },
        { label: "Legacy continuity", data: [0.088, 0.052, 0.014, 0.0026, 0.00034, 0.000044, 0.0000068, 0.0000017], color: "orange" },
        { label: "New energy", data: [7152, 1900, 180, 18, 2.1, 0.28, 0.046, 0.008], color: "amber", dash: true },
        { label: "Legacy energy", data: [6855, 2100, 260, 31, 4.6, 0.72, 0.11, 0.018], color: "gray", dash: true }
      ]
    },
    yplus: {
      canvasId: "yplusChart",
      type: axis.scatter,
      yLabel: "Wall y+",
      xLabel: "Axial position (mm)",
      fallback: {
        title: "Near-wall resolution",
        lines: ["Legacy y+ range: 0.2-11.2, with a local spike at the step.", "Redesigned y+ range: 0.3-10.6, rising smoothly through the contraction."]
      },
      datasets: [
        { label: "Legacy y+", x: [0, 10, 20, 26, 32, 38, 50, 65, 80, 95], y: [0.5, 1.2, 3.5, 11.2, 8.6, 4.1, 2.6, 2.1, 1.8, 1.6], color: "orange" },
        { label: "Redesigned y+", x: [0, 15, 30, 45, 60, 75, 90, 110, 130, 150], y: [0.34, 0.8, 1.5, 2.4, 3.6, 4.8, 6.2, 7.8, 9.2, 10.6], color: "blue" }
      ]
    },
    flowMach: {
      canvasId: "flowMachChart",
      type: axis.scatter,
      yLabel: "Mach number",
      xLabel: "Axial position (mm)",
      fallback: {
        title: "Centerline Mach",
        lines: ["Legacy adiabatic centerline peak: Ma 0.908.", "Redesigned adiabatic centerline peak: Ma 0.640."]
      },
      datasets: [
        { label: "Legacy", x: [0, 20, 40, 55, 62.3, 70, 90, 110, 130, 150], y: [0.016, 0.018, 0.022, 0.21, 0.908, 0.84, 0.80, 0.795, 0.792, 0.791], color: "orange" },
        { label: "Redesigned", x: [0, 20, 40, 60, 80, 100, 120, 140, 150], y: [0.016, 0.025, 0.06, 0.14, 0.27, 0.42, 0.55, 0.62, 0.64], color: "blue" }
      ]
    },
    flowPressure: {
      canvasId: "flowPressureChart",
      type: axis.scatter,
      yLabel: "Total pressure (Pa)",
      xLabel: "Axial position (mm)",
      fallback: {
        title: "Total pressure",
        lines: ["Legacy loss: 3,688 Pa.", "Redesigned loss: 168 Pa, a 22x reduction."]
      },
      datasets: [
        { label: "Legacy total pressure", x: [0, 20, 40, 55, 62.3, 70, 90, 110, 130, 150], y: [100000, 100000, 99980, 99100, 97700, 97000, 96600, 96380, 96320, 96312], color: "orange" },
        { label: "Redesigned total pressure", x: [0, 20, 40, 60, 80, 100, 120, 140, 150], y: [99999.8, 99999.6, 99998.5, 99982, 99954, 99910, 99870, 99842, 99832], color: "blue" }
      ]
    },
    legacyFlow: {
      canvasId: "legacyFlowChart",
      type: axis.scatter,
      yLabel: "Mach or normalized pressure",
      xLabel: "Axial position (mm)",
      fallback: {
        title: "Legacy diagnostic",
        lines: ["Inlet Ma 0.016 rises to a local Ma 0.908 jet near the step.", "Effective outlet total pressure falls to 96,312 Pa."]
      },
      datasets: [
        { label: "Legacy Mach", x: [0, 20, 40, 55, 62.3, 70, 90, 110, 130, 150], y: [0.016, 0.018, 0.022, 0.21, 0.908, 0.84, 0.80, 0.795, 0.792, 0.791], color: "orange" },
        { label: "Legacy pressure / 100000", x: [0, 20, 40, 55, 62.3, 70, 90, 110, 130, 150], y: [1.0, 1.0, 0.9998, 0.991, 0.977, 0.970, 0.966, 0.9638, 0.9632, 0.96312], color: "teal", dash: true }
      ]
    },
    wallTemp: {
      canvasId: "wallTempChart",
      type: axis.scatter,
      yLabel: "Wall temperature (K)",
      xLabel: "Axial position (mm)",
      fallback: {
        title: "Wall temperature",
        lines: ["Legacy wall: 671.6 K inlet to 639.2 K outlet.", "Redesigned wall: 673.0 K inlet to 647.9 K outlet."]
      },
      datasets: [
        { label: "Legacy wall", x: [0, 10, 20, 25, 32, 38, 50, 65, 80, 95], y: [671.6, 671.3, 670.7, 665.0, 650.2, 642.0, 640.5, 640.0, 639.6, 639.2], color: "orange" },
        { label: "Redesigned wall", x: [0, 20, 40, 60, 80, 100, 120, 140, 150], y: [673.0, 670.9, 667.8, 664.5, 660.2, 655.6, 651.7, 648.8, 647.9], color: "blue" }
      ]
    },
    heatLoss: {
      canvasId: "heatLossChart",
      type: axis.bar,
      labels: ["Heat loss", "Resistance"],
      yLabel: "W or K/W",
      fallback: {
        title: "Heat loss and resistance",
        lines: ["External heat loss: redesigned 55.7 W avg, legacy 18.8 W avg.", "External resistance: 5.19 K/W vs 17.37 K/W."]
      },
      datasets: [
        { label: "Redesigned", data: [55.7, 5.19], color: "blue" },
        { label: "Legacy", data: [18.8, 17.37], color: "orange" }
      ]
    },
    outletGap: {
      canvasId: "outletGapChart",
      type: axis.bar,
      labels: ["80 kPa", "40 kPa", "0 Pa", "Insulated"],
      yLabel: "Temperature gap (K)",
      fallback: {
        title: "Outlet temperature gap",
        lines: ["Uninsulated legacy advantage: 7.80 K, 4.75 K, 3.36 K.", "Insulated reference reverses by 1.24 K in favor of the redesigned reducer."]
      },
      datasets: [
        { label: "Legacy outlet temp advantage", data: [7.8, 4.75, 3.36, -1.24], color: ["orange", "orange", "orange", "blue"] }
      ]
    },
    biot: {
      canvasId: "biotChart",
      type: axis.bar,
      labels: ["Biot number", "Max wall dT"],
      yLabel: "Dimensionless or K",
      fallback: {
        title: "Biot proof",
        lines: ["Bi = 0.003-0.004, so through-wall gradients are negligible.", "Maximum wall delta T: 0.70 K legacy, 0.06 K redesigned."]
      },
      datasets: [
        { label: "Legacy", data: [0.004, 0.70], color: "orange" },
        { label: "Redesigned", data: [0.003, 0.06], color: "blue" }
      ]
    },
    insulation: {
      canvasId: "insulationChart",
      type: axis.bar,
      labels: ["Outlet wall temp", "Insulation effect"],
      yLabel: "K",
      fallback: {
        title: "Insulation effect",
        lines: ["Legacy outlet wall: 627.2 K uninsulated, 648.1 K insulated.", "Redesigned outlet wall: 597.6 K uninsulated, 653.8 K insulated."]
      },
      datasets: [
        { label: "Legacy uninsulated", data: [627.2, 25.5], color: "rgba(208,98,44,0.58)" },
        { label: "Legacy insulated", data: [648.1, 0], color: "orange" },
        { label: "Redesigned uninsulated", data: [597.6, 64.6], color: "rgba(37,99,168,0.58)" },
        { label: "Redesigned insulated", data: [653.8, 0], color: "blue" }
      ]
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
    var rect = canvas.getBoundingClientRect();
    var ratio = window.devicePixelRatio || 1;
    var width = Math.max(320, Math.floor(rect.width));
    var height = Math.max(220, Math.floor(rect.height));
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
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

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
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

  function drawCategoryLabels(ctx, labels, plot) {
    ctx.fillStyle = colors.muted;
    labels.forEach(function (label, index) {
      var x = plot.left + ((plot.right - plot.left) * index) / Math.max(1, labels.length - 1);
      ctx.fillText(String(label), x - ctx.measureText(String(label)).width / 2, plot.bottom + 16);
    });
  }

  function drawSeries(ctx, dataset, points, yRange, chart, plot) {
    ctx.strokeStyle = color(dataset.color);
    ctx.fillStyle = color(dataset.color);
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
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
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
    chart.xRange = range(xValuesFor(chart), false, [0, 1]);
    var yRange = range(valuesFor(chart), chart.log, chart.log ? [-8, 4] : [0, 1]);
    drawAxes(ctx, plot, prepared.width, prepared.height, yRange, chart);

    if (chart.type === axis.line) {
      drawCategoryLabels(ctx, chart.labels || [], plot);
    }

    chart.datasets.forEach(function (dataset) {
      var points = chart.type === axis.scatter
        ? dataset.x.map(function (x, index) { return { x: x, y: dataset.y[index] }; })
        : dataset.data.map(function (y, index) { return { x: index, y: y }; });
      drawSeries(ctx, dataset, points, yRange, chart, plot);
    });
    drawLegend(ctx, chart.datasets, plot);
  }

  function drawBar(chart, prepared) {
    var ctx = prepared.ctx;
    var plot = prepared.plot;
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
        var fill = color(dataset.color);
        ctx.fillStyle = Array.isArray(fill) ? fill[labelIndex] : fill;
        ctx.fillRect(x, Math.min(y, yZero), Math.max(2, barWidth - 3), Math.abs(yZero - y));
      });
    });
    drawLegend(ctx, chart.datasets, plot);
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
      initMediaDialog();
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
  });
})();
