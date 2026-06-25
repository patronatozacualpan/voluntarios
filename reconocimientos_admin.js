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




/* =========================================
   GENERAR FOLIO RECONOCIMIENTO
========================================= */

async function generarFolioReconocimiento() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  const { db } =
    firebaseTools;

  const snap =
    await db
      .collection("reconocimientos")
      .orderBy(
        "folioNumero",
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
      ultimo.folioNumero || 0
    ) + 1
  );

}





async function guardarReconocimiento(event) {

event.preventDefault();

/* =========================================
   EVITAR DOBLE REGISTRO
========================================= */

const botonGuardar =
  event.target.querySelector(
    'button[type="submit"]'
  );

if (guardandoReconocimiento){

  return;

}

guardandoReconocimiento = true;

botonGuardar.disabled = true;

botonGuardar.textContent =
  "Guardando...";


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


const folioNumero =
  await generarFolioReconocimiento();

const folioReconocimiento =
  "REC-" +
  String(
    folioNumero
  ).padStart(3,"0");

    
    
    const reconocimiento = {
        folioReconocimiento,

        folioNumero,
      nombreBenefactor:
        document.getElementById(
          "nombreBenefactor"
        ).value.trim(),


      
      empresaBenefactor:
        document.getElementById(
          "empresaBenefactor"
        ).value.trim(),


      poblacionBenefactor:
  document.getElementById(
    "poblacionBenefactor"
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

/* =========================================
   REACTIVAR BOTÓN
========================================= */

guardandoReconocimiento = false;

botonGuardar.disabled = false;

botonGuardar.textContent =
  "💾 Guardar reconocimiento";

/* =========================================
   LIMPIAR FORMULARIO
========================================= */

event.target.reset();

} catch (error) {

  console.error(error);

  /* =========================================
     REACTIVAR BOTÓN EN CASO DE ERROR
  ========================================= */

  guardandoReconocimiento = false;

  botonGuardar.disabled = false;

  botonGuardar.textContent =
    "💾 Guardar reconocimiento";

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




/* ==========================================================
   HISTORIAL DE BENEFECTORES
========================================================== */

async function cargarBenefactores() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } =
    firebaseTools;

  const lista =
    document.getElementById(
      "listaBenefactores"
    );

  if (!lista) return;

  lista.innerHTML =
    "<p>Cargando benefactores...</p>";

  try {

    const snap =
      await db
        .collection(
          "reconocimientos"
        )
        .orderBy(
          "creadoEn",
          "desc"
        )
        .get();

    if (snap.empty) {

      lista.innerHTML = `
      <div class="info-card">
      No existen benefactores registrados.
      </div>
      `;

      return;

    }

    let total = 0;
    let publicados = 0;
    let destacados = 0;
    let ocultos = 0;

    lista.innerHTML = "";

    snap.forEach(doc => {

      total++;

      const d =
        doc.data();

      if (d.publicado)
        publicados++;
      else
        ocultos++;

      if (d.destacado)
        destacados++;

      lista.innerHTML += `

<div class="benefactor-card">

<div class="benefactor-header">

<div class="benefactor-foto">

${
d.fotoBenefactorUrl

?

`<img
src="${d.fotoBenefactorUrl}"
>`

:

"👤"

}

</div>

<div>

<div class="benefactor-folio">

🏆 ${d.folioReconocimiento || "Pendiente"}

</div>

<h3>

${d.nombreBenefactor || "Sin nombre"}

</h3>

<p>

${d.articuloDonado || ""}

</p>

<small>

${d.empresaBenefactor || ""}

</small>

</div>

</div>

<div class="benefactor-body">

<p>

<b>Tipo:</b>

${d.tipoApoyo || "-"}

</p>

<p>

<b>Valor:</b>

$${Number(
d.valorEstimado || 0
).toLocaleString("es-MX")}

</p>

<p>

<b>Estado:</b>

${
d.publicado

?

"🟢 Publicado"

:

"⚪ Oculto"

}

${
d.destacado

?

" ⭐"

:

""
}

</p>

</div>

<div class="benefactor-actions">

<button
onclick="verBenefactor('${doc.id}')"
>

👁 Ver

</button>

<button
onclick="editarBenefactor('${doc.id}')"
>

✏ Editar

</button>

<button
onclick="destacarBenefactor('${doc.id}')"
>

⭐

</button>

<button
onclick="ocultarBenefactor('${doc.id}')"
>

🚫

</button>

</div>

</div>

`;

    });

    document.getElementById(
      "totalBenefactores"
    ).textContent =
      total;

    document.getElementById(
      "benefactoresPublicados"
    ).textContent =
      publicados;

    document.getElementById(
      "benefactoresDestacados"
    ).textContent =
      destacados;

    document.getElementById(
      "benefactoresOcultos"
    ).textContent =
      ocultos;

  }

  catch(error){

    console.error(error);

    lista.innerHTML =
      "Error cargando benefactores.";

  }

}



document.addEventListener(
"DOMContentLoaded",
()=>{

cargarBenefactores();

});


function verBenefactor(id){

alert(id);

}

function editarBenefactor(id){

alert(id);

}

function destacarBenefactor(id){

alert(id);

}

function ocultarBenefactor(id){

alert(id);

}


