#!/usr/bin/env node
"use strict";

// Installs the TigerSwift skill into a project's .claude/skills/tigerswift/ directory.
// Zero dependencies — Node built-ins only.
//
// Usage (point at your local copy of this folder):
//   npx /path/to/tigerswift [target-dir]
//   node /path/to/tigerswift/bin/install.js [target-dir]
//
// target-dir defaults to the current working directory.

const fs = require("fs");
const path = require("path");

const SKILL_NAME = "tigerswift";

function main() {
  const packageRoot = path.join(__dirname, "..");
  const source = path.join(packageRoot, SKILL_NAME);

  // The skill folder must exist in the package, with its SKILL.md entry point.
  if (!fs.existsSync(path.join(source, "SKILL.md"))) {
    fail(
      `Could not find the skill at ${source}.\n` +
        "Run this from a complete copy of the TigerSwift package."
    );
  }

  const target = path.resolve(process.argv[2] || process.cwd());
  if (!fs.existsSync(target)) {
    fail(`Target directory does not exist: ${target}`);
  }

  const destination = path.join(target, ".claude", "skills", SKILL_NAME);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });

  console.log(`✓ TigerSwift skill installed to ${destination}`);
  console.log("  Invoke it in this project with: /tigerswift");
  console.log("  Modes: /tigerswift | /tigerswift analyze <file> | /tigerswift check");
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

main();
