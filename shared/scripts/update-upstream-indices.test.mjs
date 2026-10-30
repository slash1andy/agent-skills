import assert from "node:assert/strict";
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
