/* =========================================================
   PUBLICACIONES
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    iniciarModuloPublicaciones();

  }
);

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
        storage.ref(ruta);

      await referencia.put(
        imagenArchivo
      );

      imagenUrl =
        await referencia.getDownloadURL();
    }

    /* =====================================
       GUARDAR FIRESTORE
    ===================================== */

    await db
      .collection("publicaciones")
      .add({

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
