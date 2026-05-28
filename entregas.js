/* =====================================================
   entregas.js
   Panel operativo PCZ
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
            onclick="confirmarEntrega('${
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
