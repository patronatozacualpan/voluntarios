/* =========================================================
   inventario.js
   Inventario, entrega de equipo y transparencia
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

let expedienteActual = null;

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

   
  const proveedor = sanitizarTexto(
  document.getElementById("proveedorEquipo").value
);

const fuentePago =
  document.getElementById(
    "fuentePagoEquipo"
  ).value;

const estado =
  document.getElementById("estadoEquipo").value;
   
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


/* =========================================
   FOTO EQUIPO
========================================= */

if (fotoArchivo) {

  fotoEquipoRuta =
    `inventario/equipo/${anio}/${mes}/${equipoIdTemporal}`;

  const subidaFoto =
    await subirArchivoStorage({

      archivo: fotoArchivo,
      ruta: fotoEquipoRuta

    });

  if (subidaFoto.ok) {

    fotoEquipoUrl =
      subidaFoto.url;

  }

}


/* =========================================
   COMPROBANTE
========================================= */

if (comprobanteArchivo) {

  comprobanteRuta =
    `inventario/comprobantes/${anio}/${mes}/${equipoIdTemporal}`;

 const subidaComprobante =
  await subirArchivoStorage({

    archivo: comprobanteArchivo,
    ruta: comprobanteRuta

  });

if (subidaComprobante.ok) {

  comprobanteUrl =
    subidaComprobante.url;

}

}

     /* =========================================
   GENERAR FOLIO INVENTARIO
========================================= */

async function generarFolioInventario() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  const { db } =
    firebaseTools;

  const snap =
    await db
      .collection(
        "inventario_equipo"
      )
      .orderBy(
        "folioInventarioNumero",
        "desc"
      )
      .limit(1)
      .get();

  if (snap.empty) {

    return 1;

  }

  const ultimo =
    snap.docs[0].data();

  return (
    Number(
      ultimo.folioInventarioNumero || 0
    ) + 1
  );

}
const folioInventarioNumero =
  await generarFolioInventario();

const folioInventario =
  "INV-" +
  String(
    folioInventarioNumero
  ).padStart(3, "0");

     
     const equipo = {
      nombreEquipo,
         folioInventario,
  folioInventarioNumero,
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
      egresoGenerado: true,
      creadoEn: obtenerTimestampServidor(),
      actualizadoEn: obtenerTimestampServidor(),
       fotoPendiente: !!fotoArchivo,
comprobantePendiente: !!comprobanteArchivo,
    };

const docRef = await db.collection("inventario_equipo").add(equipo);

/* =========================================
   EGRESO AUTOMATICO DESDE INVENTARIO
========================================= */

await db.collection("egresos").add({

  concepto:
    `Adquisición de equipo: ${nombreEquipo}`,

  descripcion:
    descripcion || nombreEquipo,

  categoria:
    "equipo_proteccion_civil",

  monto:
    costoTotal,

  fuentePago:
    fuentePago,

  proveedor:
    proveedor || "",

  inventarioEquipoId:
    docRef.id,

  folioInventario:
    folioInventario,

  tipo:
    "inventario",

  comprobanteUrl:
    comprobanteUrl || "",

  comprobantePendiente:
    !comprobanteUrl,

  registradoPorUid:
    usuario.uid,

  registradoPorNombre:
    usuario.nombre,

  creadoAutomaticamente:
    true,

  creadoEn:
    obtenerTimestampServidor()

});
     

     

     
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
        <td>
${d.comprobanteUrl
? `<a href="${d.comprobanteUrl}" target="_blank" rel="noopener">Ver comprobante</a>`
: "Sin comprobante"}
</td>

<td>
${d.estado === "entregado"
? `<button onclick="verEntrega('${doc.id}')" class="btn-primary">Ver entrega</button>`
: "Pendiente"}
</td>
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




async function verEntrega(id) {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } =
    firebaseTools;

  const docSnap =
    await db
      .collection(
        "inventario_equipo"
      )
      .doc(id)
      .get();

  if (!docSnap.exists) {

    alert(
      "Registro no encontrado"
    );

    return;
  }

  const d =
    docSnap.data();

   expedienteActual = d;
   
  const contenedor =
    document.getElementById(
      "contenidoExpedienteEntrega"
    );

  if (!contenedor) {

    alert(
      "No existe contenidoExpedienteEntrega"
    );

    return;
  }

  contenedor.innerHTML = `

    <div style="display:grid;gap:20px;">

      <div>

        <h3>
          ${d.nombreEquipo || "-"}
        </h3>

        <p>
          Estado:
          <strong>
            ${d.estado || "-"}
          </strong>
        </p>

        <p>
          Categoría:
          ${formatearCategoria(
            d.categoria || ""
          )}
        </p>

        <p>
          Costo:
          ${formatoMoneda(
            d.costoTotal || 0
          )}
        </p>

      </div>

      <hr>

      <div>

        <h3>
          Foto del equipo
        </h3>

        ${
          d.fotoEquipoUrl
          ? `
            <img
              src="${d.fotoEquipoUrl}"
              style="
                max-width:100%;
                border-radius:12px;
              "
            >
          `
          : "Sin fotografía"
        }

      </div>

      <hr>

      <div>

        <h3>
          Comprobante de compra
        </h3>

        ${
          d.comprobanteUrl
          ? `
            <a
              href="${d.comprobanteUrl}"
              target="_blank"
            >
              Ver comprobante
            </a>
          `
          : "Sin comprobante"
        }

      </div>

      <hr>

      <div>

      <h3>
  Datos de entrega
</h3>

<p>
  Folio Entrega:
  <strong>
    ${d.folioEntrega || "-"}
  </strong>
</p>

<p>
  Folio Inventario:
  <strong>
    ${d.folioInventario || "-"}
  </strong>
</p>

      <p>
  Fecha:

  ${
    d.fechaEntrega

    ? d.fechaEntrega
        .toDate()
        .toLocaleDateString(
          "es-MX",
          {

            day: "2-digit",

            month: "long",

            year: "numeric"

          }

        )

    : "-"
  }

</p>

       <p>
  Recibido por:
  <strong>
    ${d.recibidoPorNombre || "-"}
  </strong>
</p>

<p>
  Cargo:
  <strong>

    ${
      d.recibidoPorRol ===
      "comandante_operativo"

      ? "Comandante Operativo"

      : (
          d.recibidoPorRol || "-"
        )
    }

  </strong>
</p>

<p>
  Validado por:
  <strong>
    ${d.validadoPorNombre || "-"}
  </strong>
</p>
      </div>

      <hr>

      <div>

        <h3>
          Firma digital
        </h3>

        ${
          d.firmaEntregaUrl
          ? `
            <img
              src="${d.firmaEntregaUrl}"
              style="
                max-width:500px;
                border:1px solid #ddd;
                border-radius:12px;
                background:white;
              "
            >
          `
          : "Sin firma"
        }

      </div>

    </div>

  `;

  document
    .getElementById(
      "modalVerEntrega"
    )
    ?.classList
    .add("activo");

}


function cerrarModalExpediente() {

  document
    .getElementById(
      "modalVerEntrega"
    )
    ?.classList
    .remove("activo");

}



async function descargarResguardoPDF() {

  if (!expedienteActual) {

    alert(
      "No hay expediente cargado."
    );

    return;
  }

  const d =
    expedienteActual;

let fechaEntregaTexto = "-";

try {

  if (d.fechaEntrega?.toDate) {

    fechaEntregaTexto =
      d.fechaEntrega
        .toDate()
        .toLocaleDateString(
          "es-MX",
          {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }
        );

  } else if (d.fechaEntrega) {

    fechaEntregaTexto =
      String(d.fechaEntrega);

  }

} catch (error) {

  fechaEntregaTexto = "-";

}

   
  const {
    jsPDF
  } = window.jspdf;

  const pdf =
    new jsPDF();

  let y = 20;

  pdf.setFontSize(16);

  pdf.text(
    "PATRONATO ZACUALPAN",
    105,
    y,
    { align: "center" }
  );

  y += 8;

  pdf.setFontSize(12);

  pdf.text(
    "RESGUARDO OPERATIVO DE EQUIPO",
    105,
    y,
    { align: "center" }
  );

  y += 20;

  pdf.setFontSize(11);

  pdf.text(
    `Equipo: ${d.nombreEquipo || "-"}`,
    15,
    y
  );

  y += 8;

 pdf.text(
  `Categoría: ${formatearCategoria(d.categoria || "")}`,
  15,
  y
);

  y += 8;

  pdf.text(
    `Cantidad: ${d.cantidad || 0}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Costo: $${Number(
      d.costoTotal || 0
    ).toFixed(2)}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Estado: ${d.estado || "-"}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Folio: ${d.folioEntrega || "-"}`,
    15,
    y
  );


   y += 8;

pdf.text(
  `Fecha: ${fechaEntregaTexto}`,
  15,
  y
);

  y += 8;

pdf.text(
  `Responsable: ${
    d.recibidoPorNombre || "-"
  }`,
  15,
  y
);

  y += 8;

  const cargoTexto =
d.recibidoPorRol ===
"comandante_operativo"

? "Comandante Operativo"

: (d.recibidoPorRol || "-");

pdf.text(
  `Cargo: ${cargoTexto}`,
  15,
  y
);

  y += 20;

  pdf.setFontSize(10);

  pdf.text(
    "El presente documento acredita la entrega del equipo operativo al Comandante Operativo de Proteccion Civil Zacualpan.",
    15,
    y,
    {
      maxWidth: 170
    }
  );

  y += 30;

  pdf.line(
    60,
    y,
    150,
    y
  );

  y += 6;

  pdf.text(
    "Firma digital registrada en sistema",
    105,
    y,
    { align: "center" }
  );

  pdf.save(
    `Resguardo-${d.folioEntrega || "equipo"}.pdf`
  );

}


document.addEventListener(
  "click",
  (e) => {

    if (
      e.target.id ===
      "btnDescargarResguardo"
    ) {

      descargarResguardoPDF();

    }

  }
);





