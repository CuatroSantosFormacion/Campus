// =====================================================================
//  CAMPUS VIRTUAL · CUATRO SANTOS FORMACIÓN
//  Aplicación del campus (no hace falta tocar este archivo).
// =====================================================================

const C = window.CAMPUS_CONFIG || {};
const DEMO = !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY;
const CARPETAS = C.CARPETAS || [];
const NOMBRE = C.NOMBRE || "Cuatro Santos Formación";
const app = document.getElementById("app");

let sb = null;          // cliente de Supabase
let api = null;         // capa de datos (Supabase o demostración)
const S = { perfil: null, recuperando: false, errorAcceso: "", ultimoMensaje: "" };

// ---------------------------------------------------------------------
//  Iconos (trazos sencillos)
// ---------------------------------------------------------------------
const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  inicio: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>'),
  temario: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
  carpeta: svg('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>'),
  presentacion: svg('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/><path d="M8 12l3-3 2 2 3-3"/>'),
  cuestionario: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8"/><path d="M14 9.5h2.5"/><path d="m8 15 1.5 1.5L12 14"/><path d="M14 15.5h2.5"/>'),
  clases: svg('<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>'),
  avisos: svg('<path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M17 8.5a5 5 0 0 1 0 7"/>'),
  alumnado: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>'),
  cuenta: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  pdf: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
  video: svg('<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>'),
  enlace: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  mas: svg('<path d="M12 5v14M5 12h14"/>'),
  editar: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  borrar: svg('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
  externo: svg('<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
  correo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>'),
  calendario: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  ver: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  grafica: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
};

// ---------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const urlSegura = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "#");
const urlBase = () => location.origin + location.pathname;
const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fechaLarga = (d) => new Date(d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fechaCorta = (d) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
const hora = (d) => new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const nota10 = (p, t) => (t ? ((p / t) * 10).toFixed(1).replace(".", ",") : "–");
const nombreCarpeta = (id) => (CARPETAS.find((c) => c.id === id) || {}).nombre || "";
const aLocalInput = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const ordenar = (a, b) => (a.orden || 0) - (b.orden || 0) || String(a.titulo).localeCompare(String(b.titulo), "es", { numeric: true });
const esProfesor = () => S.perfil && S.perfil.rol === "profesor";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

function toast(msg, tipo = "") {
  const t = document.createElement("div");
  t.className = "toast " + tipo;
  t.textContent = msg;
  document.getElementById("toasts").appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

function modal({ titulo, cuerpo, pie = "", ancho = false }) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `<div class="modal ${ancho ? "ancho" : ""}" role="dialog" aria-modal="true">
      <div class="franja"></div>
      <div class="modal-cab"><h2>${titulo}</h2><button class="cerrar" data-cerrar aria-label="Cerrar">${I.x}</button></div>
      <div class="modal-cuerpo">${cuerpo}</div>
      ${pie ? `<div class="modal-pie">${pie}</div>` : ""}
    </div>`;
  const cerrar = () => { fondo.remove(); document.removeEventListener("keydown", tecla); };
  const tecla = (e) => { if (e.key === "Escape") cerrar(); };
  fondo.addEventListener("click", (e) => { if (e.target === fondo || e.target.closest("[data-cerrar]")) cerrar(); });
  document.addEventListener("keydown", tecla);
  document.body.appendChild(fondo);
  const primero = fondo.querySelector("input, textarea, select");
  if (primero) setTimeout(() => primero.focus(), 30);
  return { el: fondo, cerrar };
}

function confirmar(mensaje, boton = "Borrar") {
  return new Promise((ok) => {
    const m = modal({
      titulo: "Confirmar",
      cuerpo: `<p style="margin:0">${mensaje}</p>`,
      pie: `<button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="siConfirmar">${boton}</button>`,
    });
    m.el.querySelector("#siConfirmar").onclick = () => { m.cerrar(); ok(true); };
    m.el.addEventListener("click", (e) => { if (e.target.closest("[data-cerrar]")) ok(false); });
  });
}

function mensajeError(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(m)) return "El correo aún no está confirmado.";
  if (/Password should be at least/i.test(m)) return "La contraseña debe tener al menos 6 caracteres.";
  if (/rate limit/i.test(m)) return "Demasiados intentos seguidos. Espera unos minutos.";
  if (/already registered|already been registered/i.test(m)) return "Ese correo ya está registrado.";
  return m;
}

// Convierte enlaces de Drive, Docs, Slides, YouTube o Vimeo en visores incrustados
function urlIncrustable(u) {
  try {
    const x = new URL(u);
    const host = x.hostname.replace(/^www\./, "");
    if (host === "youtube.com" && x.searchParams.get("v")) return "https://www.youtube-nocookie.com/embed/" + x.searchParams.get("v");
    if (host === "youtube.com" && x.pathname.startsWith("/embed/")) return u;
    if (host === "youtu.be") return "https://www.youtube-nocookie.com/embed" + x.pathname;
    if (host === "drive.google.com") {
      const m = x.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
      const id = x.searchParams.get("id");
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
    if (host === "docs.google.com") {
      const m = x.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([^/]+)/);
      if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
    }
    if (host.endsWith("vimeo.com")) { const m = x.pathname.match(/\/(\d+)/); if (m) return "https://player.vimeo.com/video/" + m[1]; }
    if (/\.pdf$/i.test(x.pathname)) return u;
  } catch (e) { /* enlace no válido */ }
  return null;
}

function abrirVisor(titulo, url) {
  const segura = urlSegura(url);
  const emb = urlIncrustable(segura);
  if (!emb) { window.open(segura, "_blank", "noopener"); return; }
  modal({
    titulo: esc(titulo),
    ancho: true,
    cuerpo: `<iframe src="${esc(emb)}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>`,
    pie: `<a class="btn sec" href="${esc(segura)}" target="_blank" rel="noopener">${I.externo} Abrir en pestaña nueva</a><button class="btn" data-cerrar>Cerrar</button>`,
  });
}

// Importador de preguntas desde texto
function parsearPreguntas(txt) {
  return txt.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
    const texto = []; const opciones = []; let correcta = 0; let explicacion = "";
    for (const l of b.split("\n").map((s) => s.trim()).filter(Boolean)) {
      const m = l.match(/^(\*)?\s*([a-hA-H])\s*[\)\.\-]\s*(.+)$/);
      if (m) { if (m[1]) correcta = opciones.length; opciones.push(m[3].trim()); }
      else if (l.startsWith(">")) explicacion += (explicacion ? " " : "") + l.slice(1).trim();
      else if (!opciones.length) texto.push(l.replace(/^\d+\s*[\.\)\-]\s*/, ""));
    }
    return { texto: texto.join(" "), opciones, correcta, explicacion };
  }).filter((p) => p.texto && p.opciones.length >= 2);
}

// ---------------------------------------------------------------------
//  Capa de datos: SUPABASE
// ---------------------------------------------------------------------
function apiSupabase(createClient) {
  const t = (r) => { if (r.error) throw r.error; return r.data; };
  return {
    async sesion() { const { data } = await sb.auth.getSession(); return data.session; },
    async entrar(email, password) { t(await sb.auth.signInWithPassword({ email, password })); },
    async salir() { await sb.auth.signOut(); },
    async recuperar(email) { t(await sb.auth.resetPasswordForEmail(email, { redirectTo: urlBase() })); },
    async cambiarPassword(password) { t(await sb.auth.updateUser({ password })); },
    async miPerfil() {
      const { data } = await sb.auth.getUser();
      if (!data.user) return null;
      return t(await sb.from("perfiles").select("*").eq("id", data.user.id).maybeSingle());
    },

    async materiales(seccion) { return t(await sb.from("materiales").select("*").eq("seccion", seccion)).sort(ordenar); },
    async resumenMateriales() { return t(await sb.from("materiales").select("id,seccion,carpeta")); },
    async guardarMaterial(m) {
      const { id, ...d } = m;
      if (id) t(await sb.from("materiales").update(d).eq("id", id));
      else t(await sb.from("materiales").insert(d));
    },
    async borrarMaterial(id) { t(await sb.from("materiales").delete().eq("id", id)); },

    async cuestionarios() { return t(await sb.from("cuestionarios").select("*").order("created_at", { ascending: false })); },
    async cuestionario(id) { return t(await sb.from("cuestionarios").select("*").eq("id", id).single()); },
    async soluciones(id) {
      const r = t(await sb.from("cuestionario_soluciones").select("soluciones").eq("cuestionario_id", id).maybeSingle());
      return r ? r.soluciones : [];
    },
    async guardarCuestionario(q, soluciones) {
      const d = { titulo: q.titulo, descripcion: q.descripcion, carpeta: q.carpeta || null, preguntas: q.preguntas, publicado: q.publicado };
      let id = q.id;
      if (id) t(await sb.from("cuestionarios").update(d).eq("id", id));
      else id = t(await sb.from("cuestionarios").insert(d).select("id").single()).id;
      t(await sb.from("cuestionario_soluciones").upsert({ cuestionario_id: id, soluciones }));
      return id;
    },
    async borrarCuestionario(id) { t(await sb.from("cuestionarios").delete().eq("id", id)); },
    async corregir(id, respuestas) { return t(await sb.rpc("corregir_cuestionario", { p_cuestionario: id, p_respuestas: respuestas })); },
    async misIntentos() {
      return t(await sb.from("intentos").select("cuestionario_id,puntuacion,total,created_at").eq("alumno_id", S.perfil.id).order("created_at", { ascending: false }));
    },
    async intentosDe(cid) {
      return t(await sb.from("intentos").select("id,puntuacion,total,created_at,perfiles(nombre,email)").eq("cuestionario_id", cid).order("created_at", { ascending: false }));
    },
    async borrarIntento(id) { t(await sb.from("intentos").delete().eq("id", id)); },

    async clases() { return t(await sb.from("clases").select("*").order("fecha")); },
    async guardarClase(c) { const { id, ...d } = c; if (id) t(await sb.from("clases").update(d).eq("id", id)); else t(await sb.from("clases").insert(d)); },
    async borrarClase(id) { t(await sb.from("clases").delete().eq("id", id)); },

    async avisos() { return t(await sb.from("avisos").select("*").order("created_at", { ascending: false })); },
    async guardarAviso(a) { const { id, ...d } = a; if (id) t(await sb.from("avisos").update(d).eq("id", id)); else t(await sb.from("avisos").insert(d)); },
    async borrarAviso(id) { t(await sb.from("avisos").delete().eq("id", id)); },

    async alumnos() { return t(await sb.from("perfiles").select("*").order("nombre")); },
    async crearAlumno({ nombre, email, password }) {
      // Cliente aparte para no cerrar la sesión del profesor
      const tmp = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "cs-alta-temporal" },
      });
      const r = t(await tmp.auth.signUp({ email, password }));
      if (!r.user || (r.user.identities && r.user.identities.length === 0)) throw new Error("Ese correo ya está registrado.");
      t(await sb.from("perfiles").insert({ id: r.user.id, nombre, email, rol: "alumno" }));
    },
    async actualizarPerfil(id, cambios) { t(await sb.from("perfiles").update(cambios).eq("id", id)); },
  };
}

// ---------------------------------------------------------------------
//  Capa de datos: MODO DEMOSTRACIÓN (en memoria, sin guardar nada)
// ---------------------------------------------------------------------
function apiDemo() {
  const ahora = Date.now();
  const dia = 864e5;
  const D = {
    perfiles: [
      { id: "p1", nombre: "Antonio (profesor)", email: "profesor@ejemplo.com", rol: "profesor", activo: true },
      { id: "a1", nombre: "María López Sánchez", email: "maria@ejemplo.com", rol: "alumno", activo: true },
      { id: "a2", nombre: "José Martínez Ruiz", email: "jose@ejemplo.com", rol: "alumno", activo: true },
    ],
    materiales: [
      { id: uid(), seccion: "temario", carpeta: "catecismo", titulo: "Catecismo de la Iglesia Católica (texto íntegro)", descripcion: "Edición en línea de la Santa Sede", url: "https://www.vatican.va/archive/catechism_sp/index_sp.html", tipo: "enlace", orden: 0 },
      { id: uid(), seccion: "temario", carpeta: "compendio", titulo: "Compendio (texto íntegro)", descripcion: "Edición en línea de la Santa Sede", url: "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_sp.html", tipo: "enlace", orden: 0 },
      { id: uid(), seccion: "temario", carpeta: "cultura-general", titulo: "Tema 1 (ejemplo)", descripcion: "Aquí iría el PDF del tema enlazado desde Google Drive", url: "https://drive.google.com/", tipo: "pdf", orden: 1 },
      { id: uid(), seccion: "temario", carpeta: "cultura-general", titulo: "Tema 2 (ejemplo)", descripcion: "Material de ejemplo", url: "https://drive.google.com/", tipo: "pdf", orden: 2 },
      { id: uid(), seccion: "temario", carpeta: "normativa", titulo: "Normativa básica (ejemplo)", descripcion: "Material de ejemplo", url: "https://www.boe.es/", tipo: "enlace", orden: 0 },
      { id: uid(), seccion: "presentaciones", carpeta: "unidad-didactica", titulo: "Cómo estructurar la Unidad Didáctica (ejemplo)", descripcion: "Presentación de Google Slides", url: "https://docs.google.com/presentation/", tipo: "presentacion", orden: 0 },
    ],
    cuestionarios: [{
      id: "q1", titulo: "Repaso general · Catecismo (ejemplo)", descripcion: "Cuestionario de muestra para ver cómo funciona.", carpeta: "catecismo", publicado: true, created_at: new Date(ahora - 2 * dia).toISOString(),
      preguntas: [
        { texto: "¿Cuántos libros componen la Biblia según el canon católico?", opciones: ["66", "73", "72", "76"] },
        { texto: "¿En cuántas partes se divide el Catecismo de la Iglesia Católica?", opciones: ["Tres", "Cuatro", "Cinco", "Siete"] },
        { texto: "¿Cuántos sacramentos reconoce la Iglesia Católica?", opciones: ["Cinco", "Seis", "Siete", "Doce"] },
      ],
    }],
    soluciones: { q1: [
      { correcta: 1, explicacion: "46 del Antiguo Testamento y 27 del Nuevo." },
      { correcta: 1, explicacion: "La profesión de la fe, la celebración del misterio cristiano, la vida en Cristo y la oración cristiana." },
      { correcta: 2, explicacion: "Bautismo, Confirmación, Eucaristía, Penitencia, Unción de enfermos, Orden y Matrimonio." },
    ] },
    intentos: [{ id: uid(), cuestionario_id: "q1", alumno_id: "a2", puntuacion: 2, total: 3, respuestas: [1, 0, 2], created_at: new Date(ahora - dia).toISOString() }],
    clases: [
      { id: uid(), titulo: "Clase 1 · Presentación y metodología", descripcion: "Grabación disponible.", fecha: new Date(ahora - 5 * dia).toISOString(), enlace: "https://meet.google.com/", grabacion: "https://www.youtube.com/" },
      { id: uid(), titulo: "Clase 2 · Historia de la Diócesis de Cartagena", descripcion: "Traed leído el tema 1.", fecha: new Date(new Date(ahora + 3 * dia).setHours(18, 0, 0, 0)).toISOString(), enlace: "https://meet.google.com/", grabacion: "" },
    ],
    avisos: [
      { id: uid(), titulo: "¡Bienvenidos al campus!", contenido: "Aquí encontraréis el temario, las presentaciones, los cuestionarios y el enlace a las clases en directo.\nCualquier duda, escribidme.", importante: true, created_at: new Date(ahora - 3 * dia).toISOString() },
    ],
  };
  const espera = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120));
  const upsert = (lista, obj) => {
    if (obj.id) Object.assign(lista.find((x) => x.id === obj.id), obj);
    else lista.push({ ...obj, id: uid(), created_at: new Date().toISOString() });
  };
  return {
    D,
    async sesion() { return S.perfil; },
    async entrar() {}, async salir() {}, async recuperar() {}, async cambiarPassword() {},
    async miPerfil() { return S.perfil; },
    async materiales(s) { return espera(D.materiales.filter((m) => m.seccion === s).sort(ordenar)); },
    async resumenMateriales() { return espera(D.materiales); },
    async guardarMaterial(m) { upsert(D.materiales, m); },
    async borrarMaterial(id) { D.materiales = D.materiales.filter((m) => m.id !== id); },
    async cuestionarios() { return espera(D.cuestionarios.filter((q) => q.publicado || esProfesor())); },
    async cuestionario(id) { return espera(D.cuestionarios.find((q) => q.id === id)); },
    async soluciones(id) { return espera(D.soluciones[id] || []); },
    async guardarCuestionario(q, sol) {
      if (!q.id) { q = { ...q, id: uid(), created_at: new Date().toISOString() }; D.cuestionarios.unshift(q); }
      else Object.assign(D.cuestionarios.find((x) => x.id === q.id), q);
      D.soluciones[q.id] = sol; return q.id;
    },
    async borrarCuestionario(id) { D.cuestionarios = D.cuestionarios.filter((q) => q.id !== id); },
    async corregir(id, resp) {
      const sol = D.soluciones[id] || [];
      const detalle = sol.map((s, i) => ({ correcta: s.correcta, respuesta: resp[i], explicacion: s.explicacion }));
      const p = detalle.filter((d) => d.respuesta === d.correcta).length;
      D.intentos.unshift({ id: uid(), cuestionario_id: id, alumno_id: S.perfil.id, puntuacion: p, total: sol.length, respuestas: resp, created_at: new Date().toISOString() });
      return espera({ puntuacion: p, total: sol.length, detalle });
    },
    async misIntentos() { return espera(D.intentos.filter((i) => i.alumno_id === S.perfil.id)); },
    async intentosDe(cid) {
      return espera(D.intentos.filter((i) => i.cuestionario_id === cid).map((i) => ({ ...i, perfiles: D.perfiles.find((p) => p.id === i.alumno_id) })));
    },
    async borrarIntento(id) { D.intentos = D.intentos.filter((i) => i.id !== id); },
    async clases() { return espera([...D.clases].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))); },
    async guardarClase(c) { upsert(D.clases, c); },
    async borrarClase(id) { D.clases = D.clases.filter((c) => c.id !== id); },
    async avisos() { return espera([...D.avisos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))); },
    async guardarAviso(a) { upsert(D.avisos, a); },
    async borrarAviso(id) { D.avisos = D.avisos.filter((a) => a.id !== id); },
    async alumnos() { return espera(D.perfiles); },
    async crearAlumno({ nombre, email }) {
      if (D.perfiles.some((p) => p.email === email)) throw new Error("Ese correo ya está registrado.");
      D.perfiles.push({ id: uid(), nombre, email, rol: "alumno", activo: true });
    },
    async actualizarPerfil(id, c) { Object.assign(D.perfiles.find((p) => p.id === id), c); },
  };
}

// ---------------------------------------------------------------------
//  Arranque
// ---------------------------------------------------------------------
async function init() {
  try {
    if (DEMO) {
      api = apiDemo();
    } else {
      if (/type=recovery/.test(location.hash)) S.recuperando = true;
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      sb = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
      sb.auth.onAuthStateChange((evento) => {
        if (evento === "PASSWORD_RECOVERY") { S.recuperando = true; setTimeout(render, 0); }
      });
      api = apiSupabase(createClient);
      await cargarPerfil();
    }
  } catch (e) {
    app.innerHTML = `<div class="acceso"><div class="acceso-tarjeta"><div class="franja"></div><div class="acceso-cuerpo">
      <h1>No se pudo cargar</h1><p class="lema">${esc(mensajeError(e))}</p></div></div></div>`;
    return;
  }
  window.addEventListener("hashchange", () => { document.querySelectorAll(".modal-fondo").forEach((m) => m.remove()); render(); });
  render();
}

async function cargarPerfil() {
  if (DEMO) return;
  const sesion = await api.sesion();
  if (!sesion) { S.perfil = null; return; }
  const p = await api.miPerfil();
  if (!p || !p.activo) {
    S.errorAcceso = p ? "Tu cuenta está desactivada. Contacta con el profesor." : "Tu usuario no tiene acceso a este campus. Contacta con el profesor.";
    S.perfil = null;
    await api.salir();
    return;
  }
  S.perfil = p;
}

function ruta() {
  const partes = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!partes.length || partes[0].includes("=")) return ["inicio"];
  return partes.map(decodeURIComponent);
}

// ---------------------------------------------------------------------
//  Pantalla de acceso
// ---------------------------------------------------------------------
function pantallaAcceso(modo = "entrar") {
  const contacto = C.CORREO_CONTACTO ? `<p class="pie">¿No tienes acceso? Escribe a <a href="mailto:${esc(C.CORREO_CONTACTO)}">${esc(C.CORREO_CONTACTO)}</a></p>` : "";
  let formulario;
  if (S.recuperando) {
    formulario = `<form id="fNueva">
        <p class="muted" style="margin-top:0">Escribe tu nueva contraseña.</p>
        <div class="campo"><label for="p1">Nueva contraseña</label><input id="p1" type="password" minlength="6" required autocomplete="new-password"></div>
        <div class="campo"><label for="p2">Repite la contraseña</label><input id="p2" type="password" minlength="6" required autocomplete="new-password"></div>
        <div class="error" id="err"></div>
        <button class="btn bloque">Guardar contraseña</button></form>`;
  } else if (DEMO) {
    formulario = `<div class="demo-aviso"><strong>Modo demostración.</strong> El campus aún no está conectado a Supabase. Puedes probarlo como alumno o como profesor; los cambios no se guardan.</div>
      <button class="btn bloque" id="demoAlumno">Entrar como alumno</button>
      <button class="btn sec bloque mt" id="demoProfe">Entrar como profesor</button>`;
  } else if (modo === "recuperar") {
    formulario = `<form id="fRecuperar">
        <p class="muted" style="margin-top:0">Te enviaremos un correo con un enlace para crear una contraseña nueva.</p>
        <div class="campo"><label for="email">Correo electrónico</label><input id="email" type="email" required autocomplete="email"></div>
        <div class="error" id="err"></div>
        <button class="btn bloque">Enviar enlace</button>
        <p class="pie"><button type="button" class="enlace-btn" id="volver">Volver al acceso</button></p></form>`;
  } else {
    formulario = `<form id="fEntrar">
        <div class="campo"><label for="email">Correo electrónico</label><input id="email" type="email" required autocomplete="username"></div>
        <div class="campo"><label for="pw">Contraseña</label><input id="pw" type="password" required autocomplete="current-password"></div>
        <div class="error" id="err">${esc(S.errorAcceso)}</div>
        <button class="btn bloque" id="bEntrar">Entrar al campus</button>
        <p class="pie"><button type="button" class="enlace-btn" id="olvido">¿Has olvidado tu contraseña?</button></p></form>`;
  }
  app.innerHTML = `<div class="acceso"><div class="acceso-tarjeta"><div class="franja"></div><div class="acceso-cuerpo">
      <img class="acceso-logo" src="logo.png" alt="Logotipo de ${esc(NOMBRE)}">
      <div class="eyebrow">Campus virtual</div>
      <h1>${esc(NOMBRE)}</h1>
      <p class="lema">${esc(C.LEMA || "")}</p>
      ${formulario}
      ${contacto}
    </div></div></div>`;

  const err = app.querySelector("#err");
  const q = (s) => app.querySelector(s);

  if (S.recuperando) {
    q("#fNueva").onsubmit = async (e) => {
      e.preventDefault();
      if (q("#p1").value !== q("#p2").value) { err.textContent = "Las contraseñas no coinciden."; return; }
      try {
        await api.cambiarPassword(q("#p1").value);
        S.recuperando = false;
        history.replaceState(null, "", urlBase() + "#/inicio");
        await cargarPerfil();
        toast("Contraseña actualizada", "ok");
        render();
      } catch (ex) { err.textContent = mensajeError(ex); }
    };
    return;
  }
  if (DEMO) {
    const entrarDemo = (id) => { S.perfil = api.D.perfiles.find((p) => p.id === id); location.hash = "#/inicio"; render(); };
    q("#demoAlumno").onclick = () => entrarDemo("a1");
    q("#demoProfe").onclick = () => entrarDemo("p1");
    return;
  }
  if (modo === "recuperar") {
    q("#volver").onclick = () => pantallaAcceso("entrar");
    q("#fRecuperar").onsubmit = async (e) => {
      e.preventDefault();
      try { await api.recuperar(q("#email").value.trim()); err.style.color = "var(--verde)"; err.textContent = "Si el correo está registrado, recibirás el enlace en unos minutos."; }
      catch (ex) { err.textContent = mensajeError(ex); }
    };
    return;
  }
  q("#olvido").onclick = () => pantallaAcceso("recuperar");
  q("#fEntrar").onsubmit = async (e) => {
    e.preventDefault();
    const b = q("#bEntrar");
    b.disabled = true; b.textContent = "Entrando…"; err.textContent = ""; S.errorAcceso = "";
    try {
      await api.entrar(q("#email").value.trim(), q("#pw").value);
      await cargarPerfil();
      if (!S.perfil) { pantallaAcceso(); return; }
      location.hash = "#/inicio";
      render();
    } catch (ex) {
      err.textContent = mensajeError(ex);
      b.disabled = false; b.textContent = "Entrar al campus";
    }
  };
}

// ---------------------------------------------------------------------
//  Estructura del campus
// ---------------------------------------------------------------------
const SECCIONES = [
  { id: "inicio", nombre: "Inicio", icono: "inicio" },
  { id: "temario", nombre: "Temario", icono: "temario" },
  { id: "presentaciones", nombre: "Presentaciones", icono: "presentacion" },
  { id: "cuestionarios", nombre: "Cuestionarios", icono: "cuestionario" },
  { id: "clases", nombre: "Clases en directo", icono: "clases" },
  { id: "avisos", nombre: "Avisos", icono: "avisos" },
];

function pintarEstructura() {
  const p = S.perfil;
  const contacto = !esProfesor() && C.CORREO_CONTACTO
    ? `<a href="mailto:${esc(C.CORREO_CONTACTO)}">${I.correo} Escribir al profesor</a>` : "";
  app.innerHTML = `<div class="shell" id="shell">
    <div class="velo" id="velo"></div>
    <aside class="lateral">
      <div class="marca"><img src="logo.png" alt=""><div><strong>Cuatro Santos<br>Formación</strong><span>Campus virtual</span></div></div>
      <div class="franja"></div>
      <nav class="nav" id="nav">
        ${SECCIONES.map((s) => `<a href="#/${s.id}" data-sec="${s.id}">${I[s.icono]} ${s.nombre}</a>`).join("")}
        ${esProfesor() ? `<div class="separador">Gestión</div><a href="#/alumnado" data-sec="alumnado">${I.alumnado} Alumnado</a>` : ""}
        <div class="separador">Personal</div>
        <a href="#/cuenta" data-sec="cuenta">${I.cuenta} Mi cuenta</a>
        ${contacto}
      </nav>
      <div class="usuario">
        <div class="nombre">${esc(p.nombre)}</div>
        <div class="rol">${esProfesor() ? "Profesor" : "Alumno/a"}${DEMO ? " · demostración" : ""}</div>
        <button id="salir">Cerrar sesión</button>
      </div>
    </aside>
    <div class="principal">
      <div class="barra-movil"><button id="abrirMenu" aria-label="Abrir menú">${I.menu}</button><img src="logo.png" alt=""><strong>Cuatro Santos Formación</strong></div>
      <header class="cabecera" id="cab"></header>
      <main class="contenido" id="main"></main>
    </div>
  </div>`;
  const shell = document.getElementById("shell");
  document.getElementById("abrirMenu").onclick = () => shell.classList.add("menu-abierto");
  document.getElementById("velo").onclick = () => shell.classList.remove("menu-abierto");
  document.getElementById("nav").addEventListener("click", (e) => { if (e.target.closest("a")) shell.classList.remove("menu-abierto"); });
  document.getElementById("salir").onclick = async () => {
    await api.salir();
    S.perfil = null;
    location.hash = "";
    render();
  };
}

function cabecera(titulo, subtitulo = "", acciones = "", eyebrow = "") {
  document.getElementById("cab").innerHTML = `<div>${eyebrow ? `<div class="migas">${eyebrow}</div>` : ""}<h1>${titulo}</h1>${subtitulo ? `<p>${subtitulo}</p>` : ""}</div>
    ${acciones ? `<div class="acciones-cab">${acciones}</div>` : ""}`;
}

let turno = 0;
async function render() {
  if (S.recuperando || !S.perfil) { pantallaAcceso(); return; }
  if (!document.getElementById("shell")) pintarEstructura();
  const r = ruta();
  if (r[0] === "alumnado" && !esProfesor()) { location.hash = "#/inicio"; return; }
  document.querySelectorAll("#nav a[data-sec]").forEach((a) => {
    const sec = a.dataset.sec;
    a.classList.toggle("activo", sec === r[0] || (sec === "cuestionarios" && r[0] === "cuestionario"));
  });
  const main = document.getElementById("main");
  const mio = ++turno;
  main.innerHTML = `<p class="muted">Cargando…</p>`;
  const vistas = { inicio: vInicio, temario: vTemario, presentaciones: vPresentaciones, cuestionarios: vCuestionarios, cuestionario: vCuestionario, clases: vClases, avisos: vAvisos, alumnado: vAlumnado, cuenta: vCuenta };
  const vista = vistas[r[0]] || vInicio;
  try {
    await vista(main, r, () => mio === turno);
  } catch (e) {
    if (mio !== turno) return;
    console.error(e);
    main.innerHTML = `<div class="tarjeta"><h2>Algo ha fallado</h2><p>${esc(mensajeError(e))}</p></div>`;
  }
  window.scrollTo(0, 0);
}

const vacio = (icono, texto) => `<div class="vacio">${I[icono]}${texto}</div>`;

// ---------------------------------------------------------------------
//  INICIO
// ---------------------------------------------------------------------
async function vInicio(main, r, vigente) {
  const [clases, avisos, cuest, extra] = await Promise.all([
    api.clases(), api.avisos(), api.cuestionarios(),
    esProfesor() ? Promise.all([api.alumnos(), api.resumenMateriales()]) : api.misIntentos(),
  ]);
  if (!vigente()) return;
  const ahora = Date.now();
  const proximas = clases.filter((c) => new Date(c.fecha).getTime() > ahora - 2 * 3600e3);
  const sig = proximas[0];
  const nombrePila = S.perfil.nombre.split(" ")[0];
  document.getElementById("cab").innerHTML = "";

  let datos;
  if (esProfesor()) {
    const [alumnos, mats] = extra;
    datos = [
      { i: "alumnado", c: "", n: alumnos.filter((a) => a.rol === "alumno" && a.activo).length, t: "alumnos activos" },
      { i: "temario", c: "verde", n: mats.length, t: "materiales publicados" },
      { i: "cuestionario", c: "bronce", n: cuest.length, t: "cuestionarios" },
    ];
  } else {
    const intentos = extra;
    const hechos = new Set(intentos.map((i) => i.cuestionario_id)).size;
    const media = intentos.length ? intentos.reduce((s, i) => s + (i.total ? i.puntuacion / i.total : 0), 0) / intentos.length * 10 : null;
    datos = [
      { i: "calendario", c: "", n: sig ? `${new Date(sig.fecha).getDate()} ${meses[new Date(sig.fecha).getMonth()]}` : "—", t: sig ? "próxima clase · " + hora(sig.fecha) : "sin clases programadas" },
      { i: "cuestionario", c: "verde", n: `${hechos}/${cuest.length}`, t: "cuestionarios realizados" },
      { i: "grafica", c: "bronce", n: media === null ? "—" : media.toFixed(1).replace(".", ","), t: "nota media en cuestionarios" },
    ];
  }

  main.innerHTML = `
    <section class="bienvenida">
      <div class="eyebrow">${esc(NOMBRE)}</div>
      <h2>Bienvenido/a, ${esc(nombrePila)}</h2>
      <p>${esProfesor() ? "Desde aquí gestionas el temario, los cuestionarios, las clases y los avisos de tu alumnado." : "Aquí tienes todo lo necesario para preparar tu acceso al itinerario de Maestros de Religión Católica."}</p>
      <div class="franja"></div>
    </section>
    <div class="rejilla tres">
      ${datos.map((d) => `<div class="tarjeta dato"><div class="icono ${d.c}">${I[d.i]}</div><div><div class="num">${esc(d.n)}</div><div class="txt">${esc(d.t)}</div></div></div>`).join("")}
    </div>
    ${esProfesor() ? `<div class="tarjeta mt"><h2>Accesos rápidos</h2><div class="acciones-cab">
        <a class="btn" href="#/temario">${I.mas} Añadir temario</a>
        <a class="btn sec" href="#/cuestionario/nuevo/editar">${I.cuestionario} Nuevo cuestionario</a>
        <a class="btn sec" href="#/clases">${I.clases} Programar clase</a>
        <a class="btn sec" href="#/avisos">${I.avisos} Publicar aviso</a>
        <a class="btn sec" href="#/alumnado">${I.alumnado} Dar de alta alumnos</a></div></div>` : ""}
    <div class="rejilla dos mt">
      <div class="tarjeta"><h2>Próximas clases</h2>
        ${proximas.length ? proximas.slice(0, 3).map(htmlClase).join("") : vacio("clases", "No hay clases programadas.")}
        <p style="margin:.6rem 0 0"><a href="#/clases">Ver todas las clases →</a></p></div>
      <div class="tarjeta"><h2>Últimos avisos</h2>
        ${avisos.length ? avisos.slice(0, 3).map(htmlAviso).join("") : vacio("avisos", "Todavía no hay avisos.")}
        <p style="margin:.6rem 0 0"><a href="#/avisos">Ver todos los avisos →</a></p></div>
    </div>`;
  activarClases(main, proximas);
}

// ---------------------------------------------------------------------
//  TEMARIO y PRESENTACIONES
// ---------------------------------------------------------------------
async function vTemario(main, r, vigente) {
  const carpetaId = r[1];
  if (!carpetaId) {
    const mats = await api.resumenMateriales();
    if (!vigente()) return;
    cabecera("Temario", "El material de estudio, organizado por bloques.");
    main.innerHTML = `<div class="rejilla tres">${CARPETAS.map((c) => {
      const n = mats.filter((m) => m.seccion === "temario" && m.carpeta === c.id).length;
      return `<a class="carpeta" href="#/temario/${encodeURIComponent(c.id)}"><div class="icono">${I.carpeta}</div>
        <div><strong>${esc(c.nombre)}</strong><span>${n} ${n === 1 ? "documento" : "documentos"}</span></div></a>`;
    }).join("")}</div>`;
    return;
  }
  const carpeta = CARPETAS.find((c) => c.id === carpetaId);
  if (!carpeta) { location.hash = "#/temario"; return; }
  const mats = (await api.materiales("temario")).filter((m) => m.carpeta === carpetaId);
  if (!vigente()) return;
  cabecera(esc(carpeta.nombre), "", esProfesor() ? `<button class="btn" id="nuevo">${I.mas} Añadir material</button>` : "", `<a href="#/temario">Temario</a> ›`);
  main.innerHTML = `<div class="tarjeta"><div class="lista">${mats.length ? mats.map(htmlMaterial).join("") : vacio("carpeta", "Esta carpeta todavía está vacía.")}</div></div>`;
  activarMateriales(main, mats, { seccion: "temario", carpeta: carpetaId });
}

async function vPresentaciones(main, r, vigente) {
  const mats = await api.materiales("presentaciones");
  if (!vigente()) return;
  cabecera("Presentaciones", "Las presentaciones de clase para repasar.", esProfesor() ? `<button class="btn" id="nuevo">${I.mas} Añadir presentación</button>` : "");
  main.innerHTML = `<div class="tarjeta"><div class="lista">${mats.length ? mats.map(htmlMaterial).join("") : vacio("presentacion", "Todavía no hay presentaciones.")}</div></div>`;
  activarMateriales(main, mats, { seccion: "presentaciones", carpeta: "", tipo: "presentacion" });
}

function iconoTipo(tipo) {
  return { pdf: ["pdf", ""], documento: ["pdf", ""], presentacion: ["presentacion", "presentacion"], video: ["video", "video"], enlace: ["enlace", ""] }[tipo] || ["pdf", ""];
}
const NOMBRES_TIPO = { pdf: "PDF", documento: "Documento", presentacion: "Presentación", video: "Vídeo", enlace: "Enlace web" };

function htmlMaterial(m) {
  const [ic, clase] = iconoTipo(m.tipo);
  const carpeta = m.seccion === "presentaciones" && m.carpeta ? ` <span class="etiqueta">${esc(nombreCarpeta(m.carpeta))}</span>` : "";
  return `<div class="item" data-id="${esc(m.id)}">
    <div class="icono ${clase}">${I[ic]}</div>
    <div class="cuerpo"><div class="titulo">${esc(m.titulo)}${carpeta}</div>${m.descripcion ? `<div class="desc">${esc(m.descripcion)}</div>` : `<div class="desc">${NOMBRES_TIPO[m.tipo] || ""}</div>`}</div>
    <div class="acciones">
      <button class="btn peq" data-ver>${I.ver} Ver</button>
      ${esProfesor() ? `<button class="btn sec peq" data-editar>${I.editar}</button><button class="btn peligro peq" data-borrar aria-label="Borrar">${I.borrar}</button>` : ""}
    </div></div>`;
}

function activarMateriales(main, mats, base) {
  const nuevo = document.getElementById("nuevo");
  if (nuevo) nuevo.onclick = () => formMaterial({ ...base });
  main.querySelectorAll(".item[data-id]").forEach((el) => {
    const m = mats.find((x) => String(x.id) === el.dataset.id);
    el.querySelector("[data-ver]").onclick = () => abrirVisor(m.titulo, m.url);
    const ed = el.querySelector("[data-editar]");
    if (ed) ed.onclick = () => formMaterial(m);
    const bo = el.querySelector("[data-borrar]");
    if (bo) bo.onclick = async () => {
      if (!(await confirmar(`¿Borrar «${esc(m.titulo)}»?`))) return;
      try { await api.borrarMaterial(m.id); toast("Material borrado", "ok"); render(); } catch (e) { toast(mensajeError(e), "mal"); }
    };
  });
}

function formMaterial(m) {
  const esTemario = m.seccion === "temario";
  const md = modal({
    titulo: m.id ? "Editar material" : esTemario ? "Añadir material al temario" : "Añadir presentación",
    cuerpo: `<form id="fMat">
      <div class="campo"><label for="mt">Título</label><input id="mt" type="text" required value="${esc(m.titulo || "")}" placeholder="Ej.: Tema 3. La Iglesia en la Edad Media"></div>
      <div class="campo"><label for="md">Descripción <span class="muted">(opcional)</span></label><input id="md" type="text" value="${esc(m.descripcion || "")}"></div>
      <div class="campo"><label for="mu">Enlace</label><input id="mu" type="url" required value="${esc(m.url || "")}" placeholder="https://drive.google.com/…">
        <div class="ayuda">Pega el enlace de Google Drive, Google Slides, YouTube, etc. En Drive, compártelo como «Cualquier persona con el enlace · Lector».</div></div>
      <div class="fila">
        <div class="campo"><label for="mtipo">Tipo</label><select id="mtipo">${Object.entries(NOMBRES_TIPO).map(([k, v]) => `<option value="${k}" ${(m.tipo || "pdf") === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="campo"><label for="mc">Carpeta${esTemario ? "" : " (opcional)"}</label><select id="mc">${esTemario ? "" : `<option value="">— Ninguna —</option>`}${CARPETAS.map((c) => `<option value="${esc(c.id)}" ${m.carpeta === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></div>
      </div>
      <div class="campo"><label for="mo">Posición en la lista <span class="muted">(opcional)</span></label><input id="mo" type="text" inputmode="numeric" value="${esc(m.orden || "")}" placeholder="1, 2, 3… (si lo dejas vacío se ordena por título)"></div>
    </form>`,
    pie: `<button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="gMat">Guardar</button>`,
  });
  const q = (s) => md.el.querySelector(s);
  q("#gMat").onclick = async () => {
    const f = q("#fMat");
    if (!f.reportValidity()) return;
    const datos = {
      id: m.id, seccion: m.seccion, titulo: q("#mt").value.trim(), descripcion: q("#md").value.trim(),
      url: q("#mu").value.trim(), tipo: q("#mtipo").value, carpeta: q("#mc").value || null, orden: parseInt(q("#mo").value, 10) || 0,
    };
    if (!datos.id) delete datos.id;
    try { await api.guardarMaterial(datos); md.cerrar(); toast("Material guardado", "ok"); render(); }
    catch (e) { toast(mensajeError(e), "mal"); }
  };
}

// ---------------------------------------------------------------------
//  CUESTIONARIOS
// ---------------------------------------------------------------------
async function vCuestionarios(main, r, vigente) {
  const [cuest, intentos] = await Promise.all([api.cuestionarios(), esProfesor() ? [] : api.misIntentos()]);
  if (!vigente()) return;
  cabecera("Cuestionarios", esProfesor() ? "Crea cuestionarios de autoevaluación y consulta los resultados." : "Comprueba lo que sabes. Puedes repetirlos todas las veces que quieras.",
    esProfesor() ? `<a class="btn" href="#/cuestionario/nuevo/editar">${I.mas} Nuevo cuestionario</a>` : "");
  if (!cuest.length) { main.innerHTML = `<div class="tarjeta">${vacio("cuestionario", "Todavía no hay cuestionarios.")}</div>`; return; }
  main.innerHTML = `<div class="tarjeta"><div class="lista">${cuest.map((q) => {
    const n = (q.preguntas || []).length;
    const mios = intentos.filter((i) => i.cuestionario_id === q.id);
    const mejor = mios.reduce((b, i) => Math.max(b, i.total ? i.puntuacion / i.total : 0), -1);
    const estado = esProfesor()
      ? (q.publicado ? `<span class="etiqueta verde">Publicado</span>` : `<span class="etiqueta gris">Borrador</span>`)
      : (mios.length ? `<span class="etiqueta verde">Mejor nota: ${(mejor * 10).toFixed(1).replace(".", ",")}</span>` : `<span class="etiqueta">Pendiente</span>`);
    return `<div class="item" data-id="${esc(q.id)}">
      <div class="icono presentacion">${I.cuestionario}</div>
      <div class="cuerpo"><div class="titulo">${esc(q.titulo)} ${estado}</div>
        <div class="desc">${n} ${n === 1 ? "pregunta" : "preguntas"}${q.carpeta ? " · " + esc(nombreCarpeta(q.carpeta)) : ""}${mios.length ? ` · ${mios.length} ${mios.length === 1 ? "intento" : "intentos"}` : ""}</div></div>
      <div class="acciones">
        <a class="btn peq" href="#/cuestionario/${encodeURIComponent(q.id)}">${esProfesor() ? "Probar" : mios.length ? "Repetir" : "Empezar"}</a>
        ${esProfesor() ? `<a class="btn sec peq" href="#/cuestionario/${encodeURIComponent(q.id)}/resultados">${I.grafica} Resultados</a>
          <a class="btn sec peq" href="#/cuestionario/${encodeURIComponent(q.id)}/editar" aria-label="Editar">${I.editar}</a>
          <button class="btn peligro peq" data-borrar aria-label="Borrar">${I.borrar}</button>` : ""}
      </div></div>`;
  }).join("")}</div></div>`;
  main.querySelectorAll("[data-borrar]").forEach((b) => {
    b.onclick = async () => {
      const id = b.closest(".item").dataset.id;
      const q = cuest.find((x) => String(x.id) === id);
      if (!(await confirmar(`¿Borrar el cuestionario «${esc(q.titulo)}» y todos sus resultados?`))) return;
      try { await api.borrarCuestionario(q.id); toast("Cuestionario borrado", "ok"); render(); } catch (e) { toast(mensajeError(e), "mal"); }
    };
  });
}

async function vCuestionario(main, r, vigente) {
  const id = r[1];
  if (r[2] === "editar") return vEditorCuestionario(main, id, vigente);
  if (r[2] === "resultados") return vResultados(main, id, vigente);
  const q = await api.cuestionario(id);
  if (!vigente()) return;
  if (!q) { main.innerHTML = `<div class="tarjeta">${vacio("cuestionario", "Este cuestionario no existe.")}</div>`; return; }
  const preguntas = q.preguntas || [];
  cabecera(esc(q.titulo), esc(q.descripcion || ""), "", `<a href="#/cuestionarios">Cuestionarios</a> ›`);
  main.innerHTML = `<form class="tarjeta" id="fTest">
    ${preguntas.map((p, i) => `<div class="pregunta" data-i="${i}">
      <div class="enunciado"><span class="n">${i + 1}.</span>${esc(p.texto)}</div>
      ${p.opciones.map((o, j) => `<label class="opcion"><input type="radio" name="p${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}
      <div class="corr"></div></div>`).join("")}
    <div class="mt" style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center">
      <button class="btn verde" id="entregar">Entregar y corregir</button>
      <span class="muted" id="contador">0 de ${preguntas.length} respondidas</span>
    </div></form>`;
  const f = main.querySelector("#fTest");
  f.addEventListener("change", () => {
    main.querySelector("#contador").textContent = `${f.querySelectorAll("input:checked").length} de ${preguntas.length} respondidas`;
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const resp = preguntas.map((_, i) => { const x = f.querySelector(`input[name=p${i}]:checked`); return x ? Number(x.value) : null; });
    const sinResponder = resp.filter((x) => x === null).length;
    if (sinResponder && !(await confirmar(`Te quedan ${sinResponder} preguntas sin responder. ¿Entregar igualmente?`, "Entregar"))) return;
    const b = main.querySelector("#entregar"); b.disabled = true; b.textContent = "Corrigiendo…";
    try {
      const res = await api.corregir(q.id, resp);
      mostrarCorreccion(main, q, res);
    } catch (ex) { toast(mensajeError(ex), "mal"); b.disabled = false; b.textContent = "Entregar y corregir"; }
  };
}

function mostrarCorreccion(main, q, res) {
  const f = main.querySelector("#fTest");
  f.querySelectorAll("input").forEach((i) => (i.disabled = true));
  res.detalle.forEach((d, i) => {
    const bloque = f.querySelector(`.pregunta[data-i="${i}"]`);
    if (!bloque) return;
    bloque.querySelectorAll(".opcion").forEach((op, j) => {
      if (j === d.correcta) op.classList.add("correcta");
      else if (j === d.respuesta) op.classList.add("incorrecta");
    });
    const marca = d.respuesta === d.correcta ? "✔ Correcta" : d.respuesta === null || d.respuesta === undefined ? "Sin responder" : "✘ Incorrecta";
    bloque.querySelector(".corr").innerHTML = `<div class="explicacion"><strong>${marca}.</strong> ${esc(d.explicacion || "")}</div>`;
  });
  f.querySelector(".mt").innerHTML = `<a class="btn" href="#/cuestionarios">Volver a cuestionarios</a><button type="button" class="btn sec" id="repetir">Repetir</button>`;
  f.querySelector("#repetir").onclick = () => render();
  const resumen = document.createElement("div");
  resumen.className = "tarjeta resultado";
  const pct = res.total ? Math.round((res.puntuacion / res.total) * 100) : 0;
  resumen.innerHTML = `<div class="eyebrow">Tu resultado</div><div class="nota">${nota10(res.puntuacion, res.total)}</div>
    <p class="muted">${res.puntuacion} aciertos de ${res.total} preguntas</p>
    <div class="barra" style="max-width:360px;margin:0 auto"><div style="width:${pct}%"></div></div>`;
  main.prepend(resumen);
  resumen.style.marginBottom = "1rem";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function vResultados(main, id, vigente) {
  if (!esProfesor()) { location.hash = "#/cuestionarios"; return; }
  const [q, intentos] = await Promise.all([api.cuestionario(id), api.intentosDe(id)]);
  if (!vigente()) return;
  cabecera("Resultados", esc(q ? q.titulo : ""), "", `<a href="#/cuestionarios">Cuestionarios</a> ›`);
  if (!intentos.length) { main.innerHTML = `<div class="tarjeta">${vacio("grafica", "Nadie ha hecho este cuestionario todavía.")}</div>`; return; }
  const media = intentos.reduce((s, i) => s + (i.total ? i.puntuacion / i.total : 0), 0) / intentos.length * 10;
  main.innerHTML = `<div class="rejilla tres">
      <div class="tarjeta dato"><div class="icono">${I.cuestionario}</div><div><div class="num">${intentos.length}</div><div class="txt">intentos</div></div></div>
      <div class="tarjeta dato"><div class="icono verde">${I.alumnado}</div><div><div class="num">${new Set(intentos.map((i) => i.perfiles?.email)).size}</div><div class="txt">alumnos distintos</div></div></div>
      <div class="tarjeta dato"><div class="icono bronce">${I.grafica}</div><div><div class="num">${media.toFixed(1).replace(".", ",")}</div><div class="txt">nota media</div></div></div>
    </div>
    <div class="tarjeta mt"><div class="tabla-env"><table>
      <thead><tr><th>Alumno/a</th><th>Aciertos</th><th>Nota</th><th>Fecha</th><th></th></tr></thead>
      <tbody>${intentos.map((i) => `<tr data-id="${esc(i.id)}"><td>${esc(i.perfiles?.nombre || "—")}</td><td>${i.puntuacion}/${i.total}</td><td><strong>${nota10(i.puntuacion, i.total)}</strong></td>
        <td>${fechaCorta(i.created_at)} · ${hora(i.created_at)}</td><td><button class="btn peligro peq" data-borrar aria-label="Borrar intento">${I.borrar}</button></td></tr>`).join("")}</tbody>
    </table></div></div>`;
  main.querySelectorAll("[data-borrar]").forEach((b) => {
    b.onclick = async () => {
      if (!(await confirmar("¿Borrar este intento?"))) return;
      try { await api.borrarIntento(b.closest("tr").dataset.id); render(); } catch (e) { toast(mensajeError(e), "mal"); }
    };
  });
}

async function vEditorCuestionario(main, id, vigente) {
  if (!esProfesor()) { location.hash = "#/cuestionarios"; return; }
  let q = { titulo: "", descripcion: "", carpeta: "", publicado: false, preguntas: [] };
  let sol = [];
  if (id !== "nuevo") {
    [q, sol] = await Promise.all([api.cuestionario(id), api.soluciones(id)]);
    if (!vigente()) return;
  }
  // Estado de trabajo: preguntas con su solución
  let P = (q.preguntas || []).map((p, i) => ({ texto: p.texto, opciones: [...p.opciones], correcta: sol[i]?.correcta ?? 0, explicacion: sol[i]?.explicacion || "" }));
  if (!P.length) P.push({ texto: "", opciones: ["", "", "", ""], correcta: 0, explicacion: "" });

  cabecera(id === "nuevo" ? "Nuevo cuestionario" : "Editar cuestionario", "", "", `<a href="#/cuestionarios">Cuestionarios</a> ›`);
  main.innerHTML = `<div class="tarjeta">
      <div class="campo"><label for="qt">Título</label><input id="qt" type="text" value="${esc(q.titulo)}" placeholder="Ej.: Test tema 1 · Cultura general"></div>
      <div class="campo"><label for="qd">Descripción <span class="muted">(opcional)</span></label><input id="qd" type="text" value="${esc(q.descripcion || "")}"></div>
      <div class="fila">
        <div class="campo"><label for="qc">Bloque del temario <span class="muted">(opcional)</span></label><select id="qc"><option value="">— Ninguno —</option>${CARPETAS.map((c) => `<option value="${esc(c.id)}" ${q.carpeta === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></div>
        <div class="campo" style="align-self:end"><label class="check"><input type="checkbox" id="qp" ${q.publicado ? "checked" : ""}> Publicado (visible para el alumnado)</label></div>
      </div>
    </div>
    <div class="cabecera" style="padding:1.4rem 0 .8rem"><h2>Preguntas</h2><div class="acciones-cab"><button class="btn sec" id="importar">Importar desde texto</button></div></div>
    <div id="preguntas"></div>
    <div class="acciones-cab"><button class="btn sec" id="otra">${I.mas} Añadir pregunta</button><button class="btn verde" id="guardarQ">Guardar cuestionario</button></div>`;

  const cont = main.querySelector("#preguntas");
  const leer = () => {
    P = [...cont.querySelectorAll(".editor-pregunta")].map((el) => ({
      texto: el.querySelector("[data-texto]").value,
      opciones: [...el.querySelectorAll("[data-op]")].map((i) => i.value),
      correcta: Math.max(0, [...el.querySelectorAll("input[type=radio]")].findIndex((r) => r.checked)),
      explicacion: el.querySelector("[data-exp]").value,
    }));
  };
  const pintar = () => {
    cont.innerHTML = P.map((p, i) => `<div class="editor-pregunta" data-i="${i}">
      <div class="cab"><strong>Pregunta ${i + 1}</strong><button class="btn peligro peq" data-quitar aria-label="Quitar pregunta">${I.borrar}</button></div>
      <div class="campo"><textarea data-texto rows="2" placeholder="Enunciado de la pregunta">${esc(p.texto)}</textarea></div>
      <div class="ayuda" style="margin-bottom:.4rem">Marca con el círculo la respuesta correcta.</div>
      ${p.opciones.map((o, j) => `<div class="editor-opcion"><input type="radio" name="c${i}" ${p.correcta === j ? "checked" : ""} aria-label="Correcta">
        <input type="text" data-op value="${esc(o)}" placeholder="Opción ${String.fromCharCode(97 + j)}">
        <button class="btn sec peq" data-quitarop="${j}" aria-label="Quitar opción">${I.x}</button></div>`).join("")}
      <button class="enlace-btn" data-masop>+ Añadir opción</button>
      <div class="campo mt"><input type="text" data-exp value="${esc(p.explicacion)}" placeholder="Explicación que verá el alumno al corregir (opcional)"></div>
    </div>`).join("");
  };
  pintar();

  cont.addEventListener("click", (e) => {
    const el = e.target.closest(".editor-pregunta");
    if (!el) return;
    const i = Number(el.dataset.i);
    if (e.target.closest("[data-quitar]")) { leer(); P.splice(i, 1); if (!P.length) P.push({ texto: "", opciones: ["", "", "", ""], correcta: 0, explicacion: "" }); pintar(); }
    else if (e.target.closest("[data-masop]")) { leer(); P[i].opciones.push(""); pintar(); }
    else if (e.target.closest("[data-quitarop]")) {
      leer();
      const j = Number(e.target.closest("[data-quitarop]").dataset.quitarop);
      if (P[i].opciones.length <= 2) { toast("Cada pregunta necesita al menos dos opciones"); return; }
      P[i].opciones.splice(j, 1);
      if (P[i].correcta >= P[i].opciones.length || P[i].correcta === j) P[i].correcta = 0;
      else if (P[i].correcta > j) P[i].correcta--;
      pintar();
    }
  });
  main.querySelector("#otra").onclick = () => {
    leer(); P.push({ texto: "", opciones: ["", "", "", ""], correcta: 0, explicacion: "" }); pintar();
    cont.lastElementChild.querySelector("textarea").focus();
  };
  main.querySelector("#importar").onclick = () => {
    const md = modal({
      titulo: "Importar preguntas desde texto",
      cuerpo: `<p style="margin-top:0">Pega tus preguntas con este formato. Deja una línea en blanco entre preguntas y pon un <strong>*</strong> delante de la respuesta correcta. La línea que empieza por <strong>&gt;</strong> es la explicación (opcional).</p>
        <div class="copiable" style="margin-bottom:1rem">1. ¿Cuántos sacramentos hay?
a) Cinco
b) Seis
*c) Siete
d) Ocho
&gt; Bautismo, Confirmación, Eucaristía…

2. Segunda pregunta…
*a) …
b) …</div>
        <textarea id="txtImp" rows="10" placeholder="Pega aquí tus preguntas"></textarea>`,
      pie: `<button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="hacerImp">Añadir preguntas</button>`,
    });
    md.el.querySelector("#hacerImp").onclick = () => {
      const nuevas = parsearPreguntas(md.el.querySelector("#txtImp").value);
      if (!nuevas.length) { toast("No he encontrado preguntas con ese formato", "mal"); return; }
      leer();
      P = P.filter((p) => p.texto.trim() || p.opciones.some((o) => o.trim()));
      P.push(...nuevas);
      pintar(); md.cerrar();
      toast(`${nuevas.length} preguntas añadidas`, "ok");
    };
  };
  main.querySelector("#guardarQ").onclick = async () => {
    leer();
    const titulo = main.querySelector("#qt").value.trim();
    if (!titulo) { toast("Ponle un título al cuestionario", "mal"); main.querySelector("#qt").focus(); return; }
    const limpias = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      const ops = p.opciones.map((o, j) => ({ o: o.trim(), j })).filter((x) => x.o);
      if (!p.texto.trim() && !ops.length) continue;
      if (!p.texto.trim()) { toast(`La pregunta ${i + 1} no tiene enunciado`, "mal"); return; }
      if (ops.length < 2) { toast(`La pregunta ${i + 1} necesita al menos dos opciones`, "mal"); return; }
      const corr = ops.findIndex((x) => x.j === p.correcta);
      if (corr < 0) { toast(`La respuesta correcta de la pregunta ${i + 1} está vacía`, "mal"); return; }
      limpias.push({ texto: p.texto.trim(), opciones: ops.map((x) => x.o), correcta: corr, explicacion: p.explicacion.trim() });
    }
    if (!limpias.length) { toast("Añade al menos una pregunta", "mal"); return; }
    const datos = {
      id: id === "nuevo" ? undefined : id, titulo, descripcion: main.querySelector("#qd").value.trim(),
      carpeta: main.querySelector("#qc").value, publicado: main.querySelector("#qp").checked,
      preguntas: limpias.map((p) => ({ texto: p.texto, opciones: p.opciones })),
    };
    const b = main.querySelector("#guardarQ"); b.disabled = true;
    try {
      await api.guardarCuestionario(datos, limpias.map((p) => ({ correcta: p.correcta, explicacion: p.explicacion })));
      toast(datos.publicado ? "Cuestionario guardado y publicado" : "Cuestionario guardado como borrador", "ok");
      location.hash = "#/cuestionarios";
    } catch (e) { toast(mensajeError(e), "mal"); b.disabled = false; }
  };
}

// ---------------------------------------------------------------------
//  CLASES EN DIRECTO
// ---------------------------------------------------------------------
function htmlClase(c) {
  const d = new Date(c.fecha);
  const t = d.getTime(); const ahora = Date.now();
  const enDirecto = ahora > t - 15 * 60e3 && ahora < t + 2 * 3600e3;
  const pasada = ahora >= t + 2 * 3600e3;
  let acc = "";
  if (!pasada && c.enlace) acc += `<a class="btn ${enDirecto ? "verde" : ""} peq" href="${esc(urlSegura(c.enlace))}" target="_blank" rel="noopener">${I.clases} Entrar a la clase</a>`;
  if (c.grabacion) acc += `<button class="btn sec peq" data-grabacion>${I.video} Ver grabación</button>`;
  if (esProfesor()) acc += `<button class="btn sec peq" data-editar aria-label="Editar">${I.editar}</button><button class="btn peligro peq" data-borrar aria-label="Borrar">${I.borrar}</button>`;
  return `<div class="clase" data-id="${esc(c.id)}">
    <div class="dia"><div class="mes">${meses[d.getMonth()]}</div><div class="n">${d.getDate()}</div></div>
    <div class="cuerpo"><div class="titulo"><strong>${esc(c.titulo)}</strong> ${enDirecto ? `<span class="etiqueta roja">En directo ahora</span>` : ""}</div>
      <div class="hora">${fechaLarga(c.fecha)} · ${hora(c.fecha)} h</div>
      ${c.descripcion ? `<div class="desc muted">${esc(c.descripcion)}</div>` : ""}</div>
    <div class="acciones" style="display:flex;gap:.4rem;flex-wrap:wrap">${acc}</div></div>`;
}

function activarClases(main, clases) {
  main.querySelectorAll(".clase[data-id]").forEach((el) => {
    const c = clases.find((x) => String(x.id) === el.dataset.id);
    if (!c) return;
    const g = el.querySelector("[data-grabacion]"); if (g) g.onclick = () => abrirVisor(c.titulo, c.grabacion);
    const e = el.querySelector("[data-editar]"); if (e) e.onclick = () => formClase(c);
    const b = el.querySelector("[data-borrar]");
    if (b) b.onclick = async () => {
      if (!(await confirmar(`¿Borrar la clase «${esc(c.titulo)}»?`))) return;
      try { await api.borrarClase(c.id); toast("Clase borrada", "ok"); render(); } catch (er) { toast(mensajeError(er), "mal"); }
    };
  });
}

async function vClases(main, r, vigente) {
  const clases = await api.clases();
  if (!vigente()) return;
  const lim = Date.now() - 2 * 3600e3;
  const prox = clases.filter((c) => new Date(c.fecha).getTime() > lim);
  const pas = clases.filter((c) => new Date(c.fecha).getTime() <= lim).reverse();
  cabecera("Clases en directo", "El enlace para entrar se activa en cada clase. Las grabaciones quedan disponibles después.",
    esProfesor() ? `<button class="btn" id="nuevaClase">${I.mas} Programar clase</button>` : "");
  main.innerHTML = `<div class="tarjeta"><h2>Próximas clases</h2>${prox.length ? prox.map(htmlClase).join("") : vacio("clases", "No hay clases programadas.")}</div>
    <div class="tarjeta"><h2>Clases anteriores</h2>${pas.length ? pas.map(htmlClase).join("") : vacio("video", "Todavía no hay clases anteriores.")}</div>`;
  activarClases(main, clases);
  const n = document.getElementById("nuevaClase"); if (n) n.onclick = () => formClase({});
}

function formClase(c) {
  const md = modal({
    titulo: c.id ? "Editar clase" : "Programar clase",
    cuerpo: `<form id="fClase">
      <div class="campo"><label for="ct">Título</label><input id="ct" type="text" required value="${esc(c.titulo || "")}" placeholder="Ej.: Clase 3 · Documentos de la CEE"></div>
      <div class="campo"><label for="cf">Fecha y hora</label><input id="cf" type="datetime-local" required value="${c.fecha ? aLocalInput(c.fecha) : ""}"></div>
      <div class="campo"><label for="ce">Enlace de la videollamada</label><input id="ce" type="url" value="${esc(c.enlace || "")}" placeholder="https://meet.google.com/…"></div>
      <div class="campo"><label for="cd">Descripción <span class="muted">(opcional)</span></label><input id="cd" type="text" value="${esc(c.descripcion || "")}"></div>
      <div class="campo"><label for="cg">Enlace a la grabación <span class="muted">(opcional, después de la clase)</span></label><input id="cg" type="url" value="${esc(c.grabacion || "")}" placeholder="https://youtu.be/… o enlace de Drive"></div>
    </form>`,
    pie: `<button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="gClase">Guardar</button>`,
  });
  const q = (s) => md.el.querySelector(s);
  q("#gClase").onclick = async () => {
    if (!q("#fClase").reportValidity()) return;
    const d = { titulo: q("#ct").value.trim(), fecha: new Date(q("#cf").value).toISOString(), enlace: q("#ce").value.trim(), descripcion: q("#cd").value.trim(), grabacion: q("#cg").value.trim() };
    if (c.id) d.id = c.id;
    try { await api.guardarClase(d); md.cerrar(); toast("Clase guardada", "ok"); render(); } catch (e) { toast(mensajeError(e), "mal"); }
  };
}

// ---------------------------------------------------------------------
//  AVISOS
// ---------------------------------------------------------------------
function htmlAviso(a) {
  return `<article class="aviso ${a.importante ? "importante" : ""}" data-id="${esc(a.id)}">
    <div class="fecha">${fechaLarga(a.created_at)} ${a.importante ? `<span class="etiqueta roja">Importante</span>` : ""}</div>
    <h3>${esc(a.titulo)}</h3><div class="texto">${esc(a.contenido)}</div>
  </article>`;
}

async function vAvisos(main, r, vigente) {
  const avisos = await api.avisos();
  if (!vigente()) return;
  cabecera("Avisos", "Comunicaciones del profesor.", esProfesor() ? `<button class="btn" id="nuevoAviso">${I.mas} Publicar aviso</button>` : "");
  main.innerHTML = `<div class="tarjeta">${avisos.length ? avisos.map((a) => htmlAviso(a).replace("</article>",
    esProfesor() ? `<div class="acciones-cab" style="margin-top:.5rem"><button class="btn sec peq" data-editar>${I.editar} Editar</button><button class="btn peligro peq" data-borrar>${I.borrar} Borrar</button></div></article>` : "</article>")).join("")
    : vacio("avisos", "Todavía no hay avisos.")}</div>`;
  const n = document.getElementById("nuevoAviso"); if (n) n.onclick = () => formAviso({});
  main.querySelectorAll(".aviso[data-id]").forEach((el) => {
    const a = avisos.find((x) => String(x.id) === el.dataset.id);
    const e = el.querySelector("[data-editar]"); if (e) e.onclick = () => formAviso(a);
    const b = el.querySelector("[data-borrar]");
    if (b) b.onclick = async () => {
      if (!(await confirmar(`¿Borrar el aviso «${esc(a.titulo)}»?`))) return;
      try { await api.borrarAviso(a.id); toast("Aviso borrado", "ok"); render(); } catch (er) { toast(mensajeError(er), "mal"); }
    };
  });
}

function formAviso(a) {
  const md = modal({
    titulo: a.id ? "Editar aviso" : "Publicar aviso",
    cuerpo: `<form id="fAviso">
      <div class="campo"><label for="at">Título</label><input id="at" type="text" required value="${esc(a.titulo || "")}"></div>
      <div class="campo"><label for="ac">Mensaje</label><textarea id="ac" rows="6" required>${esc(a.contenido || "")}</textarea></div>
      <label class="check"><input type="checkbox" id="ai" ${a.importante ? "checked" : ""}> Marcar como importante</label>
    </form>`,
    pie: `<button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="gAviso">Publicar</button>`,
  });
  const q = (s) => md.el.querySelector(s);
  q("#gAviso").onclick = async () => {
    if (!q("#fAviso").reportValidity()) return;
    const d = { titulo: q("#at").value.trim(), contenido: q("#ac").value.trim(), importante: q("#ai").checked };
    if (a.id) d.id = a.id;
    try { await api.guardarAviso(d); md.cerrar(); toast("Aviso publicado", "ok"); render(); } catch (e) { toast(mensajeError(e), "mal"); }
  };
}

// ---------------------------------------------------------------------
//  ALUMNADO (solo profesor)
// ---------------------------------------------------------------------
async function vAlumnado(main, r, vigente) {
  const todos = await api.alumnos();
  if (!vigente()) return;
  const alumnos = todos.filter((p) => p.rol === "alumno");
  const activos = alumnos.filter((a) => a.activo);
  const bcc = activos.map((a) => a.email).join(",");
  cabecera("Alumnado", `${activos.length} ${activos.length === 1 ? "alumno activo" : "alumnos activos"}.`,
    `${activos.length ? `<a class="btn sec" href="mailto:?bcc=${encodeURIComponent(bcc)}">${I.correo} Escribir a todos</a>` : ""}<button class="btn" id="nuevoAlumno">${I.mas} Dar de alta</button>`);
  main.innerHTML = `<div class="tarjeta">${alumnos.length ? `<div class="tabla-env"><table>
      <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th></th></tr></thead>
      <tbody>${alumnos.map((a) => `<tr data-id="${esc(a.id)}">
        <td><strong>${esc(a.nombre)}</strong></td>
        <td><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></td>
        <td>${a.activo ? `<span class="etiqueta verde">Activo</span>` : `<span class="etiqueta gris">Desactivado</span>`}</td>
        <td style="text-align:right;white-space:nowrap">
          ${DEMO ? "" : `<button class="btn sec peq" data-reset>Nueva contraseña</button>`}
          <button class="btn ${a.activo ? "peligro" : "verde"} peq" data-activo>${a.activo ? "Desactivar" : "Activar"}</button></td></tr>`).join("")}
      </tbody></table></div>` : vacio("alumnado", "Todavía no has dado de alta a ningún alumno.")}</div>
    <p class="muted mt">Un alumno desactivado no puede entrar al campus, pero se conservan sus resultados. Puedes volver a activarlo cuando quieras.</p>`;
  document.getElementById("nuevoAlumno").onclick = formAlumno;
  main.querySelectorAll("tr[data-id]").forEach((tr) => {
    const a = alumnos.find((x) => String(x.id) === tr.dataset.id);
    tr.querySelector("[data-activo]").onclick = async () => {
      if (a.activo && !(await confirmar(`¿Desactivar a ${esc(a.nombre)}? No podrá entrar al campus.`, "Desactivar"))) return;
      try { await api.actualizarPerfil(a.id, { activo: !a.activo }); toast(a.activo ? "Alumno desactivado" : "Alumno activado", "ok"); render(); } catch (e) { toast(mensajeError(e), "mal"); }
    };
    const rs = tr.querySelector("[data-reset]");
    if (rs) rs.onclick = async () => {
      try { await api.recuperar(a.email); toast(`Enviado a ${a.email} un enlace para crear contraseña nueva`, "ok"); } catch (e) { toast(mensajeError(e), "mal"); }
    };
  });
}

function generarPassword() {
  const c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const a = new Uint32Array(10); crypto.getRandomValues(a);
  return [...a].map((n) => c[n % c.length]).join("");
}

function formAlumno() {
  const md = modal({
    titulo: "Dar de alta a un alumno",
    cuerpo: `<form id="fAlumno">
      <div class="campo"><label for="an">Nombre y apellidos</label><input id="an" type="text" required></div>
      <div class="campo"><label for="ae">Correo electrónico</label><input id="ae" type="email" required><div class="ayuda">Será su usuario para entrar.</div></div>
      <div class="campo"><label for="ap">Contraseña inicial</label>
        <div style="display:flex;gap:.5rem"><input id="ap" type="text" required minlength="6" value="${generarPassword()}"><button type="button" class="btn sec" id="otraPw">Generar</button></div>
        <div class="ayuda">El alumno podrá cambiarla después desde «Mi cuenta».</div></div>
    </form>`,
    pie: `<button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="gAlumno">Dar de alta</button>`,
  });
  const q = (s) => md.el.querySelector(s);
  q("#otraPw").onclick = () => (q("#ap").value = generarPassword());
  q("#gAlumno").onclick = async () => {
    if (!q("#fAlumno").reportValidity()) return;
    const datos = { nombre: q("#an").value.trim(), email: q("#ae").value.trim().toLowerCase(), password: q("#ap").value };
    const b = q("#gAlumno"); b.disabled = true; b.textContent = "Creando…";
    try {
      await api.crearAlumno(datos);
      md.cerrar();
      render();
      const texto = `Hola, ${datos.nombre.split(" ")[0]}:\n\nYa tienes acceso al campus virtual de ${NOMBRE}.\n\nDirección: ${urlBase()}\nUsuario: ${datos.email}\nContraseña: ${datos.password}\n\nTe recomiendo cambiar la contraseña desde «Mi cuenta» la primera vez que entres.\n\nUn saludo.`;
      const m2 = modal({
        titulo: "Alumno dado de alta",
        cuerpo: `<p style="margin-top:0">Envíale estos datos de acceso (por correo o WhatsApp):</p><div class="copiable" id="txtBienv">${esc(texto)}</div>`,
        pie: `<a class="btn sec" href="mailto:${encodeURIComponent(datos.email)}?subject=${encodeURIComponent("Acceso al campus virtual · " + NOMBRE)}&body=${encodeURIComponent(texto)}">${I.correo} Abrir en el correo</a><button class="btn" id="copiar">Copiar texto</button>`,
      });
      m2.el.querySelector("#copiar").onclick = async () => {
        try { await navigator.clipboard.writeText(texto); toast("Copiado", "ok"); } catch { toast("No se pudo copiar; selecciónalo a mano"); }
      };
    } catch (e) { toast(mensajeError(e), "mal"); b.disabled = false; b.textContent = "Dar de alta"; }
  };
}

// ---------------------------------------------------------------------
//  MI CUENTA
// ---------------------------------------------------------------------
async function vCuenta(main) {
  const p = S.perfil;
  cabecera("Mi cuenta");
  main.innerHTML = `<div class="rejilla dos">
    <div class="tarjeta"><h2>Mis datos</h2>
      <p><span class="muted">Nombre</span><br><strong>${esc(p.nombre)}</strong></p>
      <p><span class="muted">Correo (usuario)</span><br><strong>${esc(p.email)}</strong></p>
      <p style="margin-bottom:0"><span class="muted">Perfil</span><br><strong>${esProfesor() ? "Profesor" : "Alumno/a"}</strong></p></div>
    <form class="tarjeta" id="fPw"><h2>Cambiar contraseña</h2>
      <div class="campo"><label for="n1">Nueva contraseña</label><input id="n1" type="password" minlength="6" required autocomplete="new-password"></div>
      <div class="campo"><label for="n2">Repite la contraseña</label><input id="n2" type="password" minlength="6" required autocomplete="new-password"></div>
      <button class="btn">Guardar contraseña</button></form>
  </div>`;
  main.querySelector("#fPw").onsubmit = async (e) => {
    e.preventDefault();
    const a = main.querySelector("#n1").value; const b = main.querySelector("#n2").value;
    if (a !== b) { toast("Las contraseñas no coinciden", "mal"); return; }
    try { await api.cambiarPassword(a); e.target.reset(); toast("Contraseña actualizada", "ok"); } catch (er) { toast(mensajeError(er), "mal"); }
  };
}

init();
