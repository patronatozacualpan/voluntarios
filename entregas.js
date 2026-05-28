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

  const recibidoPor =
    document.getElementById(
      "firmaRecibidoPor"
    )?.value?.trim();

  const claveEntrega =
    document.getElementById(
      "firmaClaveEntrega"
    )?.value?.trim();

  if (!recibidoPor) {

    alert(
      "Escribe quién recibe."
    );

    return;
  }

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
       VALIDAR CLAVE OPERATIVA GLOBAL
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

    /* =====================================
       VALIDAR ROL
    ===================================== */

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
       GENERAR PNG
    ===================================== */

    const firmaBase64 =
      canvasFirma.toDataURL(
        "image/png"
      );

    /* =====================================
       STORAGE
    ===================================== */

    const nombreArchivo =
      `firma-${Date.now()}.png`;

    const ruta =
      `firmas_entrega/${nombreArchivo}`;

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

        recibidoPor,


validadoPorRol:
  usuarioValidador.rol,

validadoPorNombre:
  usuarioValidador.nombre,

firmaEntregaUrl,

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
