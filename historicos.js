async function registrarHistorico() {

const firebaseTools =
window.PCZ_FIREBASE;

if (!firebaseTools?.db) {

alert(
"Firebase no disponible."
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
).value || 0
);

const fechaInicioTexto =
document
.getElementById(
"fechaInicio"
).value;

const observaciones =
document
.getElementById(
"observaciones"
).value
.trim();

if (
!nombre ||
!telefono ||
!fechaInicioTexto
) {

alert(
"Complete los campos obligatorios."
);

return;

}

const fechaInicio =
firebase.firestore.Timestamp
.fromDate(
new Date(
fechaInicioTexto
)
);



await db
.collection("donadores")
.add({

nombre,

telefono,

telefonoNormalizado:
"52" + telefono,

poblacion,

promesaMensual,

aceptaWhatsApp:
true,

activo:
true,

recordatoriosActivos:
true,

origenRegistro:
"migracion_historica",

esDonadorHistorico:
true,

fechaInicioPatrocinio:
fechaInicio,

ultimoPago:
fechaInicio,

totalAportado:
0,

aportacionHistoricaInicial:
0,

estatusMigracion:
"pendiente_regularizacion",

/* NUEVOS */

estatusRegularizacion:
"pendiente",

participacionEsperada:
0,

diferenciaRegularizacion:
0,

mesesAcumulados:
0,

/* FIN NUEVOS */

estadoValidacion:
"validado",

observaciones,

validadoPorNombre:
window.PCZ_USUARIO?.nombre
|| "",

validadoPorUid:
window.PCZ_USUARIO?.uid
|| "",

creadoEn:
firebase.firestore
.FieldValue
.serverTimestamp(),

actualizadoEn:
firebase.firestore
.FieldValue
.serverTimestamp(),

validadoEn:
firebase.firestore
.FieldValue
.serverTimestamp()

});



