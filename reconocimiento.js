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

listaBenefactores=
document.getElementById("listaBenefactoresPublicos");

totalBenefactores=
document.getElementById("totalBenefactores");

cargarBenefactoresPublicos();

console.log(window.PCZ_FIREBASE);
console.log(firebaseTools);
  const {db}=firebaseTools;

console.log(db);
  
  
});

/*=========================================================
CARGAR RECONOCIMIENTOS
=========================================================*/

async function cargarBenefactoresPublicos(){

try{

if(!firebaseTools?.db){

return;

}

const {db}=firebaseTools;

const snap=

await db

.collection("reconocimientos")

.where("publicado","==",true)

.orderBy("folioNumero","desc")

.get();

listaBenefactores.innerHTML="";

totalBenefactores.textContent=
snap.size;

snap.forEach(doc=>{

const d=doc.data();

listaBenefactores.innerHTML+=`

<div class="benefactor-publico">

<div class="benefactor-publico-foto">

<img

src="${
d.fotoApoyoUrl ||

"assets/img/sin-imagen.png"

}"

alt="Apoyo">

</div>

<div class="benefactor-publico-body">

<div class="benefactor-publico-folio">

${d.folioReconocimiento}

</div>

<h2>

${d.articuloDonado||""}

</h2>

<p>

${
d.publicarNombre

?

d.nombreBenefactor

:

"Benefactor Anónimo"

}

</p>

<small>

${d.empresaBenefactor||""}

</small>

<button

onclick="verBenefactorPublico('${doc.id}')">

👁 Ver reconocimiento

</button>

</div>

</div>

`;

});

}catch(error){

console.error(error);

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




