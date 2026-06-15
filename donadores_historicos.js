async function registrarDonadorHistorico() {

const firebaseTools =
window.PCZ_FIREBASE;

if (!firebaseTools?.db) {

alert(
"No existe conexión con Firebase."
);

return;

}

const { db } =
firebaseTools;

const nombre =
document
.getElementById("nombre")
.value
.trim();

const telefono =
document
.getElementById("telefono")
.value
.trim();

const poblacion =
document
.getElementById("poblacion")
.value
.trim();

const promesaMensual =
Number(
document
.getElementById(
"promesaMensual"
)
.value
);

const fechaInicioPatrocinio =
document
.getElementById(
"fechaInicioPatrocinio"
)
.value;

const diaPagoPreferido =
Number(
document
.getElementById(
"diaPagoPreferido"
)
.value
);

const observaciones =
document
.getElementById(
"observaciones"
)
.value
.trim();

if (

!nombre ||
!telefono ||
!poblacion ||
!promesaMensual ||
!fechaInicioPatrocinio

) {

alert(
"Complete todos los campos obligatorios."
);

return;

}

try {

const fechaInicio =
firebase.firestore.Timestamp
.fromDate(
new Date(
fechaInicioPatrocinio
)
);

await db
.collection("donadores")
.add({

nombre,

telefono,

telefonoNormalizado:
"52" +
telefono.replace(
/\D/g,
""
),

poblacion,

promesaMensual,

diaPagoPreferido,

aceptaWhatsApp: true,

activo: true,

recordatoriosActivos: true,

estadoValidacion:
"validado",

origenRegistro:
"migracion_historica",

esDonadorHistorico:
true,

fechaInicioPatrocinio:
fechaInicio,

ultimoPago:
fechaInicio,

totalAportado: 0,

observaciones,

validadoPorNombre:
window.PCZ_USUARIO?.nombre
|| "",

validadoPorUid:
window.PCZ_USUARIO?.uid
|| "",

validadoEn:
firebase.firestore
.FieldValue
.serverTimestamp(),

creadoEn:
firebase.firestore
.FieldValue
.serverTimestamp(),

actualizadoEn:
firebase.firestore
.FieldValue
.serverTimestamp()

});

alert(
"Donador histórico registrado correctamente."
);

document
.getElementById(
"nombre"
)
.value = "";

document
.getElementById(
"telefono"
)
.value = "";

document
.getElementById(
"poblacion"
)
.value = "";

document
.getElementById(
"promesaMensual"
)
.value = "";

document
.getElementById(
"fechaInicioPatrocinio"
)
.value = "";

document
.getElementById(
"observaciones"
)
.value = "";

cargarHistoricos();

}

catch(error){

console.error(error);

alert(
"Error registrando donador."
);

}

}

async function cargarHistoricos() {

const firebaseTools =
window.PCZ_FIREBASE;

if (!firebaseTools?.db) {

return;

}

const { db } =
firebaseTools;

const tbody =
document.getElementById(
"tablaHistoricos"
);

try {

const snap =

await db
.collection("donadores")
.where(
"esDonadorHistorico",
"==",
true
)
.orderBy(
"creadoEn",
"desc"
)
.limit(20)
.get();

if (snap.empty) {

tbody.innerHTML = `

<tr>

<td colspan="4">

Sin registros

</td>

</tr>

`;

return;

}

tbody.innerHTML = "";

snap.forEach((doc) => {

const d =
doc.data();

const fecha =

d.fechaInicioPatrocinio
?.toDate()

? d
.fechaInicioPatrocinio
.toDate()
.toLocaleDateString(
"es-MX"
)

: "-";

tbody.innerHTML += `

<tr>

<td>
${d.nombre || "-"}
</td>

<td>
${d.telefono || "-"}
</td>

<td>
${fecha}
</td>

<td>
$${Number(
d.promesaMensual || 0
).toFixed(2)}
</td>

</tr>

`;

});

}

catch(error){

console.error(error);

}

}

document
.getElementById(
"btnGuardarHistorico"
)
?.addEventListener(
"click",
registrarDonadorHistorico
);

cargarHistoricos();
