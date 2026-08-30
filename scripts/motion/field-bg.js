const LENS_COLORS = {
  thermal: [[27, 15, 69], [101, 214, 201]],
  energy: [[27, 15, 69], [155, 214, 159]],
  decarbonisation: [[60, 20, 70], [240, 86, 29]],
  research: [[20, 20, 70], [143, 183, 255]],
  none: [[27, 15, 69], [240, 86, 29]],
};

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (from, to, t) => from.map((value, index) => lerp(value, to[index], t));

function scalarField(x, y, time) {
  return (
    Math.sin(x * 0.9 + time * 0.5) * 0.5 +
    Math.sin(y * 1.1 - time * 0.4) * 0.5 +
    Math.sin((x + y) * 0.6 + time * 0.7) * 0.5 +
    Math.sin(Math.hypot(x - 2.2, y - 1.6) * 1.3 - time * 0.9) * 0.7
  );
}

function ensureCanvas() {
  let canvas = document.querySelector("[data-field-bg-canvas]");
  if (canvas instanceof HTMLCanvasElement) return canvas;

  canvas = document.createElement("canvas");
  canvas.className = "field-bg-canvas";
  canvas.setAttribute("data-field-bg-canvas", "");
  canvas.setAttribute("aria-hidden", "true");

  const atmosphere = document.querySelector(".page-atmosphere");
  if (atmosphere) atmosphere.insertBefore(canvas, atmosphere.firstChild);
  else document.body.insertBefore(canvas, document.body.firstChild);
  return canvas;
}

function currentLens() {
  const mode = document.body?.dataset.homeMode || document.body?.dataset.lens || "none";
  return mode === "everything" ? "none" : mode;
}

export async function init(ctx = {}) {
  if (ctx.reducedMotion) return null;

  const canvas = ensureCanvas();
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;

  const scale = ctx.lowPower ? 7 : 5;
  let width = 0;
  let height = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let time = 0;
  let frameId = 0;
  let image = null;
  let colors = LENS_COLORS.none.map((color) => color.slice());

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(2, rect.width || window.innerWidth || 2);
    height = Math.max(2, rect.height || window.innerHeight || 2);
    canvasWidth = Math.max(2, Math.ceil(width / scale));
    canvasHeight = Math.max(2, Math.ceil(height / scale));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    image = context.createImageData(canvasWidth, canvasHeight);
  };

  const draw = () => {
    time += ctx.lowPower ? 0.004 : 0.006;

    const lensColors = LENS_COLORS[currentLens()] || LENS_COLORS.none;
    colors = colors.map((color, index) => mix(color, lensColors[index], 0.04));

    if (!image) resize();
    const data = image.data;

    for (let y = 0; y < canvasHeight; y += 1) {
      for (let x = 0; x < canvasWidth; x += 1) {
        const nx = (x / canvasWidth) * 4;
        const ny = (y / canvasHeight) * 3;
        const value = Math.max(0, Math.min(1, (scalarField(nx, ny, time) + 2.2) / 4.4));
        const band = Math.abs(((value * 7) % 1) - 0.5) * 2;
        const heat = Math.pow(value, 1.3);
        const contour = Math.pow(1 - band, 8) * 0.5;
        const color = mix(colors[0], colors[1], heat);
        const offset = (y * canvasWidth + x) * 4;

        data[offset] = Math.min(255, color[0] + contour * 180);
        data[offset + 1] = Math.min(255, color[1] + contour * 180);
        data[offset + 2] = Math.min(255, color[2] + contour * 180);
        data[offset + 3] = 22 + heat * 24 + contour * 48;
      }
    }

    context.putImageData(image, 0, 0);
    frameId = window.requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });

  return {
    canvas,
    destroy() {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.remove();
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
