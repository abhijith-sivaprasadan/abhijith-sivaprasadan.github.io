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

  function drawAxes(ctx, plot, width, height, yMin, yMax, yLabel, xLabel, logScale) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.muted;
    ctx.font = "11px Roboto, system-ui, sans-serif";

    for (var i = 0; i <= 4; i += 1) {
      var y = plot.bottom - ((plot.bottom - plot.top) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.right, y);
      ctx.stroke();
      var value = yMin + ((yMax - yMin) * i) / 4;
      var label = logScale ? "1e" + Math.round(value) : formatTick(value);
      ctx.fillText(label, 6, y + 4);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.top);
    ctx.lineTo(plot.left, plot.bottom);
    ctx.lineTo(plot.right, plot.bottom);
    ctx.stroke();

    if (yLabel) {
      ctx.save();
      ctx.translate(13, (plot.top + plot.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, -ctx.measureText(yLabel).width / 2, 0);
      ctx.restore();
    }
    if (xLabel) {
      ctx.fillText(xLabel, plot.left + (plot.right - plot.left) / 2 - ctx.measureText(xLabel).width / 2, height - 12);
    }
  }

  function formatTick(value) {
    if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString("en-US");
    if (Math.abs(value) >= 10) return value.toFixed(0);
    if (Math.abs(value) >= 1) return value.toFixed(1);
    return value.toFixed(3);
  }

  function range(values, logScale) {
    var nums = values.filter(function (value) { return value !== null && Number.isFinite(value); });
    if (logScale) {
      nums = nums.filter(function (value) { return value > 0; }).map(function (value) { return Math.log10(value); });
    }
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    var pad = (max - min) * 0.08;
    return [min - pad, max + pad];
  }

  function drawLegend(ctx, datasets, plot) {
    var x = plot.left;
    var y = plot.bottom + 24;
    ctx.font = "11px Roboto, system-ui, sans-serif";
    datasets.forEach(function (dataset) {
      ctx.fillStyle = dataset.color;
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

  function drawLineChart(id, labels, datasets, options) {
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var prepared = prepareCanvas(canvas);
    var ctx = prepared.ctx;
    var plot = prepared.plot;
    var allValues = [];
    datasets.forEach(function (dataset) {
      dataset.data.forEach(function (value) { allValues.push(value); });
    });
    var yRange = range(allValues, options && options.log);
    drawAxes(ctx, plot, prepared.width, prepared.height, yRange[0], yRange[1], options && options.yLabel, options && options.xLabel, options && options.log);

    ctx.fillStyle = colors.muted;
    labels.forEach(function (label, index) {
      var x = plot.left + ((plot.right - plot.left) * index) / Math.max(1, labels.length - 1);
      ctx.fillText(String(label), x - ctx.measureText(String(label)).width / 2, plot.bottom + 16);
    });

    datasets.forEach(function (dataset) {
      ctx.strokeStyle = dataset.color;
      ctx.fillStyle = dataset.color;
      ctx.lineWidth = 2.5;
      if (dataset.dash) ctx.setLineDash([7, 5]);
      ctx.beginPath();
      var started = false;
      dataset.data.forEach(function (value, index) {
        if (value === null || !Number.isFinite(value)) {
          started = false;
          return;
        }
        var x = plot.left + ((plot.right - plot.left) * index) / Math.max(1, labels.length - 1);
        var yValue = options && options.log ? Math.log10(value) : value;
        var y = plot.bottom - ((yValue - yRange[0]) / (yRange[1] - yRange[0])) * (plot.bottom - plot.top);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });
    drawLegend(ctx, datasets, plot);
  }

  function drawScatterChart(id, datasets, options) {
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var prepared = prepareCanvas(canvas);
    var ctx = prepared.ctx;
    var plot = prepared.plot;
    var xValues = [];
    var yValues = [];
    datasets.forEach(function (dataset) {
      dataset.data.forEach(function (point) {
        xValues.push(point.x);
        yValues.push(point.y);
      });
    });
    var xRange = range(xValues, false);
    var yRange = range(yValues, options && options.log);
    drawAxes(ctx, plot, prepared.width, prepared.height, yRange[0], yRange[1], options && options.yLabel, options && options.xLabel, options && options.log);

    datasets.forEach(function (dataset) {
      ctx.strokeStyle = dataset.color;
      ctx.fillStyle = dataset.color;
      ctx.lineWidth = 2.5;
      if (dataset.dash) ctx.setLineDash([7, 5]);
      ctx.beginPath();
      dataset.data.forEach(function (point, index) {
        var x = plot.left + ((point.x - xRange[0]) / (xRange[1] - xRange[0])) * (plot.right - plot.left);
        var yValue = options && options.log ? Math.log10(point.y) : point.y;
        var y = plot.bottom - ((yValue - yRange[0]) / (yRange[1] - yRange[0])) * (plot.bottom - plot.top);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });
    drawLegend(ctx, datasets, plot);
  }

  function drawBarChart(id, labels, datasets, options) {
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var prepared = prepareCanvas(canvas);
    var ctx = prepared.ctx;
    var plot = prepared.plot;
    var values = [];
    datasets.forEach(function (dataset) {
      dataset.data.forEach(function (value) { values.push(value); });
    });
    var yRange = range(values.concat([0]), false);
    drawAxes(ctx, plot, prepared.width, prepared.height, yRange[0], yRange[1], options && options.yLabel, "", false);

    var groupWidth = (plot.right - plot.left) / labels.length;
    var barWidth = Math.min(28, (groupWidth - 14) / datasets.length);
    labels.forEach(function (label, labelIndex) {
      var center = plot.left + groupWidth * labelIndex + groupWidth / 2;
      ctx.fillStyle = colors.muted;
      ctx.fillText(label, center - ctx.measureText(label).width / 2, plot.bottom + 16);
      datasets.forEach(function (dataset, datasetIndex) {
        var value = dataset.data[labelIndex] || 0;
        var x = center - (barWidth * datasets.length) / 2 + datasetIndex * barWidth;
        var yZero = plot.bottom - ((0 - yRange[0]) / (yRange[1] - yRange[0])) * (plot.bottom - plot.top);
        var y = plot.bottom - ((value - yRange[0]) / (yRange[1] - yRange[0])) * (plot.bottom - plot.top);
        ctx.fillStyle = Array.isArray(dataset.color) ? dataset.color[labelIndex] : dataset.color;
        ctx.fillRect(x, Math.min(y, yZero), barWidth - 3, Math.abs(yZero - y));
      });
    });
    drawLegend(ctx, datasets, plot);
  }

  function points(x, y) {
    return x.map(function (value, index) {
      return { x: value, y: y[index] };
    });
  }

  function renderAll() {
    colors.text = cssVar("--text", colors.text);
    colors.muted = cssVar("--muted", colors.muted);

    drawLineChart("meshPressureChart", ["Coarse", "Baseline", "Fine"], [
      { label: "Redesigned", data: [38810, 39146, 39387], color: colors.blue },
      { label: "Legacy", data: [36814, 36285, 35797], color: colors.orange }
    ], { yLabel: "Pressure drop (Pa)" });

    drawLineChart("meshMachChart", ["Coarse", "Baseline", "Fine"], [
      { label: "Redesigned", data: [0.9888, 0.9904, 0.9887], color: colors.blue },
      { label: "Legacy", data: [null, 1.0148, 1.0164], color: colors.orange }
    ], { yLabel: "Maximum Mach" });

    drawLineChart("convergenceChart", [0, 100, 250, 500, 750, 1000, 1250, 1500], [
      { label: "New continuity", data: [0.097, 0.041, 0.008, 0.0012, 0.00014, 0.000016, 0.0000022, 0.00000051], color: colors.teal },
      { label: "Legacy continuity", data: [0.088, 0.052, 0.014, 0.0026, 0.00034, 0.000044, 0.0000068, 0.0000017], color: colors.orange },
      { label: "New energy", data: [7152, 1900, 180, 18, 2.1, 0.28, 0.046, 0.008], color: colors.amber, dash: true },
      { label: "Legacy energy", data: [6855, 2100, 260, 31, 4.6, 0.72, 0.11, 0.018], color: colors.gray, dash: true }
    ], { yLabel: "Scaled residual", xLabel: "Iteration", log: true });

    drawScatterChart("yplusChart", [
      { label: "Legacy y+", data: points([0, 10, 20, 26, 32, 38, 50, 65, 80, 95], [0.5, 1.2, 3.5, 11.2, 8.6, 4.1, 2.6, 2.1, 1.8, 1.6]), color: colors.orange },
      { label: "Redesigned y+", data: points([0, 15, 30, 45, 60, 75, 90, 110, 130, 150], [0.34, 0.8, 1.5, 2.4, 3.6, 4.8, 6.2, 7.8, 9.2, 10.6]), color: colors.blue }
    ], { yLabel: "Wall y+", xLabel: "Axial position (mm)" });

    var legacyX = [0, 20, 40, 55, 62.3, 70, 90, 110, 130, 150];
    var newX = [0, 20, 40, 60, 80, 100, 120, 140, 150];

    drawScatterChart("flowMachChart", [
      { label: "Legacy", data: points(legacyX, [0.016, 0.018, 0.022, 0.21, 0.908, 0.84, 0.80, 0.795, 0.792, 0.791]), color: colors.orange },
      { label: "Redesigned", data: points(newX, [0.016, 0.025, 0.06, 0.14, 0.27, 0.42, 0.55, 0.62, 0.64]), color: colors.blue }
    ], { yLabel: "Mach number", xLabel: "Axial position (mm)" });

    drawScatterChart("flowPressureChart", [
      { label: "Legacy total pressure", data: points(legacyX, [100000, 100000, 99980, 99100, 97700, 97000, 96600, 96380, 96320, 96312]), color: colors.orange },
      { label: "Redesigned total pressure", data: points(newX, [99999.8, 99999.6, 99998.5, 99982, 99954, 99910, 99870, 99842, 99832]), color: colors.blue }
    ], { yLabel: "Total pressure (Pa)", xLabel: "Axial position (mm)" });

    drawScatterChart("legacyFlowChart", [
      { label: "Legacy Mach", data: points(legacyX, [0.016, 0.018, 0.022, 0.21, 0.908, 0.84, 0.80, 0.795, 0.792, 0.791]), color: colors.orange },
      { label: "Legacy pressure / 100000", data: points(legacyX, [1.0, 1.0, 0.9998, 0.991, 0.977, 0.970, 0.966, 0.9638, 0.9632, 0.96312]), color: colors.teal, dash: true }
    ], { yLabel: "Mach or normalized pressure", xLabel: "Axial position (mm)" });

    drawScatterChart("wallTempChart", [
      { label: "Legacy wall", data: points([0, 10, 20, 25, 32, 38, 50, 65, 80, 95], [671.6, 671.3, 670.7, 665.0, 650.2, 642.0, 640.5, 640.0, 639.6, 639.2]), color: colors.orange },
      { label: "Redesigned wall", data: points([0, 20, 40, 60, 80, 100, 120, 140, 150], [673.0, 670.9, 667.8, 664.5, 660.2, 655.6, 651.7, 648.8, 647.9]), color: colors.blue }
    ], { yLabel: "Wall temperature (K)", xLabel: "Axial position (mm)" });

    drawBarChart("heatLossChart", ["Heat loss", "Resistance"], [
      { label: "Redesigned", data: [55.7, 5.19], color: colors.blue },
      { label: "Legacy", data: [18.8, 17.37], color: colors.orange }
    ], { yLabel: "W or K/W" });

    drawBarChart("outletGapChart", ["80 kPa", "40 kPa", "0 Pa", "Insulated"], [
      { label: "Legacy outlet temp advantage", data: [7.8, 4.75, 3.36, -1.24], color: [colors.orange, colors.orange, colors.orange, colors.blue] }
    ], { yLabel: "Temperature gap (K)" });

    drawBarChart("biotChart", ["Biot number", "Max wall dT"], [
      { label: "Legacy", data: [0.004, 0.70], color: colors.orange },
      { label: "Redesigned", data: [0.003, 0.06], color: colors.blue }
    ], { yLabel: "Dimensionless or K" });

    drawBarChart("insulationChart", ["Outlet wall temp", "Insulation effect"], [
      { label: "Legacy uninsulated", data: [627.2, 25.5], color: "rgba(208,98,44,0.58)" },
      { label: "Legacy insulated", data: [648.1, 0], color: colors.orange },
      { label: "Redesigned uninsulated", data: [597.6, 64.6], color: "rgba(37,99,168,0.58)" },
      { label: "Redesigned insulated", data: [653.8, 0], color: colors.blue }
    ], { yLabel: "K" });
  }

  ready(function () {
    try {
      renderAll();
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
