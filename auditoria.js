let auditoriaCompleta = [];

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

console.log(
  "USUARIO:",
  window.PCZ_USUARIO
);

console.log(
  "FIREBASE:",
  window.PCZ_FIREBASE
);

  
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

auditoriaCompleta = [];

snap.forEach((doc) => {

  const d = doc.data();

  auditoriaCompleta.push(d);

});

renderizarAuditoria(
  auditoriaCompleta
);

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


function renderizarAuditoria(
  registros
) {

  const tbody =
    document.getElementById(
      "tablaAuditoriaBody"
    );

  tbody.innerHTML = "";

  registros.forEach((d) => {

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

cargarAuditoria();


document
.getElementById(
  "filtroModulo"
)
?.addEventListener(
  "change",
  (e) => {

    const modulo =
      e.target.value;

    if (!modulo) {

      renderizarAuditoria(
        auditoriaCompleta
      );

      return;

    }

    const filtrados =

      auditoriaCompleta.filter(
        (r) =>

          r.modulo === modulo
      );

    renderizarAuditoria(
      filtrados
    );

  }
);


