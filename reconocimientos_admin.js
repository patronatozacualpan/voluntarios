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
  storage,
  obtenerTimestampServidor,
  subirArchivoStorage
} = firebaseTools;
  try {

/* =========================================
   FOTOGRAFÍAS
========================================= */

const fotoBenefactorArchivo =
  document.getElementById("fotoBenefactor")
  ?.files[0] || null;

const fotoApoyoArchivo =
  document.getElementById("fotoApoyo")
  ?.files[0] || null;


    /* =========================================
   VALIDAR IMÁGENES
========================================= */

if (
  fotoBenefactorArchivo &&
  !archivoPermitido(fotoBenefactorArchivo)
){

  alert(
    "La fotografía del benefactor debe ser una imagen."
  );

  return;

}

if (
  fotoApoyoArchivo &&
  !archivoPermitido(fotoApoyoArchivo)
){

  alert(
    "La fotografía del apoyo debe ser una imagen."
  );

  return;

}

/* =========================================
   PREPARAR SUBIDA
========================================= */

const fecha = new Date();

const anio = fecha.getFullYear();

const mes = String(
  fecha.getMonth() + 1
).padStart(2,"0");

const reconocimientoIdTemporal =
  generarIdSimple();

let fotoBenefactorUrl = "";

let fotoBenefactorRuta = "";

let fotoApoyoUrl = "";

let fotoApoyoRuta = "";

/* =========================================
   FOTO BENEFECTOR
========================================= */

if (fotoBenefactorArchivo) {

  fotoBenefactorRuta =
    `reconocimientos/benefactor/${anio}/${mes}/${reconocimientoIdTemporal}`;

 const subidaBenefactor =
  await subirArchivoStorage({
    archivo: fotoBenefactorArchivo,
    ruta: fotoBenefactorRuta
  });

console.log(
  "SUBIDA BENEFECTOR",
  subidaBenefactor
);

  if (subidaBenefactor.ok) {

    fotoBenefactorUrl =
      subidaBenefactor.url;

  }

}

/* =========================================
   FOTO APOYO
========================================= */

if (fotoApoyoArchivo) {

  fotoApoyoRuta =
    `reconocimientos/apoyo/${anio}/${mes}/${reconocimientoIdTemporal}`;

  const subidaApoyo =
  await subirArchivoStorage({
    archivo: fotoApoyoArchivo,
    ruta: fotoApoyoRuta
  });

console.log(
  "SUBIDA APOYO",
  subidaApoyo
);

  if (subidaApoyo.ok) {

    fotoApoyoUrl =
      subidaApoyo.url;

  }

}

    
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

    fotoBenefactorUrl,

fotoBenefactorRuta,

fotoApoyoUrl,

fotoApoyoRuta,

fotoBenefactorPendiente:
  !!fotoBenefactorArchivo,

fotoApoyoPendiente:
  !!fotoApoyoArchivo,


      
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



function generarIdSimple() {

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2,10)}`;

}

function archivoPermitido(archivo){

  const tipos = [

    "image/jpeg",

    "image/png",

    "image/webp"

  ];

  return tipos.includes(
    archivo.type
  );

}


