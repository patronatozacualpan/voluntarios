/* =========================================================
   transparencia.js
   Transparencia y Participación Comunitaria
   Patronato Zacualpan
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
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
      inventarioSnap
    ] = await Promise.all([

      db.collection("ingresos").get(),

      db.collection("inventario_equipo")
        .where("publico", "==", true)
        .get()

    ]);

    let totalIngresos = 0;

    let totalEquipos = 0;

    let equiposEntregados = 0;

    /* =========================================
       INGRESOS
    ========================================= */

    ingresosSnap.forEach((doc) => {

      const d = doc.data();

      totalIngresos += Number(d.monto || 0);

    });

    /* =========================================
       INVENTARIO
    ========================================= */

    inventarioSnap.forEach((doc) => {

      const d = doc.data();

      totalEquipos += Number(d.cantidad || 0);

      if (
        d.estado === "entregado" ||
        d.estado === "en_uso"
      ) {
        equiposEntregados += Number(
          d.cantidad || 0
        );
      }

    });

    /* =========================================
       PINTAR
    ========================================= */

    setTexto(
      "tpTotalIngresos",
      formatoMoneda(totalIngresos)
    );

    setTexto(
      "tpTotalEquipos",
      totalEquipos
    );

    setTexto(
      "tpEquiposEntregados",
      equiposEntregados
    );

  } catch (error) {

    console.error(
      "Error dashboard transparencia:",
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
              <strong>Costo:</strong>
              ${formatoMoneda(
                d.costoTotal || 0
              )}
            </p>

            <p>
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
            </p>

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
      .where("publico", "==", true)
      .where("activa", "==", true)
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
        "inventory-card";

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

            <p>
              <strong>Meta:</strong>
              ${formatoMoneda(meta)}
            </p>

            <p>
              <strong>Recaudado:</strong>
              ${formatoMoneda(actual)}
            </p>

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


