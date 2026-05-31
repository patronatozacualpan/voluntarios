/* =====================================================
   entregas.js
   Panel operativo PCZ
===================================================== */

/* =====================================================
   VARIABLES FIRMA
===================================================== */

let entregaActualId = null;

let canvasFirma = null;

let ctxFirma = null;

let firmando = false;

/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    cargarEntregasPendientes();

  }
);

/* =====================================================
   CARGAR ENTREGAS
===================================================== */
async function cargarEntregasPendientes() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor =
    document.getElementById(
      "contenedorEntregas"
    );

  if (!contenedor) return;

  try {

    const snap = await db
      .collection(
        "inventario_equipo"
      )
      .where(
        "estado",
        "==",
        "recibido"
      )
      .get();

    /* =====================================
       VACIO
    ===================================== */

    if (snap.empty) {

      contenedor.innerHTML = `

        <div class="info-card">

          <h3>
            No hay entregas pendientes.
          </h3>

          <p>
            Todo el equipo ha sido procesado.
          </p>

        </div>

      `;

      return;
    }

    /* =====================================
       LIMPIAR
    ===================================== */

    contenedor.innerHTML = "";

    /* =====================================
       RECORRER
    ===================================== */

    snap.forEach((doc) => {

      const d = doc.data();

      /* =====================================
         IGNORAR ENTREGADOS
      ===================================== */

      if (d.entregadoConfirmado) {
        return;
      }

      const card =
        document.createElement("div");

      card.className =
        "inventory-card";

      card.innerHTML = `

        <div class="inventory-image-wrap">

          <img
            src="${
              d.fotoEquipoUrl || ""
            }"
            class="inventory-image"
          >

        </div>

        <div class="inventory-body">

          <h3>
            ${
              d.nombreEquipo || ""
            }
          </h3>

          <p>
            Categoría:
            ${
              d.categoria || ""
            }
          </p>

          <p>
            Cantidad:
            ${
              d.cantidad || 0
            }
          </p>

          <p>
            Estado:
            ${
              d.estado || ""
            }
          </p>

          <button
            class="btn btn-primary full"
          onclick="abrirModalEntrega('${
  doc.id
}')"
          >
            Confirmar entrega
          </button>

        </div>

      `;

      contenedor.appendChild(card);

    });

  } catch (error) {

    console.error(
      "Error cargando entregas:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <h3>
          Error cargando entregas.
        </h3>

      </div>

    `;
  }
}




/* =====================================================
   ABRIR MODAL
===================================================== */

function abrirModalEntrega(id) {

  entregaActualId = id;

  const modal =
    document.getElementById(
      "modalEntrega"
    );

  modal?.classList.add(
    "activo"
  );

  inicializarCanvasFirma();
}

/* =====================================================
   CERRAR MODAL
===================================================== */

function cerrarModalEntrega() {

  document
    .getElementById(
      "modalEntrega"
    )
    ?.classList.remove(
      "activo"
    );

  limpiarFirma();
}

/* =====================================================
   INICIALIZAR CANVAS
===================================================== */

function inicializarCanvasFirma() {

  canvasFirma =
    document.getElementById(
      "canvasFirma"
    );

  if (!canvasFirma) return;

  ctxFirma =
    canvasFirma.getContext("2d");

  ctxFirma.strokeStyle =
    "#0f172a";

  ctxFirma.lineWidth = 2;

  ctxFirma.lineCap = "round";

  /* =====================================
     MOUSE
  ===================================== */

  canvasFirma.onmousedown =
    iniciarFirma;

  canvasFirma.onmousemove =
    dibujarFirma;

  canvasFirma.onmouseup =
    terminarFirma;

  canvasFirma.onmouseleave =
    terminarFirma;

  /* =====================================
     TOUCH
  ===================================== */

  canvasFirma.ontouchstart =
    iniciarFirmaTouch;

  canvasFirma.ontouchmove =
    dibujarFirmaTouch;

  canvasFirma.ontouchend =
    terminarFirma;
}

/* =====================================================
   INICIAR FIRMA
===================================================== */

function iniciarFirma(e) {

  firmando = true;

  ctxFirma.beginPath();

  ctxFirma.moveTo(
    e.offsetX,
    e.offsetY
  );
}

/* =====================================================
   DIBUJAR
===================================================== */

function dibujarFirma(e) {

  if (!firmando) return;

  ctxFirma.lineTo(
    e.offsetX,
    e.offsetY
  );

  ctxFirma.stroke();
}

/* =====================================================
   TERMINAR
===================================================== */

function terminarFirma() {

  firmando = false;
}

/* =====================================================
   TOUCH START
===================================================== */

function iniciarFirmaTouch(e) {

  e.preventDefault();

  const rect =
    canvasFirma.getBoundingClientRect();

  const touch =
    e.touches[0];

  iniciarFirma({

    offsetX:
      touch.clientX - rect.left,

    offsetY:
      touch.clientY - rect.top
  });
}

/* =====================================================
   TOUCH MOVE
===================================================== */

function dibujarFirmaTouch(e) {

  e.preventDefault();

  const rect =
    canvasFirma.getBoundingClientRect();

  const touch =
    e.touches[0];

  dibujarFirma({

    offsetX:
      touch.clientX - rect.left,

    offsetY:
      touch.clientY - rect.top
  });
}

/* =====================================================
   LIMPIAR FIRMA
===================================================== */

function limpiarFirma() {

  if (!ctxFirma || !canvasFirma)
    return;

  ctxFirma.clearRect(
    0,
    0,
    canvasFirma.width,
    canvasFirma.height
  );
}

/* =====================================================
   BOTONES
===================================================== */

document
  .getElementById(
    "btnCancelarEntrega"
  )
  ?.addEventListener(
    "click",
    cerrarModalEntrega
  );

document
  .getElementById(
    "btnLimpiarFirma"
  )
  ?.addEventListener(
    "click",
    limpiarFirma
  );

     
/* =====================================================
   GUARDAR ENTREGA
===================================================== */

document
  .getElementById(
    "btnGuardarEntrega"
  )
  ?.addEventListener(
    "click",
    guardarEntregaFirmada
  );

/* =====================================================
   GUARDAR ENTREGA FIRMADA
===================================================== */

async function guardarEntregaFirmada() {

const claveEntrega =
document.getElementById(
"firmaClaveEntrega"
)?.value?.trim();


if (!claveEntrega) {


alert(
  "Escribe la clave."
);

return;


}

if (!canvasFirma) {


alert(
  "No hay firma."
);

return;


}

try {


const firebaseTools =
  window.PCZ_FIREBASE;

if (
  !firebaseTools?.db ||
  !firebaseTools?.storage
) {
  return;
}

const {
  db,
  storage
} = firebaseTools;

/* =====================================
   VALIDAR CLAVE OPERATIVA
===================================== */

const usuariosSnap =
  await db
    .collection("usuarios")
    .where(
      "claveOperativa",
      "==",
      claveEntrega
    )
    .limit(1)
    .get();

if (usuariosSnap.empty) {

  alert(
    "⚠️ Clave operativa inválida."
  );

  return;
}

const usuarioValidador =
  usuariosSnap.docs[0].data();

if (
  usuarioValidador.rol !==
  "comandante_operativo"
) {

  alert(
    "⚠️ Esta clave no pertenece al comandante operativo."
  );

  return;
}

/* =====================================
   EXPORTAR FIRMA PNG
===================================== */

const firmaBase64 =
  canvasFirma.toDataURL(
    "image/png"
  );

/* =====================================
   STORAGE
===================================== */

const nombreArchivo =
  "firma-" +
  Date.now() +
  ".png";

const ruta =
  "firmas_entrega/" +
  nombreArchivo;

const storageRef =
  storage
    .ref()
    .child(ruta);

await storageRef.putString(
  firmaBase64,
  "data_url"
);

const firmaEntregaUrl =
  await storageRef.getDownloadURL();

/* =====================================
   ACTUALIZAR INVENTARIO
===================================== */

await db
  .collection(
    "inventario_equipo"
  )
  .doc(
    entregaActualId
  )
  .update({

   entregadoConfirmado:
  true,

recibidoPorNombre:
  usuarioValidador.nombre,

comandanteNombreOficial:
  usuarioValidador.nombre,

comandanteUid:
  usuariosSnap.docs[0].id,

recibidoPorUid:
  usuariosSnap.docs[0].id,

recibidoPorRol:
  usuarioValidador.rol,

validadoPorRol:
  usuarioValidador.rol,

validadoPorNombre:
  usuarioValidador.nombre,

validadoPorUid:
  usuariosSnap.docs[0].id,

claveEntrega:
  claveEntrega,

firmaEntregaUrl:
  firmaEntregaUrl,

folioEntrega:
  "ENT-" + Date.now(),

fechaEntrega:
  firebase.firestore
    .FieldValue
    .serverTimestamp(),

estado:
  "entregado"
  });

alert(
  "✅ Entrega confirmada."
);

cerrarModalEntrega();

cargarEntregasPendientes();


} catch (error) {


console.error(
  "Error guardando entrega:",
  error
);

alert(
  "⚠️ Error guardando entrega."
);


}
}


/* =====================================================
   PDF ENTREGA OPERATIVA
===================================================== */

async function generarPdfEntrega(
  datos
) {

  const {
    jsPDF
  } = window.jspdf;

  const pdf =
    new jsPDF();

  pdf.setFillColor(
    0,
    33,
    71
  );

  pdf.rect(
    0,
    0,
    210,
    25,
    "F"
  );

  pdf.setTextColor(
    255,
    255,
    255
  );

  pdf.setFontSize(16);

  pdf.text(
    "PATRONATO ZACUALPAN",
    105,
    12,
    {
      align: "center"
    }
  );

  pdf.setFontSize(11);

  pdf.text(
    "ACTA DE ENTREGA OPERATIVA",
    105,
    20,
    {
      align: "center"
    }
  );

  pdf.setTextColor(
    0,
    0,
    0
  );

  let y = 40;

  pdf.setFontSize(11);

  pdf.text(
    `Folio Entrega: ${datos.folioEntrega}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Equipo: ${datos.nombreEquipo}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Categoria: ${datos.categoria}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Cantidad: ${datos.cantidad}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Fecha: ${datos.fechaEntrega}`,
    15,
    y
  );

  y += 12;

  pdf.setFontSize(12);

  pdf.text(
    "RESPONSABLE RECEPTOR",
    15,
    y
  );

  y += 8;

  pdf.setFontSize(10);

  pdf.text(
    `Nombre: ${datos.recibidoPorNombre}`,
    15,
    y
  );

  y += 8;

  pdf.text(
    `Cargo: ${datos.recibidoPorRol}`,
    15,
    y
  );

  y += 12;

  pdf.setFontSize(12);

  pdf.text(
    "VALIDACION DIGITAL",
    15,
    y
  );

  y += 8;

  pdf.setFontSize(9);

  const texto = `
La presente entrega fue validada mediante credenciales institucionales y firma digital registrada en el Sistema Institucional del Patronato Zacualpan.

La evidencia queda incorporada al expediente digital permanente de la entrega.

Este documento constituye evidencia administrativa interna de la recepción operativa del equipo.
`;

  const lineas =
    pdf.splitTextToSize(
      texto,
      170
    );

  pdf.text(
    lineas,
    15,
    y
  );

  y +=
    (lineas.length * 4)
    + 15;

  pdf.setFillColor(
    240,
    240,
    240
  );

  pdf.rect(
    15,
    y,
    180,
    10,
    "F"
  );

  pdf.setFontSize(9);

  pdf.text(
    "Firma digital registrada en el sistema institucional.",
    20,
    y + 7
  );

  pdf.save(
    `${datos.folioEntrega}.pdf`
  );

}


