import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd } from "../src/components/seo/json-ld";
import { safeUrl } from "../src/lib/safe-url";
import { parseCatalogPage, loadCatalogProducts } from "../src/lib/catalog-query";
import { authOptions } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { requestIp } from "../src/lib/rate-limit";

test("JSON-LD cannot close its script element with CMS content", () => {
  const value = { name: '</script><script>alert("test")</script>', description: "Оборудование < 5" };
  const html = renderToStaticMarkup(createElement(JsonLd, { data: value }));
  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.equal((html.match(/<\/script>/g) ?? []).length, 1);
  const json = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
  assert.deepEqual(JSON.parse(json), value);
});

test("URL validation rejects local IPv4, IPv6, credentials schemes and protocol-relative URLs", () => {
  for (const url of ["http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://[fd00::1]/", "http://127.1/", "http://localhost./", "http://10.0.0.1/", "javascript:alert(1)", "//example.com/"]) {
    assert.equal(safeUrl.safeParse(url).success, false, url);
  }
  assert.equal(safeUrl.safeParse("https://example.com/document.pdf").success, true);
});

test("pagination rejects malformed and unbounded page numbers", () => {
  assert.equal(parseCatalogPage(undefined), 1);
  assert.equal(parseCatalogPage("2"), 2);
  for (const value of ["0", "-1", "2abc", "1.5", "", "999999999999999999999"]) {
    assert.throws(() => parseCatalogPage(value));
  }
});

test("out-of-range pagination never sends a huge offset query", async () => {
  const originalCount = db.product.count;
  const originalItems = db.product.findMany;
  let countCalls = 0;
  let itemCalls = 0;
  Reflect.set(db.product, "count", async () => { countCalls++; return 25; });
  Reflect.set(db.product, "findMany", async () => { itemCalls++; return []; });
  try {
    await assert.rejects(loadCatalogProducts({ page: 999999 }));
    assert.equal(countCalls, 1);
    assert.equal(itemCalls, 0);
  } finally { Reflect.set(db.product, "count", originalCount); Reflect.set(db.product, "findMany", originalItems); }
});

test("sessions reject inactive users, changed credentials, legacy tokens and database failures", async () => {
  const updatedAt = new Date("2026-09-01T00:00:00Z");
  let current: { isActive: boolean; role: "OWNER" | "EDITOR"; updatedAt: Date; name: string; email: string } | null = {
    isActive: true, role: "EDITOR", updatedAt, name: "Admin", email: "admin@example.com",
  };
  let fail = false;
  const originalFind = db.adminUser.findUnique;
  Reflect.set(db.adminUser, "findUnique", async () => { if (fail) throw new Error("DB unavailable"); return current; });
  const jwt = authOptions.callbacks!.jwt!;
  const check = (sessionVersion: string | undefined = updatedAt.toISOString()) => jwt({ token: { id: "test-admin", role: "OWNER", sessionVersion } } as never);
  try {
    assert.equal((await check()).role, "EDITOR");
    current = { ...current!, isActive: false };
    assert.deepEqual(await check(), {});
    current = { ...current, isActive: true, updatedAt: new Date(updatedAt.getTime() + 1) };
    assert.deepEqual(await check(), {});
    assert.deepEqual(await jwt({ token: { id: "test-admin" } } as never), {});
    current = null;
    assert.deepEqual(await check(), {});
    fail = true;
    await assert.rejects(Promise.resolve(check()));
    const session = await authOptions.callbacks!.session!({ session: { user: { id: "old", role: "OWNER" }, expires: "" }, token: {} } as never);
    assert.equal(session.user, undefined);
  } finally { Reflect.set(db.adminUser, "findUnique", originalFind); }
});

test("untrusted forwarded headers cannot supply the rate-limit IP", () => {
  const trusted = process.env.TRUST_PROXY;
  delete process.env.TRUST_PROXY;
  try {
    const h = new Headers({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" });
    assert.equal(requestIp(h), null);
    process.env.TRUST_PROXY = "true";
    assert.equal(requestIp(h), "203.0.113.1");
    assert.equal(requestIp(new Headers({ "x-forwarded-for": "spoofed" })), null);
  } finally {
    if (trusted === undefined) delete process.env.TRUST_PROXY; else process.env.TRUST_PROXY = trusted;
  }
});
