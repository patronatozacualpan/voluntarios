/* =========================================================
   ingresos.js
   Registro de ingresos / donaciones
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

let DONADORES_INGRESO_CACHE = [];

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    protegerModuloTesorera();
    cargarDonadoresParaIngreso();
    cargarIngresosRecientes();
    activarFormularioIngreso();
    activarBuscadorDonadoresIngreso();
  }, 900);
});

/* ---------------------------------------------------------
   Proteger módulo: solo tesorera
--------------------------------------------------------- */

function protegerModuloTesorera() {
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!usuario) {
    console.warn("Usuario no autenticado todavía.");
    return;
  }

  if (usuario.rol !== "tesorera") {
    alert("⛔ Solo la tesorera puede registrar ingresos.");
    window.location.href = "panel.html";
  }
}

/* ---------------------------------------------------------
   Cargar donadores para select
--------------------------------------------------------- */

async function cargarDonadoresParaIngreso() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  const { db } = firebaseTools;
  const select = document.getElementById("selectDonadorIngreso");

  if (!select) return;

  try {
    const snap = await db
      .collection("donadores")
      .orderBy("nombre", "asc")
      .get();

    DONADORES_INGRESO_CACHE = [];

    snap.forEach((doc) => {
      const d = doc.data();

      if (d.estadoValidacion !== "descartado") {
        DONADORES_INGRESO_CACHE.push({
          id: doc.id,
          ...d
        });
      }
    });

    pintarSelectDonadores(DONADORES_INGRESO_CACHE);

  } catch (error) {
    console.error("Error cargando donadores:", error);
    select.innerHTML = `<option value="">Error cargando donadores</option>`;
  }
}

function pintarSelectDonadores(lista) {
  const select = document.getElementById("selectDonadorIngreso");

  if (!select) return;

  if (!lista.length) {
    select.innerHTML = `<option value="">No hay donadores disponibles</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecciona un donador</option>`;

  lista.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = `${d.nombre || "Sin nombre"} | ${d.telefono || ""} | ${formatoMoneda(d.promesaMensual || 0)}/mes`;
    select.appendChild(option);
  });
}

/* ---------------------------------------------------------
   Buscador de donadores
--------------------------------------------------------- */

function activarBuscadorDonadoresIngreso() {
  const input = document.getElementById("buscarDonadorIngreso");

  if (!input) return;

  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase().trim();

    const filtrados = DONADORES_INGRESO_CACHE.filter((d) => {
      const base = `${d.nombre || ""} ${d.telefono || ""} ${d.poblacion || ""}`.toLowerCase();
      return base.includes(texto);
    });

    pintarSelectDonadores(filtrados);
  });
}

/* ---------------------------------------------------------
   Activar formulario
--------------------------------------------------------- */

function activarFormularioIngreso() {
  const form = document.getElementById("formIngreso");

  if (!form) return;

  form.addEventListener("submit", registrarIngreso);
}

/* ---------------------------------------------------------
   Registrar ingreso
--------------------------------------------------------- */

async function registrarIngreso(event) {
  event.preventDefault();

  const firebaseTools = window.PCZ_FIREBASE;
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!firebaseTools?.db) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  if (!usuario || usuario.rol !== "tesorera") {
    alert("⛔ No tienes permiso para registrar ingresos.");
    return;
  }

  const {
    db,
    obtenerTimestampServidor,
    formatearFolio,
    registrarLog
  } = firebaseTools;

  const donadorId = document.getElementById("selectDonadorIngreso").value;
  const monto = Number(document.getElementById("montoIngreso").value || 0);
  const formaPago = document.getElementById("formaPagoIngreso").value;
  const nota = document.getElementById("notaIngreso").value.trim();

  if (!donadorId || monto <= 0 || !formaPago) {
    alert("⚠️ Completa donador, monto y forma de pago.");
    return;
  }

  const donador = DONADORES_INGRESO_CACHE.find((d) => d.id === donadorId);

  if (!donador) {
    alert("⚠️ No se encontró el donador seleccionado.");
    return;
  }

  try {
    const folioNumero = await generarFolioIngreso();
    const folioTexto = formatearFolio(folioNumero);

    const fraseRecibo = window.PCZ_RECIBOS?.obtenerFraseRecibo?.() || 
      "Tu generosidad equipa a nuestros héroes voluntarios.";

    const ingreso = {
      folio: folioNumero,
      folioTexto,
      donadorId,
      nombreDonador: donador.nombre || "",
      telefono: donador.telefono || "",
      telefonoNormalizado: donador.telefonoNormalizado || "",
      monto,
      formaPago,
      nota,
      fechaIngreso: obtenerTimestampServidor(),
      registradoPorUid: usuario.uid,
      registradoPorNombre: usuario.nombre,
      reciboUrl: "",
      fraseRecibo,
      creadoEn: obtenerTimestampServidor()
    };

    const ingresoRef = await db.collection("ingresos").add(ingreso);

    await actualizarDonadorDespuesIngreso(donadorId, monto);

    await registrarLog({
      accion: "crear_ingreso",
      descripcion: `Ingreso folio ${folioTexto} por ${formatoMoneda(monto)}`,
      usuarioUid: usuario.uid,
      usuarioNombre: usuario.nombre,
      modulo: "ingresos",
      datos: {
        ingresoId: ingresoRef.id,
        donadorId,
        folioTexto,
        monto
      }
    });

    if (window.PCZ_RECIBOS?.generarReciboPDF) {
      window.PCZ_RECIBOS.generarReciboPDF({
        ...ingreso,
        fechaTexto: new Date().toLocaleDateString("es-MX"),
        nombreTesorera: usuario.nombre
      });
    }

    mostrarMensajeIngreso();

    event.target.reset();

    await cargarDonadoresParaIngreso();
    await cargarIngresosRecientes();

  } catch (error) {
    console.error("Error registrando ingreso:", error);
    alert("⚠️ No se pudo registrar el ingreso.");
  }
}

/* ---------------------------------------------------------
   Generar folio consecutivo
   Nota: en fase futura mover a Cloud Functions para máxima seguridad.
--------------------------------------------------------- */

async function generarFolioIngreso() {
  const { db } = window.PCZ_FIREBASE;

  const configRef = db.collection("config").doc("general");

  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(configRef);

    let ultimoFolio = 0;

    if (doc.exists) {
      ultimoFolio = Number(doc.data().ultimoFolioIngreso || 0);
    }

    const nuevoFolio = ultimoFolio + 1;

    transaction.set(
      configRef,
      {
        ultimoFolioIngreso: nuevoFolio,
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return nuevoFolio;
  });
}

/* ---------------------------------------------------------
   Actualizar donador
--------------------------------------------------------- */

async function actualizarDonadorDespuesIngreso(donadorId, monto) {
  const { db } = window.PCZ_FIREBASE;

  const donadorRef = db.collection("donadores").doc(donadorId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(donadorRef);

    if (!doc.exists) {
      throw new Error("Donador no encontrado.");
    }

    const actual = doc.data();
    const totalActual = Number(actual.totalAportado || 0);
    const nuevoTotal = totalActual + Number(monto || 0);

    transaction.update(donadorRef, {
      totalAportado: nuevoTotal,
      ultimoPago: firebase.firestore.FieldValue.serverTimestamp(),
      estadoValidacion: actual.estadoValidacion === "pendiente" ? "validado" : actual.estadoValidacion,
      activo: true,
      actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}

/* ---------------------------------------------------------
   Cargar ingresos recientes
--------------------------------------------------------- */

async function cargarIngresosRecientes() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;
  const tbody = document.getElementById("tablaIngresosBody");

  if (!tbody) return;

  try {
    const snap = await db
      .collection("ingresos")
      .orderBy("creadoEn", "desc")
      .limit(30)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="8">No hay ingresos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    snap.forEach((doc) => {
      const d = doc.data();

      const fecha = d.fechaIngreso?.toDate
        ? d.fechaIngreso.toDate().toLocaleDateString("es-MX")
        : "Sin fecha";

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(d.folioTexto || "")}</td>
        <td>${escapeHtml(fecha)}</td>
        <td>${escapeHtml(d.nombreDonador || "")}</td>
        <td>${escapeHtml(d.telefono || "")}</td>
        <td>${formatoMoneda(d.monto || 0)}</td>
        <td>${escapeHtml(d.formaPago || "")}</td>
        <td>${escapeHtml(d.registradoPorNombre || "")}</td>
        <td>${d.reciboUrl ? `<a href="${d.reciboUrl}" target="_blank">Ver</a>` : "Generado local"}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error cargando ingresos:", error);
    tbody.innerHTML = `<tr><td colspan="8">⚠️ Error cargando ingresos.</td></tr>`;
  }
}

/* ---------------------------------------------------------
   Mensaje visual
--------------------------------------------------------- */

function mostrarMensajeIngreso() {
  const mensaje = document.getElementById("mensajeIngreso");

  if (!mensaje) return;

  mensaje.classList.remove("hidden");

  setTimeout(() => {
    mensaje.classList.add("hidden");
  }, 5000);
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
