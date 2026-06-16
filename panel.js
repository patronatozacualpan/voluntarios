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

setTimeout(() => {

  aplicarPermisosSuscriptores();

  cargarSuscriptoresAvisos();

}, 0);

/* =====================================
   EXPORTAR CSV
===================================== */

const usuario =
  window.PCZ_AUTH
    ?.obtenerUsuarioActivo?.();

if (
  usuario?.rol !==
  "presidente"
) {

  document
    .getElementById(
      "btnExportarSuscriptores"
    )
    ?.remove();

}
   
   const btnExportar =
  document.getElementById(
    "btnExportarSuscriptores"
  );

if (btnExportar) {

  btnExportar.addEventListener(
    "click",
    exportarSuscriptoresCSV
  );
}
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

   

/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(texto) {

  return String(texto || "")

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



/* =====================================================
   CONTROL ROLES SUSCRIPTORES
===================================================== */

function aplicarPermisosSuscriptores() {

  const modulo =
    document.getElementById(
      "moduloSuscriptoresAvisos"
    );

  if (!modulo) return;

  const usuario =
    window.PCZ_USUARIO;

  const rol =
    usuario?.rol || "";

  /* =====================================
     ROLES PERMITIDOS
  ===================================== */

  const permitidos = [

    "presidente",

    "secretario",

    "tesorera"

  ];

  /* =====================================
     OCULTAR
  ===================================== */

  if (!permitidos.includes(rol)) {

    modulo.style.display = "none";

    console.warn(
      "Modulo suscriptores oculto por permisos."
    );
  }
}



/* =====================================================
   EXPORTAR SUSCRIPTORES CSV
===================================================== */

async function exportarSuscriptoresCSV() {

   const usuario =
  window.PCZ_AUTH
    ?.obtenerUsuarioActivo?.();

if (
  usuario?.rol !==
  "presidente"
) {

  alert(
    "Acceso restringido."
  );

  return;

}

  try {

    const firebaseTools =
      window.PCZ_FIREBASE;

    if (!firebaseTools?.db) {

      alert(
        "Firebase no disponible."
      );

      return;
    }

    const { db } = firebaseTools;

    const snap = await db
      .collection(
        "suscriptores_avisos"
      )
      .limit(5000)
      .get();

    if (snap.empty) {

      alert(
        "No hay suscriptores para exportar."
      );

      return;
    }

    /* =====================================
       ENCABEZADOS
    ===================================== */

    let csv =
`Nombre,Telefono,Fecha,Estado\n`;

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
          : "";

      const estado =
        d.activo
          ? "Activo"
          : "Inactivo";

      csv += `"${(d.nombre || "").replace(/"/g,'""')}","${(d.telefono || "").replace(/"/g,'""')}","${fecha}","${estado}"\n`;

    });

    /* =====================================
       CREAR ARCHIVO
    ===================================== */

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "suscriptores_avisos.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  } catch (error) {

    console.error(
      "Error exportando CSV:",
      error
    );

    alert(
      "No se pudo exportar el archivo."
    );
  }
}




/* =====================================================
   CONTROL ROLES SUSCRIPTORES
===================================================== */

function aplicarPermisosSuscriptores() {

  const modulo =
    document.getElementById(
      "moduloSuscriptoresAvisos"
    );

  if (!modulo) return;

  const usuario =
    window.PCZ_USUARIO;

  const rol =
    usuario?.rol || "";

  const permitidos = [

    "presidente",

    "secretario",

    "tesorera"

  ];

  if (!permitidos.includes(rol)) {

    modulo.style.display = "none";

    console.warn(
      "Modulo suscriptores oculto por permisos."
    );
  }
}


/* =====================================================
   CONTROL ACCESOS COMANDANTE OPERATIVO
===================================================== */

function aplicarPermisosPanel() {

   const usuario =
  window.PCZ_USUARIO;

const rol =
  usuario?.rol || "";

const rolesLimitados = [

  "comandante_operativo",

  "vocal1",

  "vocal2"

];

if (
  !rolesLimitados.includes(rol)
) return;

  document
    .querySelectorAll(
      ".solo-directiva"
    )
    .forEach((el) => {

      el.style.display =
        "none";

    });

  const dashboard =
    document.getElementById(
      "dashboardResumen"
    );

  if (dashboard) {

    dashboard.style.display =
      "none";

  }
   
}


