/* =========================================================
   panel.js
   Dashboard Mesa Directiva
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

/* ---------------------------------------------------------
   Cargar dashboard principal
--------------------------------------------------------- */

async function cargarDashboardPanel() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.db) {
    console.warn("Firestore no disponible para cargar dashboard.");
    return;
  }

  const { db, formatearMonedaMXN } = firebaseTools;

  try {
    const [
      ingresosSnap,
      egresosSnap,
      donadoresSnap
    ] = await Promise.all([
      db.collection("ingresos").get(),
      db.collection("egresos").get(),
      db.collection("donadores").get()
    ]);

    let totalIngresos = 0;
    let totalEgresos = 0;

    ingresosSnap.forEach((doc) => {
      const data = doc.data();
      totalIngresos += Number(data.monto || 0);
    });

    egresosSnap.forEach((doc) => {
      const data = doc.data();
      totalEgresos += Number(data.monto || 0);
    });

    const saldoActual = totalIngresos - totalEgresos;
    const totalDonadores = donadoresSnap.size;

    pintarDashboard({
      totalIngresos,
      totalEgresos,
      saldoActual,
      totalDonadores,
      formatearMonedaMXN
    });

  } catch (error) {
    console.error("Error cargando dashboard:", error);
    alert("⚠️ No se pudo cargar el resumen del panel.");
  }
}

/* ---------------------------------------------------------
   Pintar dashboard
--------------------------------------------------------- */

function pintarDashboard({
  totalIngresos,
  totalEgresos,
  saldoActual,
  totalDonadores,
  formatearMonedaMXN
}) {
  const elIngresos = document.getElementById("totalIngresos");
  const elEgresos = document.getElementById("totalEgresos");
  const elSaldo = document.getElementById("saldoActual");
  const elDonadores = document.getElementById("totalDonadores");

  if (elIngresos) elIngresos.textContent = formatearMonedaMXN(totalIngresos);
  if (elEgresos) elEgresos.textContent = formatearMonedaMXN(totalEgresos);
  if (elSaldo) elSaldo.textContent = formatearMonedaMXN(saldoActual);
  if (elDonadores) elDonadores.textContent = totalDonadores;
}

/* ---------------------------------------------------------
   Cargar usuario desde localStorage si ya existe
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const usuarioLocal = localStorage.getItem("pcz_usuario");

  if (usuarioLocal) {
    try {
      window.PCZ_USUARIO = JSON.parse(usuarioLocal);
    } catch {
      window.PCZ_USUARIO = null;
      
    }
  }
   cargarSuscriptoresAvisos();
});

/* ---------------------------------------------------------
   Exportar función global
--------------------------------------------------------- */

window.cargarDashboardPanel = cargarDashboardPanel;




/* =====================================================
   SUSCRIPTORES AVISOS
===================================================== */

async function cargarSuscriptoresAvisos() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const tabla =
    document.getElementById(
      "tablaSuscriptoresAvisos"
    );

  const total =
    document.getElementById(
      "totalSuscriptoresAvisos"
    );

  if (!tabla || !total) return;

  try {

    const snap = await db
      .collection(
        "suscriptores_avisos"
      )
     const snap = await db
  .collection(
    "suscriptores_avisos"
  )
  .limit(100)
  .get();
      .limit(100)
      .get();

    /* =====================================
       VACIO
    ===================================== */

    if (snap.empty) {

      tabla.innerHTML = `

        <tr>

          <td colspan="4">

            No hay suscriptores registrados.

          </td>

        </tr>

      `;

      total.textContent = "0";

      return;
    }

    /* =====================================
       TOTAL
    ===================================== */

    total.textContent =
      snap.size;

    /* =====================================
       LIMPIAR
    ===================================== */

    tabla.innerHTML = "";

    /* =====================================
       RECORRER
    ===================================== */

    snap.forEach((doc) => {

      const d = doc.data();

      const fecha =
        d.fechaRegistro?.toDate
          ? d.fechaRegistro
              .toDate()
              .toLocaleDateString(
                "es-MX"
              )
          : "Sin fecha";

      const estado =
        d.activo
          ? "Activo"
          : "Inactivo";

      const fila =
        document.createElement("tr");

      fila.innerHTML = `

        <td>
          ${escapeHtml(
            d.nombre || ""
          )}
        </td>

        <td>
          ${escapeHtml(
            d.telefono || ""
          )}
        </td>

        <td>
          ${fecha}
        </td>

        <td>

          <span class="
            status-chip
            ${d.activo
              ? "status-entregado"
              : "status-baja"
            }
          ">

            ${estado}

          </span>

        </td>

      `;

      tabla.appendChild(fila);

    });

  } catch (error) {

    console.error(
      "Error cargando suscriptores:",
      error
    );

    tabla.innerHTML = `

      <tr>

        <td colspan="4">

          Error cargando información.

        </td>

      </tr>

    `;
  }
}



