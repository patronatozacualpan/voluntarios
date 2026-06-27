let reconocimientoEditando = null;


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



let guardandoReconocimiento = false;

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

 if (!firebaseTools?.db) {

  guardandoReconocimiento = false;

  botonGuardar.disabled = false;

  botonGuardar.textContent =
    "💾 Guardar reconocimiento";

  alert(
    "⚠️ Firebase no disponible."
  );

  return;

}

if (!usuario) {

  guardandoReconocimiento = false;

  botonGuardar.disabled = false;

  botonGuardar.textContent =
    "💾 Guardar reconocimiento";

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

  guardandoReconocimiento = false;

  botonGuardar.disabled = false;

  botonGuardar.textContent =
    "💾 Guardar reconocimiento";

  alert(
    "La fotografía del benefactor debe ser una imagen."
  );

  return;

}

if (
  fotoApoyoArchivo &&
  !archivoPermitido(fotoApoyoArchivo)
){

  guardandoReconocimiento = false;

  botonGuardar.disabled = false;

  botonGuardar.textContent =
    "💾 Guardar reconocimiento";

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


let impacto =

"Esta aportación fortalece la capacidad operativa de Protección Civil Zacualpan.";



      switch(d.tipoApoyo){

case "herramienta":

impacto =
"Las herramientas donadas permiten atender emergencias con mayor rapidez y seguridad para beneficio de toda la comunidad.";

break;

case "equipo":

impacto =
"El equipo recibido fortalece la capacidad operativa de Protección Civil Zacualpan para responder oportunamente a situaciones de emergencia.";

break;

case "material":

impacto =
"Los materiales donados contribuyen al mantenimiento y mejoramiento del equipamiento institucional.";

break;

case "combustible":

impacto =
"El combustible donado permite mantener las unidades operativas listas para responder a cualquier emergencia.";

break;

case "servicio":

impacto =
"Los servicios donados representan un valioso ahorro de recursos y fortalecen la operación institucional.";

break;

}
      document.getElementById("expImpacto").textContent =
impacto;
      

      if (d.publicado)
        publicados++;
      else
        ocultos++;

      if (d.destacado)
        destacados++;

      lista.innerHTML += `

<div class="benefactor-card">

<div class="benefactor-header">


<div class="benefactor-foto-principal">

${
d.publicarFotoApoyo &&
d.fotoApoyoUrl

?

`<img
src="${d.fotoApoyoUrl}"
alt="Artículo donado"
>`

:

`<div class="sin-foto">

📦
<br><br>

No existe fotografía
del artículo donado.

</div>`

}

</div>

<div class="estado-benefactor">

${

d.publicarFotoBenefactor

?

"👤 Fotografía personal autorizada"

:

"🔒 El benefactor solicitó no publicar su fotografía."

}

</div>

<div class="benefactor-info">

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

async function editarBenefactor(id){

try{

const {db}=window.PCZ_FIREBASE;

const doc=await db
.collection("reconocimientos")
.doc(id)
.get();

if(!doc.exists){

alert("No existe el reconocimiento.");

return;

}

const d=doc.data();

reconocimientoEditando=id;

/*=========================
FORMULARIO
=========================*/

nombreBenefactor.value =
d.nombreBenefactor || "";

empresaBenefactor.value =
d.empresaBenefactor || "";

telefonoBenefactor.value =
d.telefonoBenefactor || "";

poblacionBenefactor.value =
d.poblacionBenefactor || "";

tipoApoyo.value =
d.tipoApoyo || "";

articuloDonado.value =
d.articuloDonado || "";

descripcionApoyo.value =
d.descripcionApoyo || "";

valorEstimado.value =
d.valorEstimado || "";

mensajeAgradecimiento.value =
d.mensajeAgradecimiento || "";

/*=========================
CHECKS
=========================*/

publicarNombre.checked =
!!d.publicarNombre;

publicarFotoBenefactor.checked =
!!d.publicarFotoBenefactor;

publicarFotoApoyo.checked =
!!d.publicarFotoApoyo;

publicado.checked =
!!d.publicado;

destacado.checked =
!!d.destacado;

/*=========================
SUBIR
=========================*/

window.scrollTo({

top:0,

behavior:"smooth"

});

alert("Modo edición activado.");

}catch(error){

console.error(error);

alert("No fue posible cargar el reconocimiento.");

}

}

function destacarBenefactor(id){

alert(id);

}

function ocultarBenefactor(id){

alert(id);

}


function cerrarModalBenefactor(){

document.getElementById(
"modalBenefactor"
).style.display="none";

}



function cerrarModalBenefactor(){

document.getElementById(
"modalBenefactor"
).style.display="none";

}




/* ==========================================================
   EXPEDIENTE DEL BENEFACTOR
========================================================== */

let modalExpediente;
let btnCerrarExpediente;
let btnCerrarBenefactor;

document.addEventListener("DOMContentLoaded",()=>{

modalExpediente =
document.getElementById("modalExpedienteBenefactor");

btnCerrarExpediente =
document.getElementById("cerrarExpedienteBenefactor");

btnCerrarBenefactor =
document.getElementById("btnCerrarBenefactor");

btnCerrarExpediente?.addEventListener(
"click",
cerrarExpedienteBenefactor
);

btnCerrarBenefactor?.addEventListener(
"click",
cerrarExpedienteBenefactor
);

modalExpediente?.addEventListener("click",(e)=>{

if(e.target===modalExpediente){

cerrarExpedienteBenefactor();


  
}

});
  
});

/* ----------------------------------------------------------
   Abrir expediente
---------------------------------------------------------- */

function abrirExpedienteBenefactor(){

if(!modalExpediente)return;

modalExpediente.classList.remove(
"hidden"
);

modalExpediente.classList.add(
"activo"
);

document.body.style.overflow="hidden";

}

/* ----------------------------------------------------------
   Cerrar expediente
---------------------------------------------------------- */

function cerrarExpedienteBenefactor(){

if(!modalExpediente)return;

modalExpediente.classList.remove(
"activo"
);

modalExpediente.classList.add(
"hidden"
);

document.body.style.overflow="auto";

}

/* ----------------------------------------------------------
   Eventos
---------------------------------------------------------- */

btnCerrarExpediente?.addEventListener(

"click",

cerrarExpedienteBenefactor

);

btnCerrarBenefactor?.addEventListener(

"click",

cerrarExpedienteBenefactor

);

modalExpediente?.addEventListener(

"click",

(e)=>{

if(e.target===modalExpediente){

cerrarExpedienteBenefactor();

}

}

);

/* ----------------------------------------------------------
   Escape
---------------------------------------------------------- */

document.addEventListener(

"keydown",

(e)=>{

if(

e.key==="Escape"

&&

modalExpediente?.classList.contains("activo")

){

cerrarExpedienteBenefactor();

}

}

);


/* ==========================================================
   VER BENEFECTOR
========================================================== */

async function verBenefactor(id){

try{

const firebaseTools =
window.PCZ_FIREBASE;

if(!firebaseTools?.db){

alert("Firebase no disponible.");

return;

}

const {db}=firebaseTools;

const doc=await db
.collection("reconocimientos")
.doc(id)
.get();

if(!doc.exists){

alert("No se encontró el reconocimiento.");

return;

}

const d=doc.data();

console.log(d);

/*=====================================
  FOLIO
=====================================*/

document.getElementById("expFolio").textContent =
d.folioReconocimiento || "REC-000";

/*=====================================
  DATOS
=====================================*/

document.getElementById("expNombre").textContent =
d.publicarNombre
? d.nombreBenefactor
: "Benefactor Anónimo";

document.getElementById("expEmpresa").textContent =
d.empresaBenefactor || "-";

document.getElementById("expPoblacion").textContent =
d.poblacionBenefactor || "-";

document.getElementById("expTipo").textContent =
d.tipoApoyo || "-";

document.getElementById("expArticulo").textContent =
d.articuloDonado || "-";

document.getElementById("expDescripcion").textContent =
d.descripcionApoyo || "-";

document.getElementById("expMensaje").textContent =
d.mensajeAgradecimiento || "-";

  document.getElementById("expTipoInfo").textContent =
d.tipoApoyo || "-";

  document.getElementById("expValorInfo").textContent =

Number(d.valorEstimado || 0).toLocaleString(
"es-MX",
{
style:"currency",
currency:"MXN"
}
);

document.getElementById("expEmpresaInfo").textContent =
d.empresaBenefactor || "-";

document.getElementById("expPoblacionInfo").textContent =
d.poblacionBenefactor || "-";

/*=====================================
  VALOR
=====================================*/

document.getElementById("expValor").textContent =

Number(d.valorEstimado || 0)
.toLocaleString("es-MX",{

style:"currency",

currency:"MXN"

});

/*=====================================
  REGISTRÓ
=====================================*/

document.getElementById("expRegistro").textContent =
d.creadoPorNombre || "-";

/*=====================================
  FECHA
=====================================*/

document.getElementById("expFecha").textContent =

d.creadoEn

? d.creadoEn.toDate().toLocaleDateString(
"es-MX",
{
day:"2-digit",
month:"long",
year:"numeric"
}
)

: "-";

/*=====================================
  FOTO DEL APOYO
=====================================*/

const fotoApoyo =
document.getElementById("expFotoApoyo");

fotoApoyo.src =
d.fotoApoyoUrl || "";

/*=====================================
 FOTO BENEFACTOR
=====================================*/

const fotoBenefactor =
document.getElementById("expFotoBenefactor");

const sinFoto =
document.getElementById("expSinFoto");

if(

d.publicarFotoBenefactor &&

d.fotoBenefactorUrl

){

fotoBenefactor.src =
d.fotoBenefactorUrl;

fotoBenefactor.style.display="block";

sinFoto.classList.add("hidden");

}else{

fotoBenefactor.style.display="none";

sinFoto.classList.remove("hidden");

}

/*=====================================
 ESTADO
=====================================*/

document.getElementById("expEstado").textContent =

d.publicado

? "🟢 Publicado"

: "⚪ Oculto";

/*=====================================
 ABRIR
=====================================*/

abrirExpedienteBenefactor();

}catch(error){

console.error(error);

alert("No fue posible cargar el expediente.");

}

}









