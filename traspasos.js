/* =========================================================
   traspasos.js
   Traspasos internos entre efectivo y banco
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    protegerModuloTraspasos();
    activarFechaActualTraspaso();
    activarFormularioTraspaso();
    cargarTraspasos();
    calcularBalanceOperativo();
  }, 900);
});

/* ---------------------------------------------------------
   Permisos
--------------------------------------------------------- */

function protegerModuloTraspasos() {
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!usuario) return;

  if (usuario.rol !== "tesorera") {
    alert("⛔ Solo la tesorera puede registrar traspasos.");
    window.location.href = "panel.html";
  }
}

/* ---------------------------------------------------------
   Fecha actual
--------------------------------------------------------- */

function activarFechaActualTraspaso() {
  const input = document.getElementById("fechaTraspaso");

  if (!input) return;

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");

  input.value = `${yyyy}-${mm}-${dd}`;
}

/* ---------------------------------------------------------
   Activar formulario
--------------------------------------------------------- */

function activarFormularioTraspaso() {
  const form = document.getElementById("formTraspaso");

  if (!form) return;

  form.addEventListener("submit", registrarTraspaso);
}

/* ---------------------------------------------------------
   Registrar traspaso
--------------------------------------------------------- */

async function registrarTraspaso(event) {
  event.preventDefault();

  const firebaseTools = window.PCZ_FIREBASE;
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!firebaseTools?.db || !firebaseTools?.storage) {
    alert("⚠️ Firebase no está configurado correctamente.");
    return;
  }

  if (!usuario || usuario.rol !== "tesorera") {
    alert("⛔ No tienes permiso para registrar traspasos.");
    return;
  }

  const {
    db,
    obtenerTimestampServidor,
    sanitizarTexto,
    subirArchivoStorage,
    registrarLog
  } = firebaseTools;

  const origen = document.getElementById("origenTraspaso").value;
  const destino = document.getElementById("destinoTraspaso").value;
  const monto = Number(document.getElementById("montoTraspaso").value || 0);
  const fechaValor = document.getElementById("fechaTraspaso").value;
  const nota = sanitizarTexto(document.getElementById("notaTraspaso").value || "");
  const archivo = document.getElementById("comprobanteTraspaso")?.files[0] || null;

  if (!origen || !destino || monto <= 0 || !fechaValor) {
    alert("⚠️ Completa origen, destino, monto y fecha.");
    return;
  }

  if (origen === destino) {
    alert("⚠️ El origen y destino no pueden ser iguales.");
    return;
  }

const balanceActual = await obtenerBalanceActual();

if (
  origen === "efectivo" &&
  monto > balanceActual.efectivo
) {
  alert(
    `⚠️ No hay suficiente efectivo disponible.\n\n` +
    `Disponible actual: ${formatoMoneda(balanceActual.efectivo)}`
  );

  return;
}

if (
  origen === "banco" &&
  monto > balanceActual.banco
) {
  alert(
    `⚠️ No hay suficiente saldo en banco.\n\n` +
    `Disponible actual: ${formatoMoneda(balanceActual.banco)}`
  );

  return;
}
   
  if (archivo) {
    if (!archivoPermitido(archivo)) {
      alert("⚠️ El comprobante debe ser imagen o PDF.");
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      alert("⚠️ El archivo no debe superar 10 MB.");
      return;
    }
  }

  try {
    let comprobanteUrl = "";
    let comprobanteRuta = "";

    const fechaObj = new Date(fechaValor + "T12:00:00");
    const anio = fechaObj.getFullYear();
    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const idTemporal = generarIdSimple();

    if (archivo) {
      const extension = obtenerExtensionArchivo(archivo.name);
      comprobanteRuta = `traspasos/${anio}/${mes}/${idTemporal}.${extension}`;

      const subida = await subirArchivoStorage({
        archivo,
        ruta: comprobanteRuta
      });

      if (!subida.ok) {
        alert("⚠️ No se pudo subir el comprobante.");
        return;
      }

      comprobanteUrl = subida.url;
    }

    const traspaso = {
      origen,
      destino,
      monto,
      fechaTraspaso: firebase.firestore.Timestamp.fromDate(fechaObj),
      nota,
      comprobanteUrl,
      comprobanteRuta,
      registradoPorUid: usuario.uid,
      registradoPorNombre: usuario.nombre,
      creadoEn: obtenerTimestampServidor()
    };

    const docRef = await db.collection("traspasos").add(traspaso);

    if (registrarLog) {
      await registrarLog({
        accion: "crear_traspaso",
        descripcion: `Traspaso de ${formatearCuenta(origen)} a ${formatearCuenta(destino)} por ${formatoMoneda(monto)}`,
        usuarioUid: usuario.uid,
        usuarioNombre: usuario.nombre,
        modulo: "traspasos",
        datos: {
          traspasoId: docRef.id,
          origen,
          destino,
          monto
        }
      });
    }

    mostrarMensajeTraspaso();

    event.target.reset();
    activarFechaActualTraspaso();

    await cargarTraspasos();
    await calcularBalanceOperativo();

  } catch (error) {
    console.error("Error registrando traspaso:", error);
    alert("⚠️ No se pudo registrar el traspaso.");
  }
}

/* ---------------------------------------------------------
   Cargar traspasos
--------------------------------------------------------- */

async function cargarTraspasos() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;
  const tbody = document.getElementById("tablaTraspasosBody");

  if (!tbody) return;

  try {
    const snap = await db
      .collection("traspasos")
      .orderBy("creadoEn", "desc")
      .limit(50)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="7">No hay traspasos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    snap.forEach((doc) => {
      const d = doc.data();

      const fecha = d.fechaTraspaso?.toDate
        ? d.fechaTraspaso.toDate().toLocaleDateString("es-MX")
        : "Sin fecha";

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(fecha)}</td>
        <td>${escapeHtml(formatearCuenta(d.origen || ""))}</td>
        <td>${escapeHtml(formatearCuenta(d.destino || ""))}</td>
        <td>${formatoMoneda(d.monto || 0)}</td>
        <td>${escapeHtml(d.registradoPorNombre || "")}</td>
        <td>${escapeHtml(d.nota || "")}</td>
        <td>
          ${
            d.comprobanteUrl
              ? `<a href="${d.comprobanteUrl}" target="_blank" rel="noopener">Ver</a>`
              : "Sin comprobante"
          }
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error cargando traspasos:", error);
    tbody.innerHTML = `<tr><td colspan="7">⚠️ Error cargando traspasos.</td></tr>`;
  }
}

/* ---------------------------------------------------------
   Calcular balance operativo
--------------------------------------------------------- */

async function calcularBalanceOperativo() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  try {
    const [ingresosSnap, egresosSnap, traspasosSnap] = await Promise.all([
      db.collection("ingresos").get(),
      db.collection("egresos").get(),
      db.collection("traspasos").get()
    ]);

    let efectivo = 0;
    let banco = 0;

    ingresosSnap.forEach((doc) => {
      const d = doc.data();
      const monto = Number(d.monto || 0);
      const forma = d.formaPago || "";

      if (forma === "efectivo") {
        efectivo += monto;
      } else if (
        forma === "transferencia" ||
        forma === "deposito" ||
        forma === "spin_oxxo"
      ) {
        banco += monto;
      }
    });

    traspasosSnap.forEach((doc) => {
      const t = doc.data();
      const monto = Number(t.monto || 0);

      if (t.origen === "efectivo") efectivo -= monto;
      if (t.destino === "efectivo") efectivo += monto;

      if (t.origen === "banco") banco -= monto;
      if (t.destino === "banco") banco += monto;
    });

    egresosSnap.forEach((doc) => {
      const e = doc.data();
      const monto = Number(e.monto || 0);

      // Si el egreso no tiene fuente de pago, por seguridad se descuenta de banco.
      const fuente = e.fuentePago || "banco";

      if (fuente === "efectivo") efectivo -= monto;
      if (fuente === "banco") banco -= monto;
    });

    const total = efectivo + banco;

    pintarBalanceOperativo({
      efectivo,
      banco,
      total
    });

  } catch (error) {
    console.error("Error calculando balance operativo:", error);
  }
}

async function obtenerBalanceActual() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) {
    return {
      efectivo: 0,
      banco: 0,
      total: 0
    };
  }

  const { db } = firebaseTools;

  const [ingresosSnap, egresosSnap, traspasosSnap] = await Promise.all([
    db.collection("ingresos").get(),
    db.collection("egresos").get(),
    db.collection("traspasos").get()
  ]);

  let efectivo = 0;
  let banco = 0;

  /* =========================
     INGRESOS
  ========================= */

  ingresosSnap.forEach((doc) => {
    const d = doc.data();

    const monto = Number(d.monto || 0);
    const forma = d.formaPago || "";

    if (forma === "efectivo") {
      efectivo += monto;
    }

    if (
      forma === "transferencia" ||
      forma === "deposito" ||
      forma === "spin_oxxo"
    ) {
      banco += monto;
    }
  });

  /* =========================
     TRASPASOS
  ========================= */

  traspasosSnap.forEach((doc) => {
    const t = doc.data();
    const monto = Number(t.monto || 0);

    if (t.origen === "efectivo") efectivo -= monto;
    if (t.destino === "efectivo") efectivo += monto;

    if (t.origen === "banco") banco -= monto;
    if (t.destino === "banco") banco += monto;
  });

  /* =========================
     EGRESOS
  ========================= */

  egresosSnap.forEach((doc) => {
    const e = doc.data();

    const monto = Number(e.monto || 0);
    const fuente = e.fuentePago || "banco";

    if (fuente === "efectivo") efectivo -= monto;
    if (fuente === "banco") banco -= monto;
  });

  return {
    efectivo,
    banco,
    total: efectivo + banco
  };
}

function pintarBalanceOperativo({ efectivo, banco, total }) {
  const elEfectivo = document.getElementById("saldoEfectivoReal");
  const elBanco = document.getElementById("saldoBancoReal");
  const elTotal = document.getElementById("saldoDisponibleReal");

  if (elEfectivo) elEfectivo.textContent = formatoMoneda(efectivo);
  if (elBanco) elBanco.textContent = formatoMoneda(banco);
  if (elTotal) elTotal.textContent = formatoMoneda(total);
}

/* ---------------------------------------------------------
   Mensajes
--------------------------------------------------------- */

function mostrarMensajeTraspaso() {
  const mensaje = document.getElementById("mensajeTraspaso");

  if (!mensaje) return;

  mensaje.classList.remove("hidden");

  setTimeout(() => {
    mensaje.classList.add("hidden");
  }, 5000);
}

/* ---------------------------------------------------------
   Archivos
--------------------------------------------------------- */

function archivoPermitido(archivo) {
  const tipos = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  ];

  return tipos.includes(archivo.type);
}

function obtenerExtensionArchivo(nombre) {
  const partes = String(nombre || "").split(".");
  return partes.length > 1 ? partes.pop().toLowerCase() : "bin";
}

/* ---------------------------------------------------------
   Formatos y utilidades
--------------------------------------------------------- */

function generarIdSimple() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatoMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

function formatearCuenta(valor) {
  const mapa = {
    efectivo: "Efectivo en tesorería",
    banco: "Banco / cuenta"
  };

  return mapa[valor] || valor;
}

function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
