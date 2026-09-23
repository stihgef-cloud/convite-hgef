const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (request.method === "POST" && url.pathname === "/rsvp") {
      let data;
      try {
        data = await request.json();
      } catch {
        return json({ error: "JSON inválido." }, 400);
      }

      const name = String(data.name ?? "").trim();
      const attendance = String(data.attendance ?? "").trim();
      const guests = Math.min(Math.max(parseInt(data.guests, 10) || 0, 0), 20);
      const note = String(data.note ?? "").trim();

      if (!name || !attendance) {
        return json({ error: "Nome e presença são obrigatórios." }, 400);
      }

      try {
        await env.DB.prepare(
          "INSERT INTO rsvp (name, attendance, guests, note) VALUES (?, ?, ?, ?)"
        )
          .bind(name, attendance, guests, note || null)
          .run();

        return json({ ok: true });
      } catch {
        return json({ error: "Erro ao salvar." }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
