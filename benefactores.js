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

onclick="window.location.href='reconocimiento.html?folio=${d.folioReconocimiento}'">

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




