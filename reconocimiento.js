/*=========================================================
MURO DE GRATITUD CIUDADANA
Patronato Zacualpan
=========================================================*/

const firebaseTools =
window.PCZ_FIREBASE;

let listaBenefactores;

let totalBenefactores;

/*=========================================================
INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

if(!folio){

alert("No se especificó el reconocimiento.");

return;

}

cargarReconocimiento();

});

/*=========================================================
CARGAR RECONOCIMIENTOS
=========================================================*/

/*=========================================================
CARGAR RECONOCIMIENTO POR FOLIO
=========================================================*/

async function cargarReconocimiento(){

try{

const {db}=window.PCZ_FIREBASE;

const snap=

await db

.collection("reconocimientos")

.where(

"folioReconocimiento",

"==",

folio

)

.limit(1)

.get();

if(snap.empty){

alert("No existe el reconocimiento.");

return;

}

const doc=snap.docs[0];

verBenefactorPublico(doc.id);

}catch(error){

console.error(error);

alert("No fue posible cargar el reconocimiento.");

}

}

/*=========================================================
VER RECONOCIMIENTO
=========================================================*/

async function verBenefactorPublico(id){

  
try{

const {db}=window.PCZ_FIREBASE;

  /*=========================================================
FOLIO DESDE URL
=========================================================*/

const parametros =
new URLSearchParams(
window.location.search
);

const folio =
parametros.get("folio");     

  
const doc=
await db
.collection("reconocimientos")
.doc(id)
.get();

if(!doc.exists){

alert("No existe el reconocimiento.");

return;

}

const d=doc.data();

/*==========================
ENCABEZADO
==========================*/

document.getElementById("expFolio").textContent=
d.folioReconocimiento || "-";

document.getElementById("expEstado").textContent=

d.publicado

?

"🟢 Publicado"

:

"⚪ Oculto";

/*==========================
APOYO
==========================*/

document.getElementById("expFotoApoyo").src=
d.fotoApoyoUrl || "";

document.getElementById("expArticulo").textContent=
d.articuloDonado || "";

document.getElementById("expTipo").textContent=
d.tipoApoyo || "";

document.getElementById("expValor").textContent=

Number(d.valorEstimado||0)

.toLocaleString(

"es-MX",

{

style:"currency",

currency:"MXN"

}

);

/*==========================
BENEFACTOR
==========================*/

document.getElementById("expNombre").textContent=

d.publicarNombre

?

d.nombreBenefactor

:

"Benefactor Anónimo";

document.getElementById("expEmpresa").textContent=
d.empresaBenefactor || "-";

document.getElementById("expPoblacion").textContent=
d.poblacionBenefactor || "-";

/*==========================
FOTO
==========================*/

const foto=

document.getElementById("expFotoBenefactor");

const sinFoto=

document.getElementById("expSinFoto");

if(

d.publicarFotoBenefactor &&

d.fotoBenefactorUrl

){

foto.src=
d.fotoBenefactorUrl;

foto.style.display="block";

sinFoto.classList.add("hidden");

}else{

foto.style.display="none";

sinFoto.classList.remove("hidden");

}

/*==========================
INFO
==========================*/

document.getElementById("expFecha").textContent=

d.creadoEn

?

d.creadoEn.toDate().toLocaleDateString(

"es-MX",

{

day:"2-digit",

month:"long",

year:"numeric"

}

)

:

"-";

document.getElementById("expRegistro").textContent=
d.creadoPorNombre || "-";

document.getElementById("expTipoInfo").textContent=
d.tipoApoyo || "-";

document.getElementById("expValorInfo").textContent=

Number(d.valorEstimado||0)

.toLocaleString(

"es-MX",

{

style:"currency",

currency:"MXN"

}

);

document.getElementById("expEmpresaInfo").textContent=
d.empresaBenefactor || "-";

document.getElementById("expPoblacionInfo").textContent=
d.poblacionBenefactor || "-";

/*==========================
TEXTOS
==========================*/

document.getElementById("expDescripcion").textContent=
d.descripcionApoyo || "-";

document.getElementById("expMensaje").textContent=
d.mensajeAgradecimiento || "-";

/*==========================
ABRIR
==========================*/

document

.getElementById("modalExpedienteBenefactor")

.classList.remove("hidden");

}catch(error){

console.error(error);

alert("No fue posible abrir el reconocimiento.");

}

}




const modal=

document.getElementById("modalExpedienteBenefactor");

document

.getElementById("cerrarExpedienteBenefactor")

.addEventListener("click",()=>{

modal.classList.add("hidden");

});

modal.addEventListener("click",(e)=>{

if(e.target===modal){

modal.classList.add("hidden");

}

});




