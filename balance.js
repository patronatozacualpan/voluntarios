/* =========================================================
   balance.js
   Balance financiero general
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    protegerModuloBalance();
    inicializarFiltrosBalance();
    activarEventosBalance();
    cargarBalanceGeneral();
  }, 900);
});

/* ---------------------------------------------------------
   Permisos
--------------------------------------------------------- */

function protegerModuloBalance() {
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!usuario) return;

  const rolesPermitidos = [
    "presidente",
    "tesorera",
    "secretario",
    "vocal1",
    "vocal2"
  ];

  if (!rolesPermitidos.includes(usuario.rol)) {
    alert("⛔ No tienes permisos para acceder al balance.");

    window.location.href = "panel.html";
  }
}

/* ---------------------------------------------------------
   Inicializar filtros
--------------------------------------------------------- */

function inicializarFiltrosBalance() {
  const selectAnio = document.getElementById("filtroAnioBalance");

  if (!selectAnio) return;

  const actual = new Date().getFullYear();

  for (let anio = actual; anio >= 2024; anio--) {
    const option = document.createElement("option");

    option.value = String(anio);
    option.textContent = anio;

    selectAnio.appendChild(option);
  }
}

/* ---------------------------------------------------------
   Eventos filtros
--------------------------------------------------------- */

function activarEventosBalance() {
  const filtroMes = document.getElementById("filtroMesBalance");
  const filtroAnio = document.getElementById("filtroAnioBalance");

  filtroMes?.addEventListener("change", cargarBalanceGeneral);
  filtroAnio?.addEventListener("change", cargarBalanceGeneral);
}

/* ---------------------------------------------------------
   Cargar balance general
--------------------------------------------------------- */

async function cargarBalanceGeneral() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  try {
    const [ingresosSnap, egresosSnap, traspasosSnap] = await Promise.all([
      db.collection("ingresos").get(),
      db.collection("egresos").get(),
      db.collection("traspasos").get()
    ]);

    const filtroMes = document.getElementById("filtroMesBalance")?.value;
    const filtroAnio = document.getElementById("filtroAnioBalance")?.value;

    let totalIngresos = 0;
    let totalEgresos = 0;

    let efectivo = 0;
    let banco = 0;

    let ingresosEfectivo = 0;
    let ingresosBanco = 0;

    let egresosEfectivo = 0;
    let egresosBanco = 0;

    /* =====================================================
       INGRESOS
    ===================================================== */

    ingresosSnap.forEach((doc) => {
      const d = doc.data();

      const fecha = d.fechaIngreso?.toDate
        ? d.fechaIngreso.toDate()
        : null;

      if (!fecha) return;

      if (!pasaFiltroFecha(fecha, filtroMes, filtroAnio)) {
        return;
      }

    const monto = Number(d.monto || 0);
const forma = d.formaPago || "";

totalIngresos += monto;

/* =========================================
   EFECTIVO
========================================= */

if (forma === "efectivo") {
  efectivo += monto;
  ingresosEfectivo += monto;
}

/* =========================================
   BANCO / SPIN
========================================= */

if (
  forma === "transferencia_spin" ||
  forma === "deposito_oxxo_spin" ||

  forma === "transferencia" ||
  forma === "deposito" ||
  forma === "spin_oxxo"
) {
  banco += monto;
  ingresosBanco += monto;
}

/* =========================================
   OTROS
========================================= */

if (forma === "otro") {
  banco += monto;
  ingresosBanco += monto;
}
    });

    /* =====================================================
       TRASPASOS
    ===================================================== */

    traspasosSnap.forEach((doc) => {
      const t = doc.data();

      const fecha = t.fechaTraspaso?.toDate
        ? t.fechaTraspaso.toDate()
        : null;

      if (!fecha) return;

      if (!pasaFiltroFecha(fecha, filtroMes, filtroAnio)) {
        return;
      }

      const monto = Number(t.monto || 0);

      if (t.origen === "efectivo") efectivo -= monto;
      if (t.destino === "efectivo") efectivo += monto;

      if (t.origen === "banco") banco -= monto;
      if (t.destino === "banco") banco += monto;
    });

    /* =====================================================
       EGRESOS
    ===================================================== */

    egresosSnap.forEach((doc) => {
      const e = doc.data();

      const fecha = e.fechaEgreso?.toDate
        ? e.fechaEgreso.toDate()
        : null;

      if (!fecha) return;

      if (!pasaFiltroFecha(fecha, filtroMes, filtroAnio)) {
        return;
      }

      const monto = Number(e.monto || 0);
      const fuente = e.fuentePago || "banco";

      totalEgresos += monto;

      if (fuente === "efectivo") {
        efectivo -= monto;
        egresosEfectivo += monto;
      }

  if (

  fuente === "transferencia_spin" ||

  fuente === "deposito_oxxo_spin" ||

  fuente === "transferencia" ||

  fuente === "deposito" ||

  fuente === "spin_oxxo" ||

  fuente === "otro"

) {

  banco -= monto;

  egresosBanco += monto;
}
    });

    const saldoNeto = totalIngresos - totalEgresos;
    const disponible = efectivo + banco;

    pintarDashboardBalance({
      totalIngresos,
      totalEgresos,
      saldoNeto,
      efectivo,
      banco,
      disponible
    });

    pintarTablaResumen({
      ingresosEfectivo,
      ingresosBanco,
      egresosEfectivo,
      egresosBanco,
      disponible
    });

  } catch (error) {
    console.error("Error cargando balance:", error);
  }
}

/* ---------------------------------------------------------
   Pintar dashboard
--------------------------------------------------------- */

function pintarDashboardBalance(data) {
  setTexto("balanceIngresos", formatoMoneda(data.totalIngresos));
  setTexto("balanceEgresos", formatoMoneda(data.totalEgresos));
  setTexto("balanceNeto", formatoMoneda(data.saldoNeto));

  setTexto("balanceEfectivo", formatoMoneda(data.efectivo));
  setTexto("balanceBanco", formatoMoneda(data.banco));
  setTexto("balanceDisponible", formatoMoneda(data.disponible));
}

/* ---------------------------------------------------------
   Tabla resumen
--------------------------------------------------------- */

function pintarTablaResumen(data) {
  const tbody = document.getElementById("tablaBalanceBody");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td>Ingresos en efectivo</td>
      <td>${formatoMoneda(data.ingresosEfectivo)}</td>
    </tr>

    <tr>
      <td>Ingresos en banco</td>
      <td>${formatoMoneda(data.ingresosBanco)}</td>
    </tr>

    <tr>
      <td>Egresos desde efectivo</td>
      <td>${formatoMoneda(data.egresosEfectivo)}</td>
    </tr>

    <tr>
      <td>Egresos desde banco</td>
      <td>${formatoMoneda(data.egresosBanco)}</td>
    </tr>

    <tr>
      <td><strong>Total disponible real</strong></td>
      <td><strong>${formatoMoneda(data.disponible)}</strong></td>
    </tr>
  `;
}

/* ---------------------------------------------------------
   Filtros fecha
--------------------------------------------------------- */

function pasaFiltroFecha(fecha, filtroMes, filtroAnio) {
  if (!(fecha instanceof Date)) return false;

  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();

  if (
    filtroMes !== "" &&
    Number(filtroMes) !== mes
  ) {
    return false;
  }

  if (
    filtroAnio !== "" &&
    Number(filtroAnio) !== anio
  ) {
    return false;
  }

  return true;
}

/* ---------------------------------------------------------
   Utilidades
--------------------------------------------------------- */

function setTexto(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = valor;
  }
}

function formatoMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}
