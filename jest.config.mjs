import nextJest from "next/jest.js";

// next/jest compiles TS/TSX with the Next.js compiler (SWC), loads next.config
// and .env files, and maps `server-only` to an empty module.
const createJestConfig = nextJest({ dir: "./" });

// ESM-only dependencies that Jest (CommonJS) must compile. next/jest skips
// node_modules except for its own list of transpiled packages.
const ESM_PACKAGES = ["jose"];

/** @type {import("jest").Config} */
const config = {
  testEnvironment: "node",
  // Unit tests only; Playwright specs in e2e/ are run separately.
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default async function jestConfig() {
  const resolved = await createJestConfig(config)();

  // next/jest's node_modules ignore patterns end in a negative lookahead of
  // packages to transpile, e.g. `/node_modules/(?!.pnpm)(?!(geist|...)/)`.
  // Add our ESM packages to that list.
  let patched = false;
  resolved.transformIgnorePatterns = resolved.transformIgnorePatterns.map(
    (pattern) => {
      if (!pattern.startsWith("/node_modules") || !pattern.includes("(?!(")) {
        return pattern;
      }
      patched = true;
      return pattern.replace("(?!(", `(?!(${ESM_PACKAGES.join("|")}|`);
    },
  );
  if (!patched) {
    throw new Error("jest.config.mjs: could not add ESM packages to transformIgnorePatterns");
  }

  return resolved;
}
