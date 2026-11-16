import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseWpGutenbergMapFromHtml } from "./update-upstream-indices.mjs";

test("maps columns by header name, whatever their order", () => {
  const gutenbergFirst = `<table><tr><th>Gutenberg Version</th><th>WordPress Version</th></tr>
    <tr><td>23.6</td><td>7.1.X</td></tr><tr><td>4.6.1</td><td>5.0.0-5.0.1</td></tr></table>`;
  const wordpressFirst = `<table><tr><th>WordPress Versions</th><th>Gutenberg Versions</th></tr>
    <tr><td>7.1.X</td><td>23.6</td></tr></table>`;

  assert.deepEqual(parseWpGutenbergMapFromHtml(gutenbergFirst).rows, [
    { wordpress: "7.1.X", gutenberg: "23.6" },
    { wordpress: "5.0.0-5.0.1", gutenberg: "4.6.1" },
  ]);
  assert.deepEqual(parseWpGutenbergMapFromHtml(wordpressFirst).rows, [{ wordpress: "7.1.X", gutenberg: "23.6" }]);
});

test("reports a missing table instead of rows", () => {
  assert.deepEqual(parseWpGutenbergMapFromHtml("<table><tr><th>Other</th></tr></table>"), {
    rows: [],
    note: "table-not-found",
  });
});

test("rejects missing, empty, or invalid Gutenberg cells in either column order", () => {
  for (const cells of ["<td>7.1.X</td>", "<td>7.1.X</td><td></td>", "<td>7.1.X</td><td>unknown</td>"]) {
    assert.throws(() => parseWpGutenbergMapFromHtml(
      `<table><tr><th>WordPress Version</th><th>Gutenberg Version</th></tr><tr>${cells}</tr></table>`
    ), /Invalid Gutenberg version/);
  }
  assert.throws(() => parseWpGutenbergMapFromHtml(
    `<table><tr><th>Gutenberg Version</th><th>WordPress Version</th></tr>
      <tr><td>23.6</td><td>7.1.X</td></tr><tr><td></td><td>7.0.X</td></tr></table>`
  ), /Invalid Gutenberg version/);
});

test("accepts version ranges in both columns", () => {
  assert.deepEqual(parseWpGutenbergMapFromHtml(
    `<table><tr><th>WordPress Version</th><th>Gutenberg Version</th></tr>
      <tr><td>6.9.X</td><td>20.5-21.9</td></tr></table>`
  ).rows, [{ wordpress: "6.9.X", gutenberg: "20.5-21.9" }]);
});

test("rejects malformed numeric prefixes in either column order", () => {
  for (const value of ["23.6garbage", "23.6-", "23.6.???"]) {
    for (const gutenbergFirst of [true, false]) {
      const headers = gutenbergFirst ? ["Gutenberg Version", "WordPress Version"] : ["WordPress Version", "Gutenberg Version"];
      const cells = gutenbergFirst ? [value, "7.1.X"] : ["7.1.X", value];
      assert.throws(() => parseWpGutenbergMapFromHtml(
        `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr><tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr></table>`
      ), /Invalid Gutenberg version/);
    }
  }
});

test("failed scrapes leave all index files unchanged", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "upstream-index-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const refs = path.join(root, "shared", "references");
  fs.mkdirSync(refs, { recursive: true });
  const names = ["wordpress-core-versions.json", "gutenberg-releases.json", "wp-gutenberg-version-map.json"];
  for (const name of names) fs.writeFileSync(path.join(refs, name), "sentinel\n");
  const script = new URL("./update-upstream-indices.mjs", import.meta.url);
  for (const html of [
    "<html>no table</html>",
    "<table><tr><th>WordPress Version</th><th>Gutenberg Version</th></tr><tr><td>7.1.X</td></tr></table>",
    ...["23.6garbage", "23.6-", "23.6.???"].map((value) =>
      `<table><tr><th>WordPress Version</th><th>Gutenberg Version</th></tr><tr><td>7.1.X</td><td>${value}</td></tr></table>`
    ),
  ]) {
    const code = `process.argv[1] = ${JSON.stringify(fileURLToPath(script))};
      globalThis.fetch = async (url) => ({ ok: true, text: async () =>
        url.includes('version-check') ? '{}' : url.includes('api.github.com') ? '[]' : ${JSON.stringify(html)} });
      await import(${JSON.stringify(script.href)});`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /No WordPress\/Gutenberg rows parsed|Invalid Gutenberg version/);
    for (const name of names) assert.equal(fs.readFileSync(path.join(refs, name), "utf8"), "sentinel\n");
  }
});
