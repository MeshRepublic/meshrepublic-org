// Cloudflare Pages Function: POST /api/subscribe
// Requires a KV namespace bound as SUBSCRIBERS (Pages project -> Settings -> Bindings).
export async function onRequestPost({ request, env }) {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }

  // Honeypot: real visitors leave it empty; bots fill it. Pretend success.
  if (body.website) return json({ ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254)
    return json({ error: "That address does not look right." }, 400);

  if (!env.SUBSCRIBERS) return json({ error: "The roll is not yet open." }, 503);

  const key = "sub:" + email;
  const existing = await env.SUBSCRIBERS.get(key);
  if (!existing) {
    await env.SUBSCRIBERS.put(key, JSON.stringify({
      email,
      enrolled: new Date().toISOString(),
      source: "meshrepublic.org"
    }));
  }
  return json({ ok: true });
}
export async function onRequest({ request }) {
  if (request.method === "POST") return undefined; // handled above
  return new Response("Method Not Allowed", { status: 405 });
}
