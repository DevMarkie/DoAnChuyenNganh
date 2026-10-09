#!/usr/bin/env node
/** Generate JWTs for the deterministic students from database/generate_scale_seed.js. */

const fs = require("node:fs");

const baseUrl = process.env.API_URL || "http://localhost:8080";
const count = Number(process.env.TOKEN_COUNT || 5000);
const firstStudentNumber = Number(process.env.FIRST_STUDENT_NUMBER || 2600001);
const password = process.env.STUDENT_PASSWORD || "123456";
const concurrency = Number(process.env.TOKEN_CONCURRENCY || 50);
const output = process.env.TOKENS_OUTPUT || "tests/results/student_tokens.json";

function getUsernames() {
  if (!process.env.STUDENT_RANGES) {
    return Array.from({ length: count }, (_, index) =>
      String(firstStudentNumber + index),
    );
  }

  return process.env.STUDENT_RANGES.split(",").flatMap((range) => {
    const [startValue, rangeCountValue] = range.split(":");
    const start = Number(startValue);
    const rangeCount = Number(rangeCountValue);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(rangeCount) ||
      rangeCount < 1
    ) {
      throw new Error(`Invalid STUDENT_RANGES entry: ${range}`);
    }
    return Array.from({ length: rangeCount }, (_, index) =>
      String(start + index),
    );
  });
}

async function login(username) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.data?.token) {
    throw new Error(`Login failed for ${username}: HTTP ${response.status}`);
  }
  return payload.data.token;
}

async function main() {
  const usernames = getUsernames();
  if (!Number.isInteger(count) || count < 1 || usernames.length < 1)
    throw new Error("TOKEN_COUNT or STUDENT_RANGES must contain users");
  const tokens = [];
  let cursor = 0;

  async function worker() {
    while (cursor < usernames.length) {
      const index = cursor;
      cursor += 1;
      tokens[index] = await login(usernames[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, usernames.length) }, worker),
  );
  fs.writeFileSync(output, JSON.stringify(tokens, null, 2), "utf8");
  console.log(`Generated ${tokens.length} tokens at ${output}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
