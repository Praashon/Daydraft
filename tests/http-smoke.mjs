// Run against a production build using local placeholder Supabase settings:
// next start --hostname 127.0.0.1 --port 3100
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3100";
for (const route of ["/", "/login", "/signup"]) {
  const start = performance.now();
  const response = await fetch(base + route, { redirect: "manual" });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  if (route === "/") {
    assert.match(html, /href="\/login"[^>]*>Sign in<\/a>/);
    assert.match(html, /href="\/signup"[^>]*>Create account/);
    assert.doesNotMatch(html, /Launch App/);
  } else if (route === "/login") {
    assert.match(html, /Username or email/);
  } else {
    assert.match(html, /Create account/);
  }
  console.log(`${route}: rendered without a redirect in ${Math.round(performance.now() - start)} ms`);
}

const protectedResponse = await fetch(base + "/dashboard", { redirect: "manual" });
assert.equal(protectedResponse.status, 307);
assert.equal(new URL(protectedResponse.headers.get("location"), base).pathname, "/login");
console.log("Dashboard remains protected for signed-out visitors.");

for (const [body, status] of [[{ text: "" }, 400], [{ text: "Finish report", provider: "openrouter" }, 401]]) {
  const response = await fetch(base + "/api/organize", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  assert.equal(response.status, status);
  assert.ok((await response.json()).error);
  console.log(`Organize API: expected ${status} with a visible explanation.`);
}
