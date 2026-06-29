/*=========================================================
  PATRONATO ZACUALPAN
  CORE V3
=========================================================*/

window.PCZ = window.PCZ || {};

/*=========================================================
  DOM
=========================================================*/

PCZ.$ = (selector) =>
document.querySelector(selector);

PCZ.$$ = (selector) =>
document.querySelectorAll(selector);

/*=========================================================
  MOSTRAR / OCULTAR
=========================================================*/

PCZ.mostrar = (selector)=>{

const el =
typeof selector==="string"
? PCZ.$(selector)
: selector;

if(el)
el.classList.remove("hidden");

};

PCZ.ocultar = (selector)=>{

const el =
typeof selector==="string"
? PCZ.$(selector)
: selector;

if(el)
el.classList.add("hidden");

};

/*=========================================================
  FORMATO MONEDA
=========================================================*/

PCZ.moneda=(valor)=>{

return Number(valor||0)
.toLocaleString(
"es-MX",
{
style:"currency",
currency:"MXN"
}
);

};

/*=========================================================
  FORMATO FECHA
=========================================================*/

PCZ.fecha=(fecha)=>{

if(!fecha)return "-";

if(fecha.toDate){

fecha=fecha.toDate();

}

return fecha.toLocaleDateString(
"es-MX",
{
day:"2-digit",
month:"long",
year:"numeric"
}
);

};

/*=========================================================
  SCROLL
=========================================================*/

PCZ.arriba=()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

};

/*=========================================================
  MENSAJES
=========================================================*/

PCZ.ok=(texto)=>{

alert(texto);

};

PCZ.error=(texto)=>{

alert(texto);

};

/*=========================================================
  GENERAR ID
=========================================================*/

PCZ.id=()=>{

return Date.now()+"-"+
Math.random()
.toString(36)
.substring(2,8);

};
