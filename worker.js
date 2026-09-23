const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ADMIN_HTML = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirmações | 84º Aniversário HGF</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Inter,system-ui,sans-serif;margin:0;background:#f4f5f7;color:#172033}
  header{background:#07133f;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;gap:12px}
  header h1{margin:0;font-size:1.05rem}
  header button{background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font:inherit}
  .wrap{max-width:1050px;margin:22px auto;padding:0 16px}
  .card{background:#fff;border:1px solid #e3e0d8;border-radius:14px;padding:18px;margin-bottom:16px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:16px}
  .stat{background:#fff;border:1px solid #e3e0d8;border-radius:14px;padding:16px}
  .stat b{display:block;font-size:1.9rem;color:#07133f;line-height:1.1}
  .stat span{color:#687083;font-size:.82rem}
  form{display:flex;gap:8px;flex-wrap:wrap}
  input[type=password]{flex:1;min-width:220px;padding:12px 14px;border:1px solid #ccc;border-radius:10px;font:inherit}
  .btn{padding:12px 18px;border:0;border-radius:10px;background:linear-gradient(135deg,#f1d67b,#d9ae3d);color:#07133f;font-weight:800;cursor:pointer;font:inherit}
  .btn-ghost{padding:10px 16px;border:1px solid #d9ae3d;border-radius:10px;background:#fff;color:#07133f;font-weight:700;cursor:pointer;font:inherit}
  table{width:100%;border-collapse:collapse;font-size:.9rem}
  th,td{text-align:left;padding:10px;border-bottom:1px solid #eee;vertical-align:top}
  th{color:#687083;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
  .err{color:#b03030;min-height:1.2em;margin:10px 0 0}
  .pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:.78rem;font-weight:700}
  .yes{background:#e2f3ea;color:#1d7a51}
  .no{background:#fbe6e6;color:#b03030}
  .muted{color:#687083}
  @media(max-width:600px){ .hide-sm{display:none} }
</style>
</head>
<body>
<header>
  <h1>Confirmações · 84º Aniversário HGF</h1>
  <button id="logout" style="display:none">Sair</button>
</header>
<div class="wrap">
  <div class="card" id="loginCard">
    <form id="loginForm">
      <input type="password" id="token" placeholder="Senha de administrador" autocomplete="current-password" required>
      <button class="btn" type="submit">Entrar</button>
    </form>
    <p class="err" id="err"></p>
  </div>
  <div id="panel" style="display:none">
    <div class="stats" id="stats"></div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <strong>Lista de respostas</strong>
        <button class="btn-ghost" id="csv">Baixar CSV</button>
      </div>
      <div style="overflow:auto;margin-top:12px">
        <table>
          <thead><tr>
            <th>Nome</th><th>Presença</th><th>Acompanhantes</th><th class="hide-sm">Observação</th><th class="hide-sm">Data</th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<script>
(function(){
  var KEY = "hgf_admin_token";
  var token = sessionStorage.getItem(KEY) || "";
  var loginCard = document.getElementById("loginCard");
  var panel = document.getElementById("panel");
  var err = document.getElementById("err");
  var logout = document.getElementById("logout");

  function el(tag, text, cls){ var e=document.createElement(tag); if(text!=null) e.textContent=text; if(cls) e.className=cls; return e; }
  function isNo(v){ return String(v).trim().charAt(0).toLowerCase() === "n"; }

  function render(rows){
    var yes=0,no=0,guests=0;
    rows.forEach(function(r){ if(isNo(r.attendance)){no++;}else{yes++;} guests += Number(r.guests)||0; });
    var stats=document.getElementById("stats");
    stats.innerHTML="";
    [["Respostas",rows.length],["Confirmados",yes],["Não vão",no],["Acompanhantes",guests]].forEach(function(p){
      var s=el("div",null,"stat");
      s.appendChild(el("b",String(p[1])));
      s.appendChild(el("span",p[0]));
      stats.appendChild(s);
    });
    var tbody=document.getElementById("rows");
    tbody.innerHTML="";
    if(!rows.length){
      var tr=el("tr"); var td=el("td","Nenhuma resposta ainda.","muted"); td.colSpan=5; tr.appendChild(td); tbody.appendChild(tr); return;
    }
    rows.forEach(function(r){
      var tr=el("tr");
      tr.appendChild(el("td",r.name));
      var td=el("td"); td.appendChild(el("span",r.attendance,"pill "+(isNo(r.attendance)?"no":"yes"))); tr.appendChild(td);
      tr.appendChild(el("td",String(r.guests)));
      tr.appendChild(el("td",r.note||"—","hide-sm"));
      tr.appendChild(el("td",r.created_at||"","hide-sm muted"));
      tbody.appendChild(tr);
    });
  }

  function load(){
    err.textContent="";
    fetch("/admin/data?key="+encodeURIComponent(token))
      .then(function(r){ if(r.status===401) throw new Error("unauth"); return r.json(); })
      .then(function(d){
        loginCard.style.display="none";
        panel.style.display="block";
        logout.style.display="inline-block";
        render(d.rows);
      })
      .catch(function(e){
        sessionStorage.removeItem(KEY);
        err.textContent = (e.message==="unauth") ? "Senha inválida." : "Erro ao carregar.";
      });
  }

  document.getElementById("loginForm").addEventListener("submit", function(ev){
    ev.preventDefault();
    token=document.getElementById("token").value;
    sessionStorage.setItem(KEY,token);
    load();
  });

  logout.addEventListener("click", function(){
    sessionStorage.removeItem(KEY); token="";
    panel.style.display="none"; logout.style.display="none";
    loginCard.style.display="block"; document.getElementById("token").value="";
  });

  document.getElementById("csv").addEventListener("click", function(){
    fetch("/admin/data?key="+encodeURIComponent(token)).then(function(r){return r.json();}).then(function(d){
      function esc(v){ v=(v==null?"":String(v)); return '"'+v.replace(/"/g,'""')+'"'; }
      var lines=["Nome,Presenca,Acompanhantes,Observacao,Data"];
      d.rows.forEach(function(r){ lines.push([esc(r.name),esc(r.attendance),esc(r.guests),esc(r.note),esc(r.created_at)].join(",")); });
      var blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
      var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="confirmacoes-hgf.csv"; a.click(); URL.revokeObjectURL(a.href);
    });
  });

  if(token){ load(); }
  else { loginCard.style.display="block"; }
})();
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (request.method === "GET" && url.pathname === "/admin") {
      return new Response(ADMIN_HTML, {
        headers: { "Content-Type": "text/html;charset=utf-8" },
      });
    }

    if (request.method === "GET" && url.pathname === "/admin/data") {
      const key = url.searchParams.get("key") || "";
      if (!(await checkAuth(env, key))) {
        return json({ error: "Não autorizado." }, 401);
      }
      const { results } = await env.DB.prepare(
        "SELECT name, attendance, guests, note, created_at FROM rsvp ORDER BY created_at DESC"
      ).all();
      return json({ rows: results });
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

async function checkAuth(env, key) {
  if (!key) return false;
  try {
    const row = await env.DB.prepare("SELECT password FROM admin LIMIT 1").first();
    if (row && row.password) return key === row.password;
  } catch {}
  if (env.ADMIN_TOKEN) return key === env.ADMIN_TOKEN;
  return false;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
