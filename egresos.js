/* =========================================================
   egresos.js
   Registro de egresos con comprobante obligatorio
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    protegerModuloTesorera();
    activarFechaActual();
    activarFormularioEgreso();
    cargarEgresosRecientes();
  }, 900);
});

/* ---------------------------------------------------------
   Proteger módulo: solo tesorera
--------------------------------------------------------- */

function protegerModuloTesorera() {
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!usuario) return;

  if (usuario.rol !== "tesorera") {
    alert("⛔ Solo la tesorera puede registrar egresos.");
    window.location.href = "panel.html";
  }
}

/* ---------------------------------------------------------
   Fecha actual por defecto
--------------------------------------------------------- */

function activarFechaActual() {
  const fechaInput = document.getElementById("fechaEgreso");

  if (!fechaInput) return;

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");

  fechaInput.value = `${yyyy}-${mm}-${dd}`;
}

/* ---------------------------------------------------------
   Activar formulario
--------------------------------------------------------- */

function activarFormularioEgreso() {
  const form = document.getElementById("formEgreso");

  if (!form) return;

  form.addEventListener("submit", registrarEgreso);
}

/* ---------------------------------------------------------
   Registrar egreso
--------------------------------------------------------- */

async function registrarEgreso(event) {
  event.preventDefault();

  const firebaseTools = window.PCZ_FIREBASE;
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!firebaseTools?.db || !firebaseTools?.storage) {
    alert("⚠️ Firebase no está configurado correctamente.");
    return;
  }

  if (!usuario || usuario.rol !== "tesorera") {
    alert("⛔ No tienes permiso para registrar egresos.");
    return;
  }

  const {
    db,
    obtenerTimestampServidor,
    sanitizarTexto,
    registrarLog,
    subirArchivoStorage
  } = firebaseTools;

  const concepto = sanitizarTexto(document.getElementById("conceptoEgreso").value);
  const descripcion = sanitizarTexto(document.getElementById("descripcionEgreso").value);
  const monto = Number(document.getElementById("montoEgreso").value || 0);
   const fuentePago = document.getElementById("fuentePagoEgreso").value;
  const fechaEgresoValor = document.getElementById("fechaEgreso").value;
  const archivo = document.getElementById("comprobanteEgreso").files[0];

  if (
  !concepto ||
  monto <= 0 ||
  !fuentePago ||
  !fechaEgresoValor ||
  !archivo
) {
    alert("⚠️ Completa concepto, monto, fuente de pago, fecha y comprobante.");
    return;
  }

  if (!archivoPermitido(archivo)) {
    alert("⚠️ El comprobante debe ser imagen o PDF.");
    return;
  }

  if (archivo.size > 10 * 1024 * 1024) {
    alert("⚠️ El archivo no debe superar 10 MB.");
    return;
  }

  try {
    const egresoIdTemporal = generarIdSimple();
    const extension = obtenerExtensionArchivo(archivo.name);
    const fechaObj = new Date(fechaEgresoValor + "T12:00:00");
    const anio = fechaObj.getFullYear();
    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");

    const rutaComprobante = `comprobantes-egresos/${anio}/${mes}/${egresoIdTemporal}.${extension}`;

    const subida = await subirArchivoStorage({
      archivo,
      ruta: rutaComprobante
    });

    if (!subida.ok) {
      alert("⚠️ No se pudo subir el comprobante.");
      return;
    }

    const egreso = {
      concepto,
      descripcion,
      monto,
      fuentePago,
      fechaEgreso: firebase.firestore.Timestamp.fromDate(fechaObj),
      comprobanteUrl: subida.url,
      comprobanteRuta: rutaComprobante,
      comprobanteTipo: archivo.type || extension,
      registradoPorUid: usuario.uid,
      registradoPorNombre: usuario.nombre,
      creadoEn: obtenerTimestampServidor()
    };

    const docRef = await db.collection("egresos").add(egreso);

    await registrarLog({
      accion: "crear_egreso",
      descripcion: `Egreso registrado: ${concepto} por ${formatoMoneda(monto)}`,
      usuarioUid: usuario.uid,
      usuarioNombre: usuario.nombre,
      modulo: "egresos",
      datos: {
        egresoId: docRef.id,
        concepto,
        monto,
        comprobanteRuta: rutaComprobante
      }
    });

    mostrarMensajeEgreso();

    event.target.reset();
    activarFechaActual();
    await cargarEgresosRecientes();

  } catch (error) {
    console.error("Error registrando egreso:", error);
    alert("⚠️ No se pudo registrar el egreso.");
  }
}

/* ---------------------------------------------------------
   Cargar egresos recientes
--------------------------------------------------------- */

async function cargarEgresosRecientes() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;
  const tbody = document.getElementById("tablaEgresosBody");

  if (!tbody) return;

  try {
    const snap = await db
      .collection("egresos")
      .orderBy("creadoEn", "desc")
      .limit(30)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6">No hay egresos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    snap.forEach((doc) => {
      const d = doc.data();

      const fecha = d.fechaEgreso?.toDate
        ? d.fechaEgreso.toDate().toLocaleDateString("es-MX")
        : "Sin fecha";

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(fecha)}</td>
        <td>${escapeHtml(d.concepto || "")}</td>
        <td>${escapeHtml(d.descripcion || "")}</td>
        <td>${formatoMoneda(d.monto || 0)}</td>
        <td>${escapeHtml(d.registradoPorNombre || "")}</td>
        <td>
          ${
            d.comprobanteUrl
              ? `<a href="${d.comprobanteUrl}" target="_blank" rel="noopener">Ver comprobante</a>`
              : "Sin comprobante"
          }
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error cargando egresos:", error);
    tbody.innerHTML = `<tr><td colspan="6">⚠️ Error cargando egresos.</td></tr>`;
  }
}

/* ---------------------------------------------------------
   Validaciones de archivo
--------------------------------------------------------- */

function archivoPermitido(archivo) {
  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  ];

  return tiposPermitidos.includes(archivo.type);
}

function obtenerExtensionArchivo(nombre) {
  const partes = String(nombre || "").split(".");
  return partes.length > 1 ? partes.pop().toLowerCase() : "bin";
}

/* ---------------------------------------------------------
   Mensaje visual
--------------------------------------------------------- */

function mostrarMensajeEgreso() {
  const mensaje = document.getElementById("mensajeEgreso");

  if (!mensaje) return;

  mensaje.classList.remove("hidden");

  setTimeout(() => {
    mensaje.classList.add("hidden");
  }, 5000);
}

/* ---------------------------------------------------------
   Utilidades
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

function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
