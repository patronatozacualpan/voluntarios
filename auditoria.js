async function cargarAuditoria() {

const firebaseTools =
window.PCZ_FIREBASE;

if (!firebaseTools?.db) {

return;

}

const { db } =
firebaseTools;

const tbody =
document.getElementById(
"tablaAuditoriaBody"
);

try {

const snap =

await db
.collection("logs")
.orderBy(
"creadoEn",
"desc"
)
.limit(200)
.get();

if (snap.empty) {

tbody.innerHTML = `

<tr>

<td colspan="5">

No existen registros.

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

d.creadoEn?.toDate

? d.creadoEn
.toDate()
.toLocaleString("es-MX")

: "-";

tbody.innerHTML += `

<tr>

<td>
${fecha}
</td>

<td>
${d.usuarioNombre || "-"}
</td>

<td>
${d.modulo || "-"}
</td>

<td>
${d.accion || "-"}
</td>

<td>
${d.descripcion || "-"}
</td>

</tr>

`;

});

}

catch(error){

console.error(error);

tbody.innerHTML = `

<tr>

<td colspan="5">

Error cargando auditoría.

</td>

</tr>

`;

}

}

cargarAuditoria();
