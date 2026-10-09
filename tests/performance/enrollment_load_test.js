#!/usr/bin/env node
/**
 * Concurrent enrollment load test.
 *
 * Required:
 *   LOAD_TEST_TOKENS_FILE=tests/student_tokens.json
 *   SECTION_ID=1
 *
 * Optional:
 *   API_URL=http://localhost:8080
 *   CONCURRENCY=100
 *   ADMIN_TOKEN=...
 *   EXPECTED_CAPACITY=40
 *
 * The token file must contain an array of distinct student JWT strings.
 */

const fs = require("node:fs");

const baseUrl = process.env.API_URL || "http://localhost:8080";
const sectionId = Number(process.env.SECTION_ID);
const concurrency = Number(process.env.CONCURRENCY || 100);
const tokensFile = process.env.LOAD_TEST_TOKENS_FILE;

if (!Number.isInteger(sectionId) || sectionId < 1) {
  throw new Error("SECTION_ID must be a positive integer");
}
if (!tokensFile) {
  throw new Error("LOAD_TEST_TOKENS_FILE is required");
}

const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf8"));
if (
  !Array.isArray(tokens) ||
  tokens.length === 0 ||
  tokens.some((token) => typeof token !== "string")
) {
  throw new Error(
    "The token file must contain a non-empty JSON array of JWT strings",
  );
}

async function enroll(token) {
  const response = await fetch(`${baseUrl}/api/enrollments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sectionId }),
  });
  return { status: response.status, body: await response.text() };
}

async function run() {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < tokens.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await enroll(tokens[index]);
      } catch (error) {
        results[index] = { status: 0, body: error.message };
      }
    }
  }

  const startedAt = performance.now();
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tokens.length) }, worker),
  );
  const durationMs = Math.round(performance.now() - startedAt);
  const successful = results.filter(
    (result) => result.status >= 200 && result.status < 300,
  ).length;
  const rejected = results.filter(
    (result) => result.status === 400 || result.status === 409,
  ).length;
  const serverErrors = results.filter(
    (result) => result.status >= 500 || result.status === 0,
  ).length;
  const unexpected = results.length - successful - rejected - serverErrors;

  console.log(
    JSON.stringify(
      {
        sectionId,
        requests: results.length,
        durationMs,
        requestsPerSecond: Number(
          (results.length / (durationMs / 1000)).toFixed(2),
        ),
        successful,
        businessRejected: rejected,
        serverErrors,
        unexpected,
      },
      null,
      2,
    ),
  );

  if (serverErrors > 0 || unexpected > 0) {
    process.exitCode = 1;
    return;
  }

  if (process.env.ADMIN_TOKEN && process.env.EXPECTED_CAPACITY) {
    const response = await fetch(
      `${baseUrl}/api/enrollments/section/${sectionId}`,
      {
        headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
      },
    );
    const payload = await response.json();
    const active = (payload.data || []).filter(
      (enrollment) => enrollment.status === "ENROLLED",
    ).length;
    const capacity = Number(process.env.EXPECTED_CAPACITY);
    console.log(
      JSON.stringify({ activeEnrollments: active, expectedCapacity: capacity }),
    );
    if (active > capacity) {
      console.error("FAIL: active enrollments exceed section capacity");
      process.exitCode = 1;
    }
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
