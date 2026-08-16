import { useState, useRef } from "react";

/* ============================================================
   SHELFSIGN STUDIO — Sweepstouch (v2)
   Cambios v2:
   - Caja regular/save + OFFER VALID anclados ABAJO, fijos
     arriba de la franja VIP (no siguen al precio)
   - En precio simple, la unidad (LB./EA.) va al PIE del número
   - Mix & match: OR automático en el 2º producto, y sus
     detalles/volúmenes van DEBAJO de su nombre (details2)
   - Fotos: la IA devuelve bounding box de cada foto del flyer
     y el sistema recorta e inserta cada una automáticamente
   - Eliminado "nombre de tienda en el cartón"
   ============================================================ */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
.ss-app { font-family: 'Poppins', sans-serif; background: #f3f4f6; min-height: 100vh; }

.sheet {
  width: 8.5in; height: 11in; background: #fff;
  display: flex; flex-direction: column;
  overflow: hidden; position: relative;
}
.sheet-half { height: 5.5in; position: relative; display: flex; flex-direction: column; }
.cutline { border-top: 3px dashed #b9b9b9; position: absolute; top: 0; left: 0; right: 0; }

@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; top: 0; left: 0; }
  .sheet { page-break-after: always; box-shadow: none !important; }
  .no-print { display: none !important; }
}
@page { size: letter portrait; margin: 0; }
`;

const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- Logos oficiales Sweepstouch (arte original, no se recolorean) ---------- */
const VIP_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACTCAYAAAAa9lLaAAAZp0lEQVR4nGIYBdQF////5/n///+k////v/kPATf///+fPhrMZAAGBgYAAAAA///s0TENgDAUANGfDqQquiEOGyRoqIXqYGBkxUB9PAw0gR0uOQN3vwMwo6Hjwor81AoTDmO2N61RUHFix4L0yU8RcQMAAP//GsVo4P///8r///9/hyWJ7fz//z8jvvD6//9/Mo7ECQJ//v//L0tAv8L///9fYdG7cETGEwMDAwAAAP//GsVo4P///wvwJDIffOH1////pXj0gkAMAf1L8Oi1HHFxxcDAAAAAAP//GtZVx////1mh1fOD////v/////+W////axDQZoFHzpyAXkLhibcEZmBgsMYjZ49PI7TtG/P////i////uxAq7YcEYGBgAAAAAP//Gtb4////c7GURG////8vhSeij+MpxfIIJJI0PHr//v//X56A/gt49Ofg0afx////x2jqQZmRbUjHLwMDAwAAAP//Grb4////0ngiG2eHBZQQcOj5CTITX3j9//+f/f///2dw6O8kFNb///9vxmO3HB59uDJV2ZCOXwYGBgAAAAD//xq2+P///w54EuhyXP7+//8/M5aS9/P///8jiAmr////8////3/a////v0H1gkq2XGKq3P///3P+//9/F5rdv/7//x+HR48wHn8eHtLxy8DAAAAAAP//GrYYVI3/////H46IayDk7////5v8////ElR9Cqnh9P///9NQvRkk6mP6////XqjeXtCoAgH1oAyBCxwi1d2DCjAwMAAAAAD//xrW+P///7OwxNyL////SxCZWE5C9WwjJZz+///PBR1WAoGlJOrl/v///xeoXnci9RzAkUKLSbF70AEGBgYAAAAA//8a1vj///8s////r/3///9daKSDOkgqJCSWF9CI/v3//39REvQhNy8ekhLG////j0bSm0SkHsX////fRkuca0CjGKTYPegAAwMDAAAA//8aMfj///+G0IgzIjLS2dAiPJvYsPr//38Vml68A/Roercj6aslQR9oxgk0nAbq5NkQq29QAwYGBgAAAAD//xoxGFrt/sfXQUKLcGW0RHachMSyFU1vFJH6JKDDUTAwk0h9oI7dHVKbE4MeMDAwAAAAAP//GjFzvIyMjN8YGBhA1W3o////lYjQ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";
const PBS_LOGO = "data:image/png;base64,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";

/* ---------- Fechas: del calendario al formato del cartón ---------- */
const DAY_ABBR = ["SUN.", "MON.", "TUE.", "WED.", "THU.", "FRI.", "SAT."];
const MONTH_ABBR = ["JAN.", "FEB.", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUG.", "SEPT.", "OCT.", "NOV.", "DEC."];
function ordinal(d) {
  const v = d % 100;
  if (v >= 11 && v <= 13) return "TH";
  switch (d % 10) { case 1: return "ST"; case 2: return "ND"; case 3: return "RD"; default: return "TH"; }
}
function fmtOfferDate(iso, withYear) {
  if (!iso) return "";
  const dt = new Date(iso + "T00:00:00");
  if (isNaN(dt.getTime())) return iso;
  const dd = String(dt.getDate()).padStart(2, "0");
  return DAY_ABBR[dt.getDay()] + " " + MONTH_ABBR[dt.getMonth()] + " " + dd + ordinal(dt.getDate()) + (withYear ? ", " + dt.getFullYear() : "");
}

const DEMO_PRODUCTS = [
  {
    id: uid(), name: "BONELESS CHICKEN BREAST", details: "FAMILY PACK",
    name2: "", details2: "",
    priceType: "simple", qty: 1, dollars: 2, cents: 29, unit: "LB",
    regularPrice: "$2.99 LB", save: "70¢ PER LB.", conditions: "", photo: null,
  },
  {
    id: uid(), name: "RONZONI PASTA", details: "SELECT VARIETIES\n12-16 OZ BOX",
    name2: "BRUNSWICK SARDINES", details2: "IN SOYBEAN OIL\n3.75 OZ CAN\nMIX & MATCH!",
    priceType: "simple", qty: 1, dollars: 12, cents: 99, unit: "EA",
    regularPrice: "$2.29 LB.", save: "30¢ PER LB.", conditions: "", photo: null,
  },
  {
    id: uid(), name: "CAFÉ CARIBE COFFEE", details: "10 OZ BRICK PACK",
    name2: "SUPREMO COFFEE", details2: "8 OZ BRICK PACK",
    priceType: "multi", qty: 3, dollars: 10, cents: 0, unit: "EA",
    regularPrice: "$4.99 EA", save: "$4.97 PER OFFER",
    conditions: "LIMIT 1 OFFER PER FAMILY", photo: null,
  },
  {
    id: uid(), name: "TROPICANA ORANGE JUICE", details: "16 FL. OZ. BTL.\nPLUS TAX & DEPOSIT",
    name2: "", details2: "",
    priceType: "cents", qty: 2, dollars: 0, cents: 95, unit: "",
    regularPrice: "4 LB./$25.99", save: "$5.00 PER OFFER",
    conditions: "WITH CLUB CARD & ADD'L $79 PURCHASE\nLIMIT 4 OFFERS PER FAMILY\nMUST BUY 2", photo: null,
  },
];

const STORES = ["Super Supermarket", "City Supermarket", "Fine Fare", "Key Food", "Extra Supermarket", "Shop Fair"];

/* ---------- QR placeholder (tu sistema lo reemplaza) ---------- */
function FakeQR({ size = 92 }) {
  const n = 21, cell = size / n, cells = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (finder) {
        const lx = x >= n - 7 ? x - (n - 7) : x, ly = y >= n - 7 ? y - (n - 7) : y;
        const on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5);
        if (on) cells.push([x, y]);
      } else if (rnd() > 0.52) cells.push([x, y]);
    }
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ background: "#fff", display: "block" }}>
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * cell} y={y * cell} width={cell + 0.4} height={cell + 0.4} fill="#111" />
      ))}
    </svg>
  );
}

function PriceBlock({ p, color }) {
  const big = { fontWeight: 800, color, lineHeight: 0.85, letterSpacing: "-5px" };
  const NUM_H = 155; /* alto visual del numero grande, para anclar la unidad al pie */
  const qty = Math.max(1, Number(p.qty) || 1);
  const dollars = Math.max(0, Number(p.dollars) || 0);
  const cents = Math.min(99, Math.max(0, Number(p.cents) || 0));
  /* El formato se deriva solo de los valores:
     dolares 0 => centavos (89c / 2/95c); cantidad > 1 => multiple (2/$12.95); si no => simple */
  const type = dollars === 0 ? "cents" : (qty > 1 ? "multi" : "simple");

  if (type === "multi") {
    const hasUnit = !!p.unit;
    return (
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ color, fontWeight: 800, lineHeight: 0.9, marginTop: hasUnit ? 8 : 42, marginRight: 3, textAlign: "left" }}>
          <div style={{ fontSize: hasUnit ? 65 : 78, letterSpacing: "-2px" }}>{qty}/$</div>
          {hasUnit && <div style={{ fontSize: 48 }}>{p.unit + "."}</div>}
          {hasUnit && <div style={{ fontSize: 48 }}>FOR</div>}
        </div>
        <div style={{ ...big, fontSize: 188 }}>{dollars}</div>
        {cents > 0 && (
          <div style={{ color, fontWeight: 800, fontSize: 70, lineHeight: 1, marginTop: 10, letterSpacing: "-1px" }}>
            {String(cents).padStart(2, "0")}
          </div>
        )}
      </div>
    );
  }
  if (type === "cents") {
    return (
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ color, fontWeight: 800, fontSize: 90, lineHeight: 1, marginTop: 30, marginRight: 5 }}>{qty > 1 ? qty + "/" : ""}</div>
        <div style={{ ...big, fontSize: 188 }}>{p.cents}</div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: NUM_H, marginTop: 8 }}>
          <div style={{ color, fontWeight: 800, fontSize: 75, lineHeight: 1 }}>{"\u00A2"}</div>
          <div style={{ color, fontWeight: 800, fontSize: 38, lineHeight: 1 }}>{p.unit ? p.unit + "." : ""}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ color, fontWeight: 800, fontSize: 80, lineHeight: 1, marginTop: 12, marginRight: 3 }}>$</div>
      <div style={{ ...big, fontSize: 188 }}>{dollars}</div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: NUM_H, marginTop: 8, textAlign: "left" }}>
        {cents > 0 ? (
          <div style={{ color, fontWeight: 800, fontSize: 70, lineHeight: 0.9, letterSpacing: "-1px" }}>
            {String(cents).padStart(2, "0")}
          </div>
        ) : <div />}
        <div style={{ color, fontWeight: 800, fontSize: 38, lineHeight: 1 }}>{p.unit ? p.unit + "." : ""}</div>
      </div>
    </div>
  );
}

/* ---------- Un shelfsign ---------- */
function ShelfSign({ p, cfg, isBottom }) {
  const color = cfg.color;
  const orName2 = p.name2
    ? (p.name2.trim().toUpperCase().startsWith("OR ") ? p.name2 : "OR " + p.name2)
    : "";
  return (
    <div className="sheet-half" style={{ padding: "0.22in 0.3in 0 0.3in" }}>
      {isBottom && <div className="cutline" />}
      <div style={{ display: "flex", flex: 1, gap: "0.15in", minHeight: 0 }}>
        {/* Columna izquierda: precio arriba, caja save + offer valid FIJOS abajo */}
        <div style={{ flex: 1.15, display: "flex", flexDirection: "column" }}>
          <div style={{ marginTop: 30 }}><PriceBlock p={p} color={color} /></div>
          {/* bloque anclado al fondo, arriba de la franja VIP */}
          <div style={{ marginTop: "auto", paddingBottom: 10 }}>
            {cfg.showSaveBox && (
              <div style={{
                background: "#efefef", borderRadius: 8, padding: "6px 14px",
                display: "inline-flex", alignItems: "center", gap: 12, width: "fit-content",
              }}>
                <div style={{ lineHeight: 1.05 }}>
                  <div style={{ color, fontWeight: 700, fontSize: 12 }}>
                    regular price <span style={{ color: "#555", fontWeight: 500, fontSize: 8 }}>(precio regular)</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{p.regularPrice}</div>
                </div>
                <div style={{ fontSize: 26, color: "#999", fontWeight: 300 }}>/</div>
                <div style={{ lineHeight: 1.05 }}>
                  <div style={{ color, fontWeight: 700, fontSize: 12 }}>
                    save <span style={{ color: "#555", fontWeight: 500, fontSize: 8 }}>(Ahorre)</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{p.save}</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 11.5, color: "#111", lineHeight: 1.3, maxWidth: "2.6in" }}>
              <b>OFFER VALID:</b> FROM {fmtOfferDate(cfg.dateFrom)},<br />TO {fmtOfferDate(cfg.dateTo, true)}.
            </div>
          </div>
        </div>

        {/* Columna derecha: foto + nombres (orden: nombre 1 → detalles 1 → OR nombre 2 → detalles 2 → condiciones) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: p.photo ? "space-between" : "flex-end", textAlign: "right", paddingBottom: 10 }}>
          {p.photo && (
            <img src={p.photo} alt="" style={{ maxWidth: "100%", maxHeight: "2.4in", objectFit: "contain" }} />
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#111", lineHeight: 1.05 }}>{p.name}</div>
            {p.details && p.details.split("\n").map((l, i) => (
              <div key={i} style={{ fontSize: 12.5, fontWeight: 500, color: "#111", lineHeight: 1.35 }}>{l}</div>
            ))}
            {orName2 && (
              <div style={{ fontWeight: 800, fontSize: 20, color: "#111", lineHeight: 1.1, marginTop: 3 }}>{orName2}</div>
            )}
            {orName2 && p.details2 && p.details2.split("\n").map((l, i) => (
              <div key={i} style={{ fontSize: 12.5, fontWeight: 500, color: "#111", lineHeight: 1.35 }}>{l}</div>
            ))}
            {p.conditions && p.conditions.split("\n").map((l, i) => (
              <div key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "#111", lineHeight: 1.35 }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner VIP */}
      <div style={{ display: "flex", height: "1.45in", marginLeft: "-0.3in", marginRight: "-0.3in" }}>
        <div style={{ flex: 1, background: color, display: "flex", alignItems: "center", gap: 16, padding: "0 0.25in" }}>
          <img src={VIP_LOGO} alt="VIP CUSTOMER" style={{ height: "1in", width: "auto" }} />
          <div style={{ background: "#fff", padding: 5 }}><FakeQR size={92} /></div>
          <svg width="26" height="40" viewBox="0 0 26 40"><path d="M2 2 L24 20 L2 38 Z" fill="#fff" /></svg>
          <div style={{ color: "#fff", lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>SCAN ME!</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>And become a</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>VIP CUSTOMER</div>
          </div>
          <div style={{ width: 1, height: "60%", background: "rgba(255,255,255,.6)" }} />
          <div style={{ color: "#fff", fontSize: 16, lineHeight: 1.2 }}>
            Participate in<br /><b>monthly sweepstakes</b>
          </div>
        </div>
        <div style={{ width: "1.7in", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={PBS_LOGO} alt="Powered by Sweepstouch" style={{ height: "1.25in", width: "auto" }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Prompt de extracción ---------- */
const EXTRACT_PROMPT = `Analiza esta imagen de un flyer de supermercado y extrae TODOS los productos con sus precios y la ubicación de su FOTO.

Responde ÚNICAMENTE con JSON válido, sin markdown, sin backticks, sin texto adicional. Esquema:
{"products":[{
 "name":"NOMBRE PRODUCTO 1 EN MAYÚSCULAS",
 "details":"detalles/volúmenes del producto 1 separados por \\n (ej: 10 OZ BRICK PACK)",
 "name2":"nombre del producto 2 SOLO si la promo es combinada tipo OR / MIX & MATCH; SIN la palabra OR; cadena vacía si no aplica",
 "details2":"detalles/volúmenes del producto 2 separados por \\n; vacía si no aplica",
 "priceType":"simple|multi|cents",
 "qty":numero,
 "dollars":numero entero,
 "cents":numero entero,
 "unit":"LB"|"EA"|"",
 "regularPrice":"ej $2.99 LB",
 "save":"ej 70¢ PER LB",
 "conditions":"LIMIT, MUST BUY, WITH CLUB CARD... separadas por \\n; vacía si no hay",
 "photoBox":{"x":num,"y":num,"w":num,"h":num} o null
}]}

Reglas:
- priceType "simple": $2.29 LB o $12.99 EA. "multi": 4/$15.99 (qty=4, dollars=15, cents=99). "cents": 2/95¢ o 49¢ LB (dollars=0).
- unit: SOLO si la unidad (LB/EA) aparece impresa JUNTO al precio de oferta grande. Si la promo es tipo "5/$10" sin unidad visible, unit="" aunque el regular price diga EA o LB. NUNCA deduzcas la unidad del regular price.
- "qty" SIEMPRE es 1, salvo en promos múltiples: 4/$15.99 => qty 4; 2/95¢ => qty 2.
- En "multi", unit va VACÍA ("") salvo que la unidad aparezca EXPLÍCITA junto al precio de oferta (ej "4/$15.99 LB"). NUNCA infieras la unidad desde el regular price: "3/$5" es unit vacía aunque el regular price diga $2.99 EA.
- Cada detalle/volumen va con SU producto: details con name, details2 con name2. NUNCA mezcles los volúmenes de ambos.
- Si un atributo aplica a AMBOS productos por igual (ej "MINIMUM 1 LB", "LIMIT 1 OFFER PER FAMILY"), va UNA SOLA vez en "conditions" y NO se repite en details ni details2.
- photoBox: recorte de la FOTO del producto dentro del flyer, en PORCENTAJES 0-100 relativos al ancho y alto totales de la imagen (x,y = esquina superior izquierda del recorte; w,h = ancho y alto). Sé preciso y ajustado a la foto, sin incluir textos ni precios. Si el producto no tiene foto, usa null.
- Extrae también produce y grocery si existen.
- Devuelve el JSON MINIFICADO en UNA sola línea, sin espacios innecesarios ni saltos de línea, para aprovechar el espacio de respuesta.`;

/* ---------- Recorte de fotos desde el flyer ---------- */
function cropFromImage(imgEl, box) {
  try {
    const W = imgEl.naturalWidth, H = imgEl.naturalHeight;
    const x = Math.max(0, (box.x / 100) * W);
    const y = Math.max(0, (box.y / 100) * H);
    const w = Math.max(4, Math.min(W - x, (box.w / 100) * W));
    const h = Math.max(4, Math.min(H - y, (box.h / 100) * H));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(imgEl, x, y, w, h, 0, 0, w, h);
    return c.toDataURL("image/png");
  } catch (e) { return null; }
}

/* ---------- Utilidades de análisis ---------- */
function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("no se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

function loadImage(dataURL) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("no se pudo cargar la imagen"));
    img.src = dataURL;
  });
}

/* Reduce la imagen antes de enviarla a la API (flyers muy grandes fallan o tardan) */
async function downscaleDataURL(dataURL, maxSide = 1600) {
  const img = await loadImage(dataURL);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  const out = c.toDataURL("image/jpeg", 0.85);
  return { b64: out.split(",")[1], mediaType: "image/jpeg" };
}

/* Interpreta el JSON aunque la respuesta venga truncada: cierra en el último producto completo */
function salvageJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  if (start < 0) return null;
  const body = clean.slice(start);
  try { return JSON.parse(body); } catch (e) {}
  for (let i = body.length - 1, tries = 0; i > 0 && tries < 200; i--) {
    if (body[i] !== "}") continue;
    tries++;
    const cut = body.slice(0, i + 1);
    for (const tail of ["]}", "}]}", ""]) {
      try {
        const parsed = JSON.parse(cut + tail);
        if (parsed && parsed.products) return parsed;
      } catch (e) {}
    }
  }
  return null;
}

/* Convierte una línea de texto libre en un producto: "JUMBO WHITE EGGS 3/$5", "POLLO $2.29 LB", "JUGO 2/95¢" */
function parseManualLine(line) {
  const t = line.trim();
  if (!t) return null;
  let priceType = "simple", qty = 1, dollars = 0, cents = 0, unit = "";
  let rest = t, m;
  if (/¢/.test(t)) {
    priceType = "cents";
    const q = t.match(/(\d+)\s*\/\s*(\d+)\s*¢/);
    if (q) { qty = Math.max(1, +q[1]); cents = +q[2]; rest = t.replace(q[0], " "); }
    else if ((m = t.match(/(\d+)\s*¢/))) { cents = +m[1]; rest = t.replace(m[0], " "); }
  } else if ((m = t.match(/(\d+)\s*\/\s*\$?\s*(\d+)(?:[.,](\d{1,2}))?/))) {
    qty = Math.max(1, +m[1]); dollars = +m[2]; cents = m[3] ? +m[3].padEnd(2, "0") : 0;
    priceType = qty > 1 ? "multi" : "simple";
    rest = t.replace(m[0], " ");
  } else if ((m = t.match(/\$\s*(\d+)(?:[.,](\d{1,2}))?/))) {
    dollars = +m[1]; cents = m[2] ? +m[2].padEnd(2, "0") : 0;
    rest = t.replace(m[0], " ");
  }
  const u = rest.match(/\b(LB|EA)\b/i);
  if (u) { unit = u[1].toUpperCase(); rest = rest.replace(u[0], " "); }
  const name = rest.replace(/[|;,\-]+\s*$/, "").replace(/^\s*[|;,\-]+/, "").replace(/\s{2,}/g, " ").trim().toUpperCase() || "PRODUCTO";
  return { id: uid(), photo: null, photoBox: null, name, details: "", name2: "", details2: "",
    priceType, qty, dollars, cents, unit, regularPrice: "", save: "", conditions: "" };
}

/* Atributos compartidos (ej MINIMUM 1 LB) repetidos en details, details2 y conditions:
   se dejan UNA sola vez, en conditions */
function dedupeShared(p) {
  const norm = (l) => l.trim().toUpperCase();
  const lines = (t) => (t || "").split("\n").map(x => x.trim()).filter(Boolean);
  const uniq = (arr) => arr.filter((l, i) => arr.findIndex(x => norm(x) === norm(l)) === i);
  let d1 = uniq(lines(p.details));
  let d2 = uniq(lines(p.details2));
  let cond = uniq(lines(p.conditions));
  if (p.name2) {
    const shared = d1.filter(l => d2.some(x => norm(x) === norm(l)));
    if (shared.length) {
      d1 = d1.filter(l => !shared.some(x => norm(x) === norm(l)));
      d2 = d2.filter(l => !shared.some(x => norm(x) === norm(l)));
      shared.forEach(l => { if (!cond.some(x => norm(x) === norm(l))) cond.push(l); });
    }
  }
  d1 = d1.filter(l => !cond.some(x => norm(x) === norm(l)));
  d2 = d2.filter(l => !cond.some(x => norm(x) === norm(l)));
  return { ...p, details: d1.join("\n"), details2: d2.join("\n"), conditions: cond.join("\n") };
}

/* Texto de cómo se imprimirá el precio, para vista previa en el editor */
function priceLabel(p) {
  const qty = Math.max(1, Number(p.qty) || 1);
  const d = Math.max(0, Number(p.dollars) || 0);
  const c = Math.min(99, Math.max(0, Number(p.cents) || 0));
  const u = p.unit ? " " + p.unit + "." : "";
  const cc = c > 0 ? "." + String(c).padStart(2, "0") : "";
  if (d === 0) return (qty > 1 ? qty + "/" : "") + c + "\u00A2" + u;
  if (qty > 1) return qty + "/$" + d + cc + (p.unit ? " " + p.unit + ". FOR" : "");
  return "$" + d + cc + u;
}

/* Recorta las fotos de cada producto desde el flyer en resolución original */
async function attachPhotos(items, fullResDataURL) {
  try {
    const img = await loadImage(fullResDataURL);
    if (!img.naturalWidth) return items;
    return items.map(p => (p.photoBox && p.photoBox.w > 0 && p.photoBox.h > 0)
      ? { ...p, photo: cropFromImage(img, p.photoBox) }
      : p);
  } catch (e) { return items; }
}

/* ============================================================ */
export default function ShelfSignStudio() {
  const [tab, setTab] = useState(0);
  const [cfg, setCfg] = useState({
    color: "#EC0F8B",
    showSaveBox: true,
    store: STORES[0],
    dateFrom: "2026-04-17",
    dateTo: "2026-04-20",
  });
  const [products, setProducts] = useState([]);
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null);
  const [originalFlyer, setOriginalFlyer] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const fileRef = useRef(null);

  const setP = (id, patch) => setProducts(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const toItems = (arr) => (arr || []).map(p => ({
    id: uid(), photo: null, photoBox: p.photoBox || null,
    name: p.name || "", details: p.details || "",
    name2: p.name2 || "", details2: p.details2 || "",
    priceType: p.priceType || "simple",
    qty: Number(p.qty) || 1, dollars: Number(p.dollars) || 0, cents: Number(p.cents) || 0,
    unit: p.unit || "", regularPrice: p.regularPrice || "", save: p.save || "",
    conditions: p.conditions || "",
  })).map(dedupeShared);

  const runExtraction = async (b64, mediaType, extra) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
            { type: "text", text: EXTRACT_PROMPT + (extra || "") },
          ],
        }],
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "error de la API");
    const text = (data.content || []).filter(x => x.type === "text").map(x => x.text).join("\n");
    const parsed = salvageJSON(text);
    if (!parsed || !parsed.products) throw new Error("la respuesta no se pudo interpretar");
    return { parsed, truncated: data.stop_reason === "max_tokens" };
  };

  const analyzeFlyer = async (file) => {
    setLoading(true);
    setStatus("Preparando imagen…");
    try {
      const dataURL = await readAsDataURL(file);
      setFlyerPreview(dataURL);
      setOriginalFlyer(dataURL);
      const small = await downscaleDataURL(dataURL, 1600);
      setStatus("Analizando flyer con IA…");
      const { parsed, truncated } = await runExtraction(small.b64, small.mediaType, "");
      setStatus("Recortando fotos de productos…");
      const items = await attachPhotos(toItems(parsed.products), dataURL);
      setProducts(items);
      const withPhoto = items.filter(p => p.photo).length;
      if (truncated) {
        setPending({ b64: small.b64, mediaType: small.mediaType, names: items.map(i => i.name) });
        setStatus("✓ " + items.length + " producto(s) extraídos (" + withPhoto + " con foto). El flyer tiene más: pulsa \"Continuar análisis\" para extraer el resto.");
      } else {
        setPending(null);
        setStatus("✓ " + items.length + " producto(s) detectado(s), " + withPhoto + " con foto recortada. Revisa precios y recortes antes de generar.");
      }
    } catch (e) {
      setStatus("Error al analizar: " + (e.message || e) + ". Reintenta, sube un recorte más pequeño del flyer, o carga el demo.");
    }
    setLoading(false);
  };

  const continueAnalysis = async () => {
    if (!pending) return;
    setLoading(true);
    setStatus("Extrayendo productos restantes…");
    try {
      const extra = "\n\nIMPORTANTE: Estos productos YA fueron extraídos, NO los repitas: " + pending.names.join("; ") + ". Devuelve SOLO los productos RESTANTES del flyer, mismo esquema JSON.";
      const { parsed, truncated } = await runExtraction(pending.b64, pending.mediaType, extra);
      const nuevos = toItems(parsed.products).filter(n => !pending.names.includes(n.name));
      const conFoto = await attachPhotos(nuevos, originalFlyer);
      setProducts(ps => [...ps, ...conFoto]);
      const names = [...pending.names, ...nuevos.map(i => i.name)];
      if (truncated && nuevos.length > 0) {
        setPending({ ...pending, names });
        setStatus("✓ +" + nuevos.length + " producto(s) más. Aún quedan: pulsa \"Continuar análisis\" otra vez.");
      } else {
        setPending(null);
        setStatus("✓ Análisis completo: +" + nuevos.length + " producto(s) agregados. Revisa antes de generar.");
      }
    } catch (e) {
      setStatus("Error al continuar: " + (e.message || e) + ". Reintenta o agrega los faltantes manualmente.");
    }
    setLoading(false);
  };

  const pages = [];
  for (let i = 0; i < products.length; i += 2) pages.push(products.slice(i, i + 2));

  const card = { background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.08)" };
  const inp = { width: "100%", padding: "8px 10px", border: "1px solid #d7d7d7", borderRadius: 8, fontFamily: "inherit", fontSize: 13 };
  const lbl = { fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4, display: "block" };
  const btn = (primary) => ({
    padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 14, fontFamily: "inherit",
    background: primary ? cfg.color : "#e8e8e8", color: primary ? "#fff" : "#333",
  });

  return (
    <div className="ss-app">
      <style>{FONT_CSS}</style>

      <div className="no-print" style={{ background: "#111", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          Shelfsign <span style={{ color: cfg.color }}>Studio</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["1 · Plantilla master", "2 · Productos (IA)", "3 · Vista previa y PDF"].map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600, fontSize: 13,
              background: tab === i ? cfg.color : "#2a2a2a", color: "#fff",
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="no-print" style={{ padding: 24, maxWidth: 1240, margin: "0 auto" }}>

        {/* ============ TAB 1: MASTER ============ */}
        {tab === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            <div style={{ ...card, height: "fit-content" }}>
              <h3 style={{ margin: "0 0 14px" }}>Plantilla master</h3>
              <label style={lbl}>Color primario</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input type="color" value={cfg.color} onChange={e => setCfg({ ...cfg, color: e.target.value })}
                  style={{ width: 46, height: 36, border: "none", background: "none", cursor: "pointer" }} />
                <input style={inp} value={cfg.color} onChange={e => setCfg({ ...cfg, color: e.target.value })} />
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={cfg.showSaveBox} onChange={e => setCfg({ ...cfg, showSaveBox: e.target.checked })} />
                Mostrar caja regular price / save
              </label>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                Elementos fijos: banner VIP, QR (lo inyecta el sistema), "Powered by" y logo. La caja regular/save y el OFFER VALID quedan anclados abajo, arriba de la franja, sin importar el tamaño del precio.
              </div>
            </div>
            <div style={{ ...card, overflow: "auto" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Vista previa del master (producto de ejemplo)</div>
              <div style={{ transform: "scale(0.62)", transformOrigin: "top left", width: "8.5in", height: "3.6in" }}>
                <div style={{ width: "8.5in", background: "#fff", border: "1px solid #eee" }}>
                  <ShelfSign p={DEMO_PRODUCTS[1]} cfg={cfg} isBottom={false} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB 2: PRODUCTOS ============ */}
        {tab === 1 && (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Extraer productos del flyer</h3>
                <button onClick={() => { setProducts(DEMO_PRODUCTS.map(p => ({ ...p, id: uid() }))); setStatus("Demo cargado."); }}
                  style={{ border: "1px solid #e0e0e0", background: "#fafafa", color: "#aaa", borderRadius: 6, fontSize: 11, padding: "3px 9px", cursor: "pointer", fontFamily: "inherit" }}>demo</button>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files[0] && analyzeFlyer(e.target.files[0])} />
                <button style={btn(true)} disabled={loading} onClick={() => fileRef.current.click()}>
                  {loading ? "Procesando…" : "Subir flyer y analizar con IA"}
                </button>
                <button style={btn(false)} onClick={() => setManualOpen(o => !o)}>
                  + Agregar manual (lista)
                </button>
                {pending && !loading && (
                  <button style={btn(true)} onClick={continueAnalysis}>Continuar análisis (faltan productos)</button>
                )}
                {status && <div style={{ fontSize: 13, color: "#444" }}>{status}</div>}
              </div>
              {flyerPreview && (
                <img src={flyerPreview} alt="flyer" style={{ marginTop: 12, maxHeight: 160, borderRadius: 8, border: "1px solid #eee" }} />
              )}
              {manualOpen && (
                <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
                  <label style={lbl}>Un producto por línea — nombre y precio en formato libre</label>
                  <textarea style={{ ...inp, minHeight: 110 }}
                    placeholder={"JUMBO WHITE EGGS 3/$5\nBONELESS CHICKEN BREAST $2.29 LB\nTROPICANA ORANGE JUICE 2/95¢"}
                    value={manualText} onChange={e => setManualText(e.target.value)} />
                  <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button style={btn(true)} onClick={() => {
                      const items = manualText.split("\n").map(parseManualLine).filter(Boolean);
                      if (!items.length) { setStatus("Escribe al menos una línea."); return; }
                      setProducts(ps => [...ps, ...items]);
                      setManualText("");
                      setManualOpen(false);
                      setStatus("✓ " + items.length + " cartón(es) generados desde la lista. Completa detalles donde haga falta.");
                    }}>Generar cartones desde la lista</button>
                    <div style={{ fontSize: 12, color: "#888" }}>Detecta solo: $2.29 LB · 3/$5 · 2/95¢ · 49¢ · EA / LB</div>
                  </div>
                </div>
              )}
            </div>

            {products.map((p, idx) => (
              <div key={p.id} style={{ ...card, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <b style={{ color: cfg.color }}>Cartón {idx + 1}</b>
                    <button onClick={() => setProducts(ps => ps.filter(x => x.id !== p.id))}
                      style={{ border: "none", background: "none", color: "#c00", cursor: "pointer", fontWeight: 700 }}>Eliminar</button>
                  </div>
                  <label style={lbl}>Producto 1</label>
                  <input style={inp} value={p.name} onChange={e => setP(p.id, { name: e.target.value })} />
                  <label style={{ ...lbl, marginTop: 8 }}>Detalles producto 1</label>
                  <textarea style={{ ...inp, minHeight: 48 }} value={p.details} onChange={e => setP(p.id, { details: e.target.value })} />
                  <label style={{ ...lbl, marginTop: 8 }}>Producto 2 (OR se agrega solo)</label>
                  <input style={inp} value={p.name2} onChange={e => setP(p.id, { name2: e.target.value })} />
                  <label style={{ ...lbl, marginTop: 8 }}>Detalles producto 2</label>
                  <textarea style={{ ...inp, minHeight: 48 }} value={p.details2} onChange={e => setP(p.id, { details2: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Precio — el formato se arma solo con estos valores</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                    <div><label style={lbl}>Cant.</label><input style={inp} type="number" min="1" value={p.qty} onChange={e => setP(p.id, { qty: Math.max(1, Math.floor(+e.target.value) || 1) })} /></div>
                    <div><label style={lbl}>$</label><input style={inp} type="number" min="0" value={p.dollars} onChange={e => setP(p.id, { dollars: Math.max(0, Math.floor(+e.target.value) || 0) })} /></div>
                    <div><label style={lbl}>¢</label><input style={inp} type="number" min="0" max="99" value={p.cents} onChange={e => setP(p.id, { cents: Math.min(99, Math.max(0, Math.floor(+e.target.value) || 0)) })} /></div>
                    <div><label style={lbl}>Unidad</label>
                      <select style={inp} value={p.unit} onChange={e => setP(p.id, { unit: e.target.value })}>
                        <option value="LB">LB</option><option value="EA">EA</option><option value="">—</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: cfg.color }}>Se imprimirá: {priceLabel(p)}</div>
                  <label style={{ ...lbl, marginTop: 8 }}>Regular price</label>
                  <input style={inp} value={p.regularPrice} onChange={e => setP(p.id, { regularPrice: e.target.value })} />
                  <label style={{ ...lbl, marginTop: 8 }}>Save</label>
                  <input style={inp} value={p.save} onChange={e => setP(p.id, { save: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Condiciones (limit, club card…)</label>
                  <textarea style={{ ...inp, minHeight: 48 }} value={p.conditions} onChange={e => setP(p.id, { conditions: e.target.value })} />
                  <label style={{ ...lbl, marginTop: 8 }}>Foto (recortada del flyer por la IA)</label>
                  {p.photo ? (
                    <div>
                      <img src={p.photo} alt="" style={{ maxHeight: 80, borderRadius: 6, border: "1px solid #eee", background: "#fafafa" }} />
                      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button onClick={() => setP(p.id, { photo: null })} style={{ border: "none", background: "none", color: "#c00", cursor: "pointer", fontSize: 12, padding: 0 }}>Quitar</button>
                        <label style={{ color: "#0366d6", cursor: "pointer", fontSize: 12 }}>
                          Reemplazar
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                            const f = e.target.files[0]; if (!f) return;
                            const r = new FileReader(); r.onload = () => setP(p.id, { photo: r.result }); r.readAsDataURL(f);
                          }} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Sin foto detectada.{" "}
                      <label style={{ color: "#0366d6", cursor: "pointer" }}>
                        Subir manual
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                          const f = e.target.files[0]; if (!f) return;
                          const r = new FileReader(); r.onload = () => setP(p.id, { photo: r.result }); r.readAsDataURL(f);
                        }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ TAB 3: PREVIEW / PDF ============ */}
        {tab === 2 && (
          <div>
            <div style={{ ...card, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
              <div style={{ minWidth: 200 }}>
                <label style={lbl}>Tienda (organización / QR — no aparece en el cartón)</label>
                <input style={inp} list="stores" value={cfg.store} onChange={e => setCfg({ ...cfg, store: e.target.value })} />
                <datalist id="stores">{STORES.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div><label style={lbl}>Válido desde</label>
                <input style={inp} type="date" value={cfg.dateFrom} onChange={e => setCfg({ ...cfg, dateFrom: e.target.value })} />
                <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700, marginTop: 4 }}>{fmtOfferDate(cfg.dateFrom)}</div></div>
              <div><label style={lbl}>Válido hasta</label>
                <input style={inp} type="date" value={cfg.dateTo} onChange={e => setCfg({ ...cfg, dateTo: e.target.value })} />
                <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700, marginTop: 4 }}>{fmtOfferDate(cfg.dateTo, true)}</div></div>
              <button style={btn(true)} onClick={() => window.print()}>
                Imprimir / Guardar PDF ({pages.length} hoja{pages.length !== 1 ? "s" : ""})
              </button>
              <div style={{ fontSize: 12, color: "#888" }}>
                {products.length} producto(s) → {pages.length} hoja(s) carta, 2 cartones por hoja.
              </div>
            </div>

            {products.length === 0 ? (
              <div style={{ ...card, textAlign: "center", color: "#888", padding: 50 }}>
                Aún no hay productos. Ve a "Productos (IA)" y sube un flyer o carga el demo.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {pages.map((pair, i) => (
                  <div key={i} style={{ overflow: "auto" }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Hoja {i + 1}</div>
                    <div style={{ transform: "scale(0.6)", transformOrigin: "top left", width: "8.5in", height: "6.7in" }}>
                      <div className="sheet" style={{ boxShadow: "0 2px 14px rgba(0,0,0,.15)" }}>
                        <ShelfSign p={pair[0]} cfg={cfg} isBottom={false} />
                        {pair[1] ? <ShelfSign p={pair[1]} cfg={cfg} isBottom={true} /> : <div className="sheet-half"><div className="cutline" /></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Área de impresión real */}
      <div className="print-area" style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {pages.map((pair, i) => (
          <div key={i} className="sheet">
            <ShelfSign p={pair[0]} cfg={cfg} isBottom={false} />
            {pair[1] ? <ShelfSign p={pair[1]} cfg={cfg} isBottom={true} /> : <div className="sheet-half"><div className="cutline" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
