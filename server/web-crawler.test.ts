import assert from "node:assert/strict";
import test from "node:test";
import { crawlWebsite } from "./web-crawler";

function htmlResponse(url: string, body: string, status = 200): Response {
  return new Response(body, {
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    headers: { "content-type": "text/html" },
  });
}

test("crawls homepage plus same-origin feature and pricing pages from relative links", async () => {
  const requested: string[] = [];
  const pages: Record<string, string> = {
    "https://example.com": `<title>Acme</title><h1>Specialist platform</h1>
      <a href="/services/laser-audits?campaign=1#details">Our services</a>
      <a href="pricing/">Plans and pricing</a>
      <a href="https://outside.example/features">External features</a>`,
    "https://example.com/services/laser-audits": "<title>Services</title><h1>Laser compliance audits</h1>",
    "https://example.com/pricing": "<title>Pricing</title><p>Fixed fee audit package: $900</p>",
  };
  const fetchMock: typeof fetch = async (input) => {
    const url = String(input);
    requested.push(url);
    const body = pages[url];
    return body ? htmlResponse(url, body) : htmlResponse(url, "missing", 404);
  };

  const result = await crawlWebsite("example.com", { fetch: fetchMock });

  assert.deepEqual(
    result.pages?.map((page) => page.kind),
    ["homepage", "features", "pricing"],
    `requested URLs: ${requested.join(", ")}`,
  );
  assert.match(result.pages?.[1].text || "", /Laser compliance audits/);
  assert.match(result.pages?.[2].text || "", /\$900/);
  assert.ok(!requested.some((url) => url.includes("outside.example")));
});

test("keeps homepage evidence when optional pages fail", async () => {
  const fetchMock: typeof fetch = async (input) => {
    const url = String(input);
    if (url === "https://example.com") {
      return htmlResponse(url, "<title>Acme</title><h1>Homepage service evidence</h1>");
    }
    return htmlResponse(url, "missing", 404);
  };

  const result = await crawlWebsite("example.com", { fetch: fetchMock });
  assert.equal(result.error, undefined);
  assert.equal(result.pages?.length, 1);
  assert.match(result.pages?.[0].text || "", /Homepage service evidence/);
});

test("reports homepage timeouts without hanging", async () => {
  const fetchMock: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      reject(new DOMException("aborted", "AbortError"));
    });
  });

  const result = await crawlWebsite("example.com", { fetch: fetchMock, timeoutMs: 5 });
  assert.match(result.error || "", /timed out/);
  assert.equal(result.pages, undefined);
});