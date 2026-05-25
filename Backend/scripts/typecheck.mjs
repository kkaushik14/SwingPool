import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const TARGET_DIRECTORIES = ["src", "tests", "scripts"];

const collectJsFiles = (directory) => {
  const absoluteDir = path.resolve(projectRoot, directory);

  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const files = [];
  const stack = [absoluteDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.resolve(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(absolutePath);
      }
    }
  }

  return files;
};

const jsFiles = TARGET_DIRECTORIES.flatMap((directory) =>
  collectJsFiles(directory),
).sort((left, right) => left.localeCompare(right));

if (jsFiles.length === 0) {
  // eslint-disable-next-line no-console
  console.log("No JavaScript files found for typecheck.");
  process.exit(0);
}

let failed = false;

for (const filePath of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", filePath], {
      cwd: projectRoot,
      stdio: "pipe",
    });
  } catch (error) {
    failed = true;
    // eslint-disable-next-line no-console
    console.error(`Syntax check failed for ${filePath}`);
    // eslint-disable-next-line no-console
    console.error(error.stdout?.toString?.() || error.message);
    // eslint-disable-next-line no-console
    console.error(error.stderr?.toString?.() || "");
  }
}

if (failed) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`Syntax check passed for ${jsFiles.length} JavaScript files.`);
