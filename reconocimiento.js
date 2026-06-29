/*=========================================================
MURO DE GRATITUD CIUDADANA
Patronato Zacualpan
=========================================================*/

const firebaseTools =
window.PCZ_FIREBASE;


/*=========================================================
FOLIO DESDE URL
=========================================================*/

const parametros =
new URLSearchParams(
window.location.search
);

const folio =
parametros.get("folio");


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

console.log("Folio recibido:", folio);

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

console.log("Documentos encontrados:", snap.size);

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

  console.log("Entró a verBenefactorPublico");
console.log(d);

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

PCZ.moneda(d.valorEstimado);


/*==========================
BENEFACTOR
==========================*/

document.getElementById("expNombre").textContent=

d.publicarNombre

?

d.nombreBenefactor

:

"Benefactor Anónimo";

PCZ.texto(
"expEmpresa",
PCZ.vacio(d.empresaBenefactor)
);

PCZ.texto(
"expPoblacion",
PCZ.vacio(d.poblacionBenefactor)
);

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

document.getElementById("expFecha").textContent =
PCZ.fecha(d.creadoEn);

PCZ.texto(
"expRegistro",
PCZ.vacio(d.creadoPorNombre)
);

PCZ.texto(
"expTipoInfo",
PCZ.vacio(d.tipoApoyo)
);

document.getElementById("expValorInfo").textContent=

PCZ.moneda(d.valorEstimado);


PCZ.texto(
"expEmpresaInfo",
PCZ.vacio(d.empresaBenefactor)
);

PCZ.texto(
"expPoblacionInfo",
PCZ.vacio(d.poblacionBenefactor)
);

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

console.log("Terminó de cargar expediente");
  
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




