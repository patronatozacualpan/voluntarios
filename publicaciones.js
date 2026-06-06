/* =========================================================
   PUBLICACIONES
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    iniciarModuloPublicaciones();

    iniciarPreviewImagen();

    cargarPublicacionesRecientes();

  }
);

let PUBLICACION_EDITANDO = null;



/* =========================================================
   INICIAR
========================================================= */

function iniciarModuloPublicaciones() {

  const btnGuardar =
    document.getElementById(
      "btnGuardarPublicacion"
    );

  if (!btnGuardar) return;

  btnGuardar.addEventListener(
    "click",
    guardarPublicacion
  );
}


/* =========================================================
   PREVIEW IMAGEN
========================================================= */

function iniciarPreviewImagen() {

  const input =
    document.getElementById(
      "imagenPublicacion"
    );

  const preview =
    document.getElementById(
      "previewImagenPublicacion"
    );

  if (!input || !preview) return;

  input.addEventListener(
    "change",
    (e) => {

      const archivo =
        e.target.files?.[0];

      if (!archivo) {

        preview.style.display =
          "none";

        preview.src = "";

        return;
      }

      const lector =
        new FileReader();

      lector.onload = (evento) => {

        preview.src =
          evento.target.result;

        preview.style.display =
          "block";
      };

      lector.readAsDataURL(
        archivo
      );
    }
  );
}


/* =========================================================
   GUARDAR PUBLICACION
========================================================= */

async function guardarPublicacion() {

  try {

    const firebaseTools =
      window.PCZ_FIREBASE;

    if (!firebaseTools?.db) {

      alert(
        "Firebase no disponible."
      );

      return;
    }

    const {
      db,
      storage
    } = firebaseTools;

const tipoPublicacion =
  document.getElementById(
    "tipoPublicacion"
  )?.value || "aviso";
     
    /* =====================================
       CAMPOS
    ===================================== */

    const titulo =
      document.getElementById(
        "tituloPublicacion"
      )?.value?.trim();

    const descripcion =
      document.getElementById(
        "descripcionPublicacion"
      )?.value?.trim();

    const activa =
      document.getElementById(
        "publicacionActiva"
      )?.checked;

    const publico =
      document.getElementById(
        "publicacionPublica"
      )?.checked;

    const imagenArchivo =
      document.getElementById(
        "imagenPublicacion"
      )?.files?.[0];

    /* =====================================
       VALIDAR
    ===================================== */

    if (!titulo) {

      alert(
        "Escribe el título."
      );

      return;
    }

    if (!descripcion) {

      alert(
        "Escribe la descripción."
      );

      return;
    }

    /* =====================================
       IMAGEN
    ===================================== */

    let imagenUrl = "";

    if (imagenArchivo) {

      const ahora = new Date();

      const anio =
        ahora.getFullYear();

      const mes =
        String(
          ahora.getMonth() + 1
        ).padStart(2, "0");

      const nombreArchivo =
        Date.now() +
        "_" +
        imagenArchivo.name;

      const ruta =
        `publicaciones/${anio}/${mes}/${nombreArchivo}`;

   
const referencia =
storage.ref().child(ruta);

      await referencia.put(
        imagenArchivo
      );

      imagenUrl =
        await referencia.getDownloadURL();
    }

    /* =====================================
       GUARDAR FIRESTORE
    ===================================== */

 const datosPublicacion = {

  titulo,
  descripcion,
  imagenUrl,

  activa,
  publico,

  tipoPublicacion,

  actualizadoEn:
    firebase.firestore.FieldValue.serverTimestamp()
};

if (PUBLICACION_EDITANDO) {

  await db
    .collection("publicaciones")
    .doc(PUBLICACION_EDITANDO)
    .update(datosPublicacion);

} else {

  datosPublicacion.creadoEn =
    firebase.firestore.FieldValue.serverTimestamp();

  await db
    .collection("publicaciones")
    .add(datosPublicacion);
}

    tipoPublicacion,

    titulo,

    descripcion,

    imagenUrl,

    activa,

    publico,

    creadoEn:
      firebase.firestore.FieldValue.serverTimestamp()

  });

    /* =====================================
       LIMPIAR
    ===================================== */

    document.getElementById(
      "tituloPublicacion"
    ).value = "";

    document.getElementById(
      "descripcionPublicacion"
    ).value = "";

    document.getElementById(
      "imagenPublicacion"
    ).value = "";

    alert(
      "Publicación guardada correctamente."
    );

cargarPublicacionesRecientes();
     
  } catch (error) {

    console.error(
      "Error guardando publicación:",
      error
    );

    alert(
      "No se pudo guardar la publicación."
    );
  }
}



/* =========================================================
   PUBLICACIONES RECIENTES
========================================================= */

async function cargarPublicacionesRecientes() {

  try {

    const firebaseTools =
      window.PCZ_FIREBASE;

    if (!firebaseTools?.db) return;

    const { db } = firebaseTools;

    const tabla =
      document.getElementById(
        "tablaPublicaciones"
      );

    if (!tabla) return;

    const snap = await db
      .collection("publicaciones")
      .orderBy(
        "creadoEn",
        "desc"
      )
      .limit(20)
      .get();

    if (snap.empty) {

      tabla.innerHTML = `

        <tr>

          <td colspan="5">

            No hay publicaciones.

          </td>

        </tr>

      `;

      return;
    }

    tabla.innerHTML = "";

    snap.forEach((doc) => {

      const d = doc.data();

      const fecha =
        d.creadoEn?.toDate
          ? d.creadoEn
              .toDate()
              .toLocaleDateString("es-MX")
          : "-";

      tabla.innerHTML += `

        <tr>

          <td>${fecha}</td>

          <td>${escapeHtml(
            d.titulo || ""
          )}</td>

          <td>${escapeHtml(
            d.tipoPublicacion || "-"
          )}</td>

          <td>

            ${
              d.activa
                ? "✅ Activa"
                : "❌ Inactiva"
            }

          </td>

         <td>

  <button
    class="secondary-btn"
    onclick="editarPublicacion('${doc.id}')"
  >
    Editar
  </button>

  <button
    class="secondary-btn"
    onclick="eliminarPublicacion('${doc.id}')"
  >
    Eliminar
  </button>

</td>


        </tr>

      `;

    });

  } catch (error) {

    console.error(
      "Error cargando publicaciones:",
      error
    );
  }
}


/* =========================================================
   ELIMINAR PUBLICACION
========================================================= */

async function eliminarPublicacion(id) {

  try {

    const confirmar =
      confirm(
        "¿Eliminar publicación?"
      );

    if (!confirmar) return;

    const firebaseTools =
      window.PCZ_FIREBASE;

    const { db } =
      firebaseTools;

    await db
      .collection("publicaciones")
      .doc(id)
      .delete();

    alert(
      "Publicación eliminada."
    );

    cargarPublicacionesRecientes();

  } catch (error) {

    console.error(error);

    alert(
      "No se pudo eliminar."
    );
  }
}


function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



async function editarPublicacion(id) {

  try {

    const db =
      window.PCZ_FIREBASE.db;

    const doc =
      await db
        .collection("publicaciones")
        .doc(id)
        .get();

    if (!doc.exists) {

      alert(
        "Publicación no encontrada."
      );

      return;
    }

    const data =
      doc.data();

    document.getElementById(
      "tituloPublicacion"
    ).value =
      data.titulo || "";

    document.getElementById(
      "descripcionPublicacion"
    ).value =
      data.descripcion || "";

    document.getElementById(
      "publicacionActiva"
    ).checked =
      data.activa !== false;

    document.getElementById(
      "publicacionPublica"
    ).checked =
      data.publico !== false;

    if (
      document.getElementById(
        "tipoPublicacion"
      )
    ) {

      document.getElementById(
        "tipoPublicacion"
      ).value =
        data.tipoPublicacion || "aviso";
    }

    PUBLICACION_EDITANDO = id;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(error);

    alert(
      "No se pudo abrir la publicación."
    );
  }
}


