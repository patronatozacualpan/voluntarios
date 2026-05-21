/* =========================================================
   transparencia.js
   Transparencia y Participación Comunitaria
   Patronato Zacualpan
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
     cargarTimelineOperativo();
    cargarDashboardPublico();
    cargarInventarioPublico();
     cargarMetasComunitarias();
  }, 700);
});

/* =========================================================
   DASHBOARD PUBLICO
========================================================= */

async function cargarDashboardPublico() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  try {

    const [
      ingresosSnap,
      egresosSnap,
      inventarioSnap
    ] = await Promise.all([

      db.collection("ingresos").get(),

      db.collection("egresos").get(),

      db.collection("inventario_equipo")
        .where("publico", "==", true)
        .get()

    ]);

    /* =========================================
       INGRESOS
    ========================================= */

    let totalIngresos = 0;

    ingresosSnap.forEach((doc) => {

      const d = doc.data();

      totalIngresos += Number(d.monto || 0);

    });

    /* =========================================
       EGRESOS
    ========================================= */

    let totalEgresos = 0;

    egresosSnap.forEach((doc) => {

      const d = doc.data();

      totalEgresos += Number(d.monto || 0);

    });

    /* =========================================
       INVENTARIO
    ========================================= */

    let equipos = 0;

    let entregados = 0;

    let inversionEquipo = 0;

    inventarioSnap.forEach((doc) => {

      const d = doc.data();

      equipos++;

      inversionEquipo += Number(
        d.costoTotal || 0
      );

      if (d.estado === "entregado") {
        entregados++;
      }

    });

    /* =========================================
       SALDO REAL
    ========================================= */

    const saldoDisponible =
      totalIngresos - totalEgresos;

    /* =========================================
       PINTAR
    ========================================= */

    setTexto(
      "dashboardTotalRecaudado",
      formatoMoneda(totalIngresos)
    );

    setTexto(
      "dashboardEquipoRegistrado",
      equipos
    );

    setTexto(
      "dashboardEquipoEntregado",
      entregados
    );

    setTexto(
      "dashboardParticipacion",
      "Activa"
    );

    /* =========================================
       NUEVAS METRICAS OPCIONALES
    ========================================= */

    setTexto(
      "dashboardInvertido",
      formatoMoneda(inversionEquipo)
    );

    setTexto(
      "dashboardSaldoDisponible",
      formatoMoneda(saldoDisponible)
    );

  } catch (error) {

    console.error(
      "Error cargando dashboard público:",
      error
    );
  }
}

/* =========================================================
   INVENTARIO PUBLICO
========================================================= */

async function cargarInventarioPublico() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor = document.getElementById(
    "contenedorInventarioPublico"
  );

  if (!contenedor) return;

  try {

    const snap = await db
      .collection("inventario_equipo")
      .where("publico", "==", true)
      .orderBy("creadoEn", "desc")
      .limit(20)
      .get();

    if (snap.empty) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            Aún no hay equipo público registrado.
          </p>

        </div>

      `;

      return;
    }

    contenedor.innerHTML = "";

    snap.forEach((doc) => {

      const d = doc.data();

      const card = document.createElement("div");

      card.className = "inventory-card";

      card.innerHTML = `

        <!-- =====================================
             IMAGEN / PLACEHOLDER
        ====================================== -->

        <div class="inventory-image-placeholder">

          ${
            d.fotoEquipoUrl

              ? `

                <img
                  src="${d.fotoEquipoUrl}"
                  alt="Equipo"
                  class="inventory-image"
                >

              `

              : `

                <div class="inventory-placeholder-content">

                  <div class="inventory-placeholder-icon">
                    🛡️
                  </div>

                  <p>
                    Evidencia visual
                    pendiente de documentación
                  </p>

                </div>

              `
          }

        </div>

        <!-- =====================================
             CONTENIDO
        ====================================== -->

        <div class="inventory-card-body">

          <p class="section-label">
            ${escapeHtml(
              formatearCategoria(
                d.categoria || ""
              )
            )}
          </p>

          <h3>
            ${escapeHtml(
              d.nombreEquipo || ""
            )}
          </h3>

          <p class="inventory-description">
            ${
              escapeHtml(
                d.descripcion || ""
              ) || "Sin descripción."
            }
          </p>

          <div class="inventory-data">

            <p>
              <strong>Cantidad:</strong>
              ${Number(d.cantidad || 0)}
            </p>

            <p>
              <strong>Inversión:</strong>
              ${formatoMoneda(
                d.costoTotal || 0
              )}
            </p>

            <div
              class="
                status-chip
                status-${d.estado || ""}
              "
            >
              ${escapeHtml(
                formatearEstado(
                  d.estado || ""
                )
              )}
            </div>

          </div>

        </div>

      `;

      contenedor.appendChild(card);

    });

  } catch (error) {

    console.error(
      "Error cargando inventario público:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudo cargar la
          información pública.
        </p>

      </div>

    `;
  }
}

/* =========================================================
   FORMATOS
========================================================= */

function setTexto(id, valor) {

  const el = document.getElementById(id);

  if (el) {
    el.textContent = valor;
  }
}

function formatoMoneda(valor) {

  return Number(valor || 0)
    .toLocaleString("es-MX", {
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

    rescate_vehicular:
      "Rescate vehicular",

    equipo_medico:
      "Equipo médico",

    proteccion_personal:
      "Protección personal",

    radiocomunicacion:
      "Radiocomunicación",

    herramienta_manual:
      "Herramienta manual",

    vehiculo_apoyo:
      "Vehículo de apoyo",

    otro:
      "Otro"

  };

  return mapa[categoria] || categoria;
}

function formatearEstado(estado) {

  const mapa = {

    solicitado:
      "Solicitado",

    cotizado:
      "Cotizado",

    comprado:
      "Comprado",

    recibido:
      "Recibido",

    entregado:
      "Entregado",

    en_uso:
      "En uso",

    mantenimiento:
      "Mantenimiento",

    baja:
      "Baja"
  };

  return mapa[estado] || estado;
}


/* =========================================================
   METAS COMUNITARIAS
========================================================= */

async function cargarMetasComunitarias() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor =
    document.getElementById(
      "contenedorMetas"
    );

  if (!contenedor) return;

  try {

    const snap = await db
     .collection("metas_comunitarias")
.limit(12)
.get();

    if (snap.empty) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            No hay metas activas
            por el momento.
          </p>

        </div>

      `;

      return;
    }

    contenedor.innerHTML = "";

    snap.forEach((doc) => {

      const d = doc.data();

      const meta =
        Number(d.montoMeta || 0);

      const actual =
        Number(d.montoActual || 0);

      const porcentaje =
        meta > 0
          ? Math.min(
              100,
              (actual / meta) * 100
            )
          : 0;

      const card =
        document.createElement("div");

      card.className =
  "inventory-card meta-card";

      card.innerHTML = `

        <div class="inventory-card-body">

          <p class="section-label">
            Meta comunitaria
          </p>

          <h3>
            ${escapeHtml(
              d.titulo || ""
            )}
          </h3>

          <p class="inventory-description">
            ${escapeHtml(
              d.descripcion || ""
            )}
          </p>

         <div class="inventory-data">

  <div class="meta-stat">

    <strong>Meta</strong>

    ${formatoMoneda(meta)}

  </div>

  <div class="meta-stat">

    <strong>Recaudado</strong>

    ${formatoMoneda(actual)}

  </div>

  <div class="meta-stat">

    <strong>Faltante</strong>

    ${formatoMoneda(
      Math.max(0, meta - actual)
    )}

  </div>

</div>

          <div class="progress-bar">

            <div
              class="progress-fill"
              style="
                width:${porcentaje}%;
              "
            ></div>

          </div>

          <p style="margin-top:10px;">

            <strong>
              ${porcentaje.toFixed(0)}%
            </strong>

            completado

          </p>

        </div>

      `;

      contenedor.appendChild(card);

    });

  } catch (error) {

    console.error(
      "Error cargando metas:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudieron cargar
          las metas comunitarias.
        </p>

      </div>

    `;
  }
}



/* =========================================================
   TIMELINE OPERATIVO
========================================================= */

async function cargarTimelineOperativo() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor =
    document.getElementById(
      "contenedorTimeline"
    );

  if (!contenedor) return;

  try {

    const actividades = [];

    /* =====================================
       INGRESOS
    ===================================== */

    const ingresosSnap = await db
      .collection("ingresos")
      .limit(4)
      .get();

    ingresosSnap.forEach((doc) => {

      const d = doc.data();

      actividades.push({

        tipo: "Ingreso",

        fecha:
          d.creadoEn?.toDate
            ? d.creadoEn.toDate()
            : null,

        texto:
          `Ingreso registrado por ${formatoMoneda(d.monto || 0)}.`

      });

    });

    /* =====================================
       EGRESOS
    ===================================== */

    const egresosSnap = await db
      .collection("egresos")
      .limit(4)
      .get();

    egresosSnap.forEach((doc) => {

      const d = doc.data();

      actividades.push({

        tipo: "Egreso",

        fecha:
          d.creadoEn?.toDate
            ? d.creadoEn.toDate()
            : null,

        texto:
          `Egreso registrado: ${escapeHtml(d.concepto || "")}.`

      });

    });

    /* =====================================
       INVENTARIO
    ===================================== */

    const inventarioSnap = await db
      .collection("inventario_equipo")
      .where("publico", "==", true)
      .limit(4)
      .get();

    inventarioSnap.forEach((doc) => {

      const d = doc.data();

      actividades.push({

        tipo: "Equipo",

        fecha:
          d.creadoEn?.toDate
            ? d.creadoEn.toDate()
            : null,

        texto:
          `Equipo registrado: ${escapeHtml(d.nombreEquipo || "")}.`

      });

    });

    /* =====================================
       ORDENAR
    ===================================== */

    actividades.sort((a, b) => {

      return (
        (b.fecha?.getTime?.() || 0)
        -
        (a.fecha?.getTime?.() || 0)
      );

    });

    const ultimas =
      actividades.slice(0, 8);

    /* =====================================
       VALIDAR
    ===================================== */

    if (!ultimas.length) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            No hay actividad reciente.
          </p>

        </div>

      `;

      return;
    }

    /* =====================================
       PINTAR
    ===================================== */

    contenedor.innerHTML = "";

    ultimas.forEach((item) => {

      const fechaTexto =
        item.fecha
          ? item.fecha.toLocaleDateString("es-MX")
          : "Sin fecha";

      const div =
        document.createElement("div");

      div.className =
        "timeline-item";

      div.innerHTML = `

        <div class="timeline-top">

          <span class="timeline-type">
            ${item.tipo}
          </span>

          <span class="timeline-date">
            ${fechaTexto}
          </span>

        </div>

        <div class="timeline-text">
          ${item.texto}
        </div>

      `;

      contenedor.appendChild(div);

    });

  } catch (error) {

    console.error(
      "Error timeline:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudo cargar la actividad.
        </p>

      </div>

    `;
  }
}
