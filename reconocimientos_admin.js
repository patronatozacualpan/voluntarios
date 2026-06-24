document.addEventListener(
  "DOMContentLoaded",
  () => {

    const formulario =
      document.getElementById(
        "formReconocimiento"
      );

    if (!formulario) return;

    formulario.addEventListener(
      "submit",
      guardarReconocimiento
    );

  }
);

async function guardarReconocimiento(event) {

  event.preventDefault();

  const firebaseTools =
    window.PCZ_FIREBASE;

  const usuario =
    window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (
    !firebaseTools?.db
  ) {

    alert(
      "⚠️ Firebase no disponible."
    );

    return;

  }

  if (!usuario) {

    alert(
      "⚠️ No hay sesión activa."
    );

    return;

  }

  const {
    db,
    obtenerTimestampServidor
  } = firebaseTools;

  try {

    const reconocimiento = {

      nombreBenefactor:
        document.getElementById(
          "nombreBenefactor"
        ).value.trim(),

      empresaBenefactor:
        document.getElementById(
          "empresaBenefactor"
        ).value.trim(),

      telefonoBenefactor:
        document.getElementById(
          "telefonoBenefactor"
        ).value.trim(),

      tipoApoyo:
        document.getElementById(
          "tipoApoyo"
        ).value,

      articuloDonado:
        document.getElementById(
          "articuloDonado"
        ).value.trim(),

      descripcionApoyo:
        document.getElementById(
          "descripcionApoyo"
        ).value.trim(),

      valorEstimado:
        Number(
          document.getElementById(
            "valorEstimado"
          ).value || 0
        ),

      publicarNombre:
        document.getElementById(
          "publicarNombre"
        ).checked,

      publicarFotoBenefactor:
        document.getElementById(
          "publicarFotoBenefactor"
        ).checked,

      publicarFotoApoyo:
        document.getElementById(
          "publicarFotoApoyo"
        ).checked,

      destacado:
        document.getElementById(
          "destacado"
        ).checked,

      publicado:
        document.getElementById(
          "publicado"
        ).checked,

      mensajeAgradecimiento:
        document.getElementById(
          "mensajeAgradecimiento"
        ).value.trim(),

      fotoBenefactorUrl: "",

      fotoApoyoUrl: "",

      creadoPorUid:
        usuario.uid,

      creadoPorNombre:
        usuario.nombre,

      creadoEn:
        obtenerTimestampServidor(),

      actualizadoEn:
        obtenerTimestampServidor()

    };

    await db
      .collection(
        "reconocimientos"
      )
      .add(
        reconocimiento
      );

    alert(
      "✅ Benefactor registrado correctamente."
    );

    event.target.reset();

  } catch (error) {

    console.error(error);

    alert(
      "⚠️ No se pudo guardar."
    );

  }

}
