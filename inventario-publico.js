/* =========================================================
   inventario-publico.js
   Transparencia pública de inventario
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    cargarInventarioPublico();
  }, 1000);
});

/* ---------------------------------------------------------
   Cargar inventario público
--------------------------------------------------------- */

async function cargarInventarioPublico() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) {
    console.warn("Firestore no disponible.");
    return;
  }

  const { db } = firebaseTools;

  const contenedor = document.getElementById("inventarioPublico");

  if (!contenedor) return;

  try {

    const snap = await db
      .collection("inventario_equipo")
      .where("publico", "==", true)
      .orderBy("creadoEn", "desc")
      .limit(12)
      .get();

    if (snap.empty) {

      contenedor.innerHTML = `
        <div class="info-card">
          <h3>Transparencia pública</h3>
          <p>
            Aún no hay equipo público registrado.
          </p>
        </div>
      `;

      actualizarResumenPublico([], 0);

      return;
    }

    const lista = [];

    snap.forEach((doc) => {

      lista.push({
        id: doc.id,
        ...doc.data()
      });

    });

    pintarInventarioPublico(lista);

  } catch (error) {

    console.error("Error cargando inventario público:", error);

    contenedor.innerHTML = `
      <div class="info-card">
        <h3>Error</h3>
        <p>
          No se pudo cargar la información pública.
        </p>
      </div>
    `;
  }
}

/* ---------------------------------------------------------
   Pintar tarjetas públicas
--------------------------------------------------------- */

function pintarInventarioPublico(lista) {

  const contenedor = document.getElementById("inventarioPublico");

  if (!contenedor) return;

  let html = "";

  let totalInvertido = 0;
  let totalEntregados = 0;

  lista.forEach((equipo) => {

    totalInvertido += Number(equipo.costoTotal || 0);

    if (
      equipo.estado === "entregado" ||
      equipo.estado === "en_uso"
    ) {
      totalEntregados++;
    }

    html += `
      <article class="inventory-card">

        <div class="inventory-image">

          ${
            equipo.fotoEquipoUrl
              ? `<img src="${equipo.fotoEquipoUrl}" alt="${escapeHtml(equipo.nombreEquipo || "")}">`
              : `<div class="inventory-placeholder">Sin imagen</div>`
          }

        </div>

        <div class="inventory-content">

          <span class="inventory-category">
            ${formatearCategoria(equipo.categoria || "")}
          </span>

          <h3>
            ${escapeHtml(equipo.nombreEquipo || "")}
          </h3>

          <p class="inventory-description">
            ${escapeHtml(equipo.descripcion || "Sin descripción")}
          </p>

          <div class="inventory-data">

            <div>
              <strong>Cantidad</strong>
              <span>${Number(equipo.cantidad || 0)}</span>
            </div>

            <div>
              <strong>Inversión</strong>
              <span>${formatoMoneda(equipo.costoTotal || 0)}</span>
            </div>

          </div>

          <div class="inventory-status">
            <span class="estatus-badge ${claseEstado(equipo.estado)}">
              ${formatearEstado(equipo.estado || "")}
            </span>
          </div>

          ${
            equipo.comprobanteUrl
              ? `
                <a
                  href="${equipo.comprobanteUrl}"
                  target="_blank"
                  rel="noopener"
                  class="inventory-link"
                >
                  Ver comprobante
                </a>
              `
              : ""
          }

        </div>

      </article>
    `;

  });

  contenedor.innerHTML = html;

  actualizarResumenPublico(lista, totalInvertido, totalEntregados);
}

/* ---------------------------------------------------------
   Actualizar indicadores
--------------------------------------------------------- */

function actualizarResumenPublico(
  lista = [],
  totalInvertido = 0,
  totalEntregados = 0
) {

  const totalInvertidoEl = document.getElementById("publicoTotalInvertido");
  const totalEquiposEl = document.getElementById("publicoEquiposRegistrados");
  const totalEntregadosEl = document.getElementById("publicoEquiposEntregados");

  if (totalInvertidoEl) {
    totalInvertidoEl.textContent = formatoMoneda(totalInvertido);
  }

  if (totalEquiposEl) {
    totalEquiposEl.textContent = lista.length;
  }

  if (totalEntregadosEl) {
    totalEntregadosEl.textContent = totalEntregados;
  }
}

/* ---------------------------------------------------------
   Formatos
--------------------------------------------------------- */

function formatoMoneda(valor) {

  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });

}

function escapeHtml(texto) {

  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function formatearCategoria(categoria) {

  const mapa = {

    rescate_vehicular: "Rescate vehicular",

    equipo_medico: "Equipo médico",

    proteccion_personal: "Protección personal",

    radiocomunicacion: "Radiocomunicación",

    herramienta_manual: "Herramienta manual",

    vehiculo_apoyo: "Vehículo de apoyo",

    otro: "Otro"

  };

  return mapa[categoria] || categoria;

}

function formatearEstado(estado) {

  const mapa = {

    solicitado: "Solicitado",

    cotizado: "Cotizado",

    comprado: "Comprado",

    recibido: "Recibido",

    entregado: "Entregado",

    en_uso: "En uso",

    mantenimiento: "Mantenimiento",

    baja: "Baja"

  };

  return mapa[estado] || estado;

}

function claseEstado(estado) {

  if (estado === "entregado" || estado === "en_uso") {
    return "al-dia";
  }

  if (estado === "comprado" || estado === "recibido") {
    return "adelantado";
  }

  if (estado === "mantenimiento" || estado === "baja") {
    return "atrasado";
  }

  return "pendiente";

}
