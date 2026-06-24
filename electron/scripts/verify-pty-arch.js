const { execSync } = require("child_process");
const path = require("path");

const expected = (process.argv[2] || "arm64").toLowerCase();
const ptyPath = path.join(
  __dirname,
  "../node_modules/node-pty/build/Release/pty.node"
);

try {
  const output = execSync(`file "${ptyPath}"`, { encoding: "utf8" });
  if (!output.toLowerCase().includes(expected)) {
    console.error(`[verify-pty-arch] expected ${expected}, got:\n${output}`);
    process.exit(1);
  }
  console.log(`[verify-pty-arch] ok: ${output.trim()}`);
} catch (err) {
  console.error(`[verify-pty-arch] failed: ${err.message}`);
  process.exit(1);
}
