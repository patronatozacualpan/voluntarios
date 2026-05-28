/* =====================================================
   entregas.js
   Panel operativo PCZ
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
/* =====================================================
   VARIABLES FIRMA
===================================================== */

let entregaActualId = null;

let canvasFirma = null;

let ctxFirma = null;

let firmando = false;
   
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
   CONFIRMAR ENTREGA
===================================================== */

async function confirmarEntrega(id) {

  const recibidoPor =
    prompt(
      "Nombre de quien recibe:"
    );

  if (!recibidoPor) return;

  const claveEntrega =
    prompt(
      "Clave de confirmación:"
    );

  if (!claveEntrega) return;

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  try {

    await db
      .collection(
        "inventario_equipo"
      )
      .doc(id)
      .update({

        entregadoConfirmado: true,

        recibidoPor,

        claveEntrega,

        fechaEntrega:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        estado:
          "entregado"

      });

/* =========================================
   PUBLICACION AUTOMATICA
========================================= */

const docInventario =
  await db
    .collection(
      "inventario_equipo"
    )
    .doc(id)
    .get();

const inventario =
  docInventario.data();

await db
  .collection(
    "publicaciones"
  )
  .add({

    titulo:
      "Entrega operativa confirmada",

    contenido:
      `Se confirmó oficialmente la entrega de "${inventario.nombreEquipo}" para operación de Protección Civil Zacualpan.`,

    tipo:
      "entrega_operativa",

    publico:
      true,

    fecha:
      firebase.firestore
        .FieldValue
        .serverTimestamp(),

    creadoPor:
      recibidoPor,

    referenciaInventario:
      id

  });

     
    alert(
      "✅ Entrega confirmada."
    );

    cargarEntregasPendientes();

  } catch (error) {

    console.error(
      "Error confirmando entrega:",
      error
    );

    alert(
      "⚠️ No se pudo confirmar."
    );
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



