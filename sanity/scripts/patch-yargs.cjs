/**
 * postinstall patch - marks yargs's package scope as CommonJS.
 *
 * Why:
 *   yargs 16 ships with `"type": "module"` in its own
 *   package.json AND an exports map that routes `require('yargs/yargs')`
 *   to an extensionless file `./yargs`. On Node 22+, that extensionless
 *   file is treated as ESM because of the type field - and yargs' own
 *   CJS code inside crashes with `ERR_REQUIRE_ESM`.
 *
 * The fix Node itself suggests in the error message:
 *   > change "type": "module" to "type": "commonjs" in yargs/package.json
 *     to treat all .js files as CommonJS
 *
 * This script does exactly that, every time `npm install` finishes.
 *
 * Idempotent: re-running on a patched yargs is a no-op.
 */
const fs = require("fs");
const path = require("path");

const YARGS_PKG = path.join(__dirname, "..", "node_modules", "yargs", "package.json");

if (!fs.existsSync(YARGS_PKG)) {
  // yargs is not installed (or this script ran in the wrong CWD); no patch is needed.
  process.exit(0);
}

try {
  const raw = fs.readFileSync(YARGS_PKG, "utf8");
  const pkg = JSON.parse(raw);

  if (pkg.type !== "commonjs") {
    pkg.type = "commonjs";
    fs.writeFileSync(YARGS_PKG, JSON.stringify(pkg, null, 2) + "\n");
    console.log("[postinstall] Patched node_modules/yargs/package.json: set type:commonjs for Sanity CLI compatibility.");
  } else {
    console.log("[postinstall] yargs already patched (type:commonjs).");
  }
} catch (err) {
  console.error("[postinstall] Failed to patch yargs:", err.message);
  process.exit(1);
}
