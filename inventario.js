/* =========================================================
   inventario.js
   Inventario, entrega de equipo y transparencia
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    protegerModuloInventario();
    activarFormularioInventario();
    cargarInventario();
  }, 900);
});

/* ---------------------------------------------------------
   Permisos
--------------------------------------------------------- */

function protegerModuloInventario() {
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
    alert("⛔ No tienes permiso para ver inventario.");
    window.location.href = "panel.html";
  }

  const form = document.getElementById("formInventario");

  if (form && usuario.rol !== "tesorera") {
    form.classList.add("hidden");
  }
}

/* ---------------------------------------------------------
   Activar formulario
--------------------------------------------------------- */

function activarFormularioInventario() {
  const form = document.getElementById("formInventario");

  if (!form) return;

  form.addEventListener("submit", registrarEquipo);
}

/* ---------------------------------------------------------
   Registrar equipo
--------------------------------------------------------- */

async function registrarEquipo(event) {
  event.preventDefault();

  const firebaseTools = window.PCZ_FIREBASE;
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!firebaseTools?.db || !firebaseTools?.storage) {
    alert("⚠️ Firebase no está configurado correctamente.");
    return;
  }

  if (!usuario || usuario.rol !== "tesorera") {
    alert("⛔ Solo la tesorera puede registrar equipo.");
    return;
  }

  const {
    db,
    obtenerTimestampServidor,
    sanitizarTexto,
    subirArchivoStorage,
    registrarLog
  } = firebaseTools;

  const nombreEquipo = sanitizarTexto(document.getElementById("nombreEquipo").value);
  const categoria = document.getElementById("categoriaEquipo").value;
  const descripcion = sanitizarTexto(document.getElementById("descripcionEquipo").value);
  const cantidad = Number(document.getElementById("cantidadEquipo").value || 0);
  const costoTotal = Number(document.getElementById("costoEquipo").value || 0);
  const proveedor = sanitizarTexto(document.getElementById("proveedorEquipo").value);
  const estado = document.getElementById("estadoEquipo").value;
  const publico = document.getElementById("publicoEquipo")?.checked || false;

  const fotoArchivo = document.getElementById("fotoEquipo")?.files[0] || null;
  const comprobanteArchivo = document.getElementById("comprobanteEquipo")?.files[0] || null;

  if (!nombreEquipo || !categoria || cantidad <= 0 || costoTotal <= 0 || !estado) {
    alert("⚠️ Completa nombre, categoría, cantidad, costo y estado.");
    return;
  }

  if (fotoArchivo && !archivoPermitido(fotoArchivo)) {
    alert("⚠️ La foto del equipo debe ser imagen.");
    return;
  }

  if (comprobanteArchivo && !archivoPermitido(comprobanteArchivo)) {
    alert("⚠️ El comprobante debe ser imagen o PDF.");
    return;
  }

  try {
    const equipoIdTemporal = generarIdSimple();
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");

    let fotoEquipoUrl = "";
    let fotoEquipoRuta = "";
    let comprobanteUrl = "";
    let comprobanteRuta = "";

    if (fotoArchivo) {
      const extFoto = obtenerExtensionArchivo(fotoArchivo.name);
      fotoEquipoRuta = `inventario/equipo/${anio}/${mes}/${equipoIdTemporal}.${extFoto}`;

      const subidaFoto = await subirArchivoStorage({
        archivo: fotoArchivo,
        ruta: fotoEquipoRuta
      });

      if (!subidaFoto.ok) {
        alert("⚠️ No se pudo subir la foto del equipo.");
        return;
      }

      fotoEquipoUrl = subidaFoto.url;
    }

    if (comprobanteArchivo) {
      const extComprobante = obtenerExtensionArchivo(comprobanteArchivo.name);
      comprobanteRuta = `inventario/comprobantes/${anio}/${mes}/${equipoIdTemporal}.${extComprobante}`;

      const subidaComprobante = await subirArchivoStorage({
        archivo: comprobanteArchivo,
        ruta: comprobanteRuta
      });

      if (!subidaComprobante.ok) {
        alert("⚠️ No se pudo subir el comprobante.");
        return;
      }

      comprobanteUrl = subidaComprobante.url;
    }

    const equipo = {
      nombreEquipo,
      categoria,
      descripcion,
      cantidad,
      costoTotal,
      proveedor,
      estado,
      publico,
      fotoEquipoUrl,
      fotoEquipoRuta,
      comprobanteUrl,
      comprobanteRuta,
      entregadoA: "",
      recibidoPor: "",
      fechaEntrega: null,
      evidenciaEntregaUrl: "",
      evidenciaEntregaRuta: "",
      notasInternas: "",
      creadoPorUid: usuario.uid,
      creadoPorNombre: usuario.nombre,
      creadoEn: obtenerTimestampServidor(),
      actualizadoEn: obtenerTimestampServidor()
    };

    const docRef = await db.collection("inventario_equipo").add(equipo);

    await registrarLog({
      accion: "registrar_equipo",
      descripcion: `Equipo registrado: ${nombreEquipo}`,
      usuarioUid: usuario.uid,
      usuarioNombre: usuario.nombre,
      modulo: "inventario",
      datos: {
        equipoId: docRef.id,
        nombreEquipo,
        categoria,
        cantidad,
        costoTotal,
        estado,
        publico
      }
    });

    mostrarMensajeInventario();

    event.target.reset();

    await cargarInventario();

  } catch (error) {
    console.error("Error registrando equipo:", error);
    alert("⚠️ No se pudo registrar el equipo.");
  }
}

/* ---------------------------------------------------------
   Cargar inventario
--------------------------------------------------------- */

async function cargarInventario() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;
  const tbody = document.getElementById("tablaInventarioBody");

  if (!tbody) return;

  try {
    const snap = await db
      .collection("inventario_equipo")
      .orderBy("creadoEn", "desc")
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="8">No hay equipo registrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    snap.forEach((doc) => {
      const d = doc.data();

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(d.nombreEquipo || "")}</td>
        <td>${formatearCategoria(d.categoria || "")}</td>
        <td>${Number(d.cantidad || 0)}</td>
        <td>${formatoMoneda(d.costoTotal || 0)}</td>
        <td><span class="estatus-badge ${claseEstado(d.estado)}">${formatearEstado(d.estado || "")}</span></td>
        <td>${d.publico ? "Sí" : "No"}</td>
        <td>${d.fotoEquipoUrl ? `<a href="${d.fotoEquipoUrl}" target="_blank" rel="noopener">Ver foto</a>` : "Sin foto"}</td>
        <td>${d.comprobanteUrl ? `<a href="${d.comprobanteUrl}" target="_blank" rel="noopener">Ver comprobante</a>` : "Sin comprobante"}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error cargando inventario:", error);
    tbody.innerHTML = `<tr><td colspan="8">⚠️ Error cargando inventario.</td></tr>`;
  }
}

/* ---------------------------------------------------------
   Validar archivos
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

function mostrarMensajeInventario() {
  const mensaje = document.getElementById("mensajeInventario");

  if (!mensaje) return;

  mensaje.classList.remove("hidden");

  setTimeout(() => {
    mensaje.classList.add("hidden");
  }, 5000);
}

/* ---------------------------------------------------------
   Formatos
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
  if (estado === "entregado" || estado === "en_uso") return "al-dia";
  if (estado === "comprado" || estado === "recibido") return "adelantado";
  if (estado === "baja" || estado === "mantenimiento") return "atrasado";
  return "pendiente";
}
