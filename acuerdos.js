let acuerdoActualData = null;

let acuerdoActualId = null;
document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(() => {
    validarPermisoCrear();
      cargarAcuerdos();

      document
        .getElementById(
          "btnCrearAcuerdo"
        )
        ?.addEventListener(
          "click",
          crearAcuerdo
        );


      
      document
  .getElementById(
    "btnGuardarVoto"
  )
  ?.addEventListener(
    "click",
    guardarVoto
  );
document
  .getElementById(
    "btnDescargarActa"
  )
  ?.addEventListener(
    "click",
    descargarActaPDF
  );

      
    }, 800);

  }
);

async function validarPermisoCrear() {

  const usuario =
    window.PCZ_AUTH
      ?.obtenerUsuarioActivo?.();

  if (!usuario)
    return;

  if (
    usuario.rol !==
    "presidente"
  ) {

    document
      .getElementById(
        "seccionCrearAcuerdo"
      )
      ?.remove();

  }

}

async function crearAcuerdo() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) {

    alert(
      "Firestore no disponible."
    );

    return;
  }

  const { db } =
    firebaseTools;

  const tipo =
    document
      .getElementById(
        "acuerdoTipo"
      )
      .value;

  const titulo =
    document
      .getElementById(
        "acuerdoTitulo"
      )
      .value
      .trim();

  const descripcion =
    document
      .getElementById(
        "acuerdoDescripcion"
      )
      .value
      .trim();

  const justificacion =
    document
      .getElementById(
        "acuerdoJustificacion"
      )
      .value
      .trim();

  const monto =
    Number(
      document
        .getElementById(
          "acuerdoMonto"
        )
        .value || 0
    );

  const requiereComandante =
    document
      .getElementById(
        "requiereComandante"
      )
      .checked;

  if (!titulo) {

    alert(
      "Captura un título."
    );

    return;
  }


const usuario =
  window.PCZ_AUTH
    ?.obtenerUsuarioActivo?.();

if (!usuario) {

  alert(
    "No se pudo identificar al usuario."
  );

  return;
}

  
  const anio =
    new Date()
      .getFullYear();

  const contadorSnap =
    await db
      .collection(
        "acuerdos"
      )
      .get();

  const consecutivo =
    String(
      contadorSnap.size + 1
    ).padStart(
      4,
      "0"
    );

  const folio =
    `ACU-${anio}-${consecutivo}`;

console.log(
  "UID ACTUAL:",
  firebase.auth().currentUser?.uid
);
  
await db
  .collection(
    "acuerdos"
  )
  .add({

    folio,

    estado:
      "pendiente",

    tipo,

    titulo,

    descripcion,

    justificacion,

    montoEstimado:
      monto,

    requiereComandante,

creadoPorUid:
  usuario.uid,

creadoPorNombre:
  usuario.nombre,

creadoPorRol:
  usuario.rol,
    

    fechaCreacion:
      firebase
        .firestore
        .FieldValue
        .serverTimestamp(),

    votos: {

      presidente: {

        voto: null,

        fecha: null,

        observacion: ""

      },

      secretario: {

        voto: null,

        fecha: null,

        observacion: ""

      },

      tesorera: {

        voto: null,

        fecha: null,

        observacion: ""

      },

      vocal1: {

        voto: null,

        fecha: null,

        observacion: ""

      },

      vocal2: {

        voto: null,

        fecha: null,

        observacion: ""

      },

      comandante_operativo: {

        voto: null,

        fecha: null,

        observacion: ""

      }

    },

    resultado: null,

  fechaResolucion: null,

resueltoPor: null,

    totalFavor: 0,

    totalContra: 0,

    totalAbstencion: 0

  });

  alert(
    `Acuerdo creado:\n${folio}`
  );

  document
    .getElementById(
      "acuerdoTitulo"
    ).value = "";

  document
    .getElementById(
      "acuerdoDescripcion"
    ).value = "";

  document
    .getElementById(
      "acuerdoJustificacion"
    ).value = "";

  document
    .getElementById(
      "acuerdoMonto"
    ).value = "";

  cargarAcuerdos();

}

async function cargarAcuerdos() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db)
    return;

  const { db } =
    firebaseTools;

  const contenedor =
    document
      .getElementById(
        "contenedorAcuerdos"
      );

  try {

    const snap =
      await db
        .collection(
          "acuerdos"
        )
        .orderBy(
          "fechaCreacion",
          "desc"
        )
        .get();

    if (snap.empty) {

      contenedor.innerHTML =
        `
        <div class="info-card">
          No hay acuerdos.
        </div>
        `;

      return;
    }

    let html = "";

    snap.forEach(
      (doc) => {

        const d =
          doc.data();

        html += `

        <div class="info-card">

          <h3>
            ${d.folio}
          </h3>

          <p>
            ${d.titulo}
          </p>

         <p>

  Estado Operativo:

  <strong>
    ${d.estado}
  </strong>

</p>

<p>

  Resultado:

  <strong>
    ${obtenerSemaforo(
      d.resultado
    )}
  </strong>

</p>


          <p>
            Monto:
            $${Number(
              d.montoEstimado || 0
            ).toLocaleString()}
          </p>

          <button
            class="primary-btn"
            onclick="verAcuerdo('${doc.id}')"
          >
            Ver expediente
          </button>

        </div>

        `;

      }
    );

    contenedor.innerHTML =
      html;

  } catch (error) {

    console.error(
      "Error cargando acuerdos:",
      error
    );

  }

}


async function verAcuerdo(id) {

  acuerdoActualId = id;

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db)
    return;

  const { db } =
    firebaseTools;

  const docSnap =
    await db
      .collection("acuerdos")
      .doc(id)
      .get();

  if (!docSnap.exists)
    return;

  const d =
    docSnap.data();

acuerdoActualData = d;
  
const usuario =
  window.PCZ_AUTH
    ?.obtenerUsuarioActivo?.();

let rolUsuario =
  usuario?.rol;

if (
  rolUsuario === "vocal"
) {

  rolUsuario =
    "vocal1";

}

  const yaVoto =
  d.votos?.[
    rolUsuario
  ]?.voto;

let mensajeVoto = "";

if (yaVoto) {

  mensajeVoto = `

    <div
      style="
        background:#e8f5e9;
        padding:10px;
        border-radius:8px;
        margin-top:10px;
      "
    >

      ✅ Usted ya emitió su voto:

      <strong>
        ${yaVoto}
      </strong>

    </div>

  `;

}
  
  
  let votosHtml =
    "<h3>Estado de votación</h3>";

  Object.entries(
    d.votos || {}
  ).forEach(([rol, v]) => {

    const estado =
      v?.voto
        ? `✅ ${v.voto}`
        : "⏳ Pendiente";

    votosHtml += `

      <p>

        <strong>
          ${rol}
        </strong>

        :
        ${estado}

      </p>

    `;

  });

  document
    .getElementById(
      "contenidoAcuerdo"
    )
    .innerHTML = `

      <p>
        <strong>Folio:</strong>
        ${d.folio}
      </p>

      <p>
        <strong>Título:</strong>
        ${d.titulo}
      </p>

      <p>
        <strong>Descripción:</strong>
        ${d.descripcion}
      </p>

      <p>
        <strong>Justificación:</strong>
        ${d.justificacion}
      </p>

      <p>
        <strong>Monto:</strong>
        $${Number(
          d.montoEstimado || 0
        ).toLocaleString()}
      </p>

      <p>
        <strong>Estado:</strong>
        ${d.estado}
      </p>

      <hr>

      <p>
        <strong>Favor:</strong>
        ${d.totalFavor || 0}
      </p>

      <p>
        <strong>Contra:</strong>
        ${d.totalContra || 0}
      </p>

      <p>
        <strong>Abstención:</strong>
        ${d.totalAbstencion || 0}
      </p>

     <p>

  <strong>Resultado:</strong>

  ${obtenerSemaforo(
    d.resultado
  )}

</p>

      <hr>

${mensajeVoto}

${votosHtml}

  `;

const btnGuardar =
  document
    .getElementById(
      "btnGuardarVoto"
    );

if (yaVoto) {

  btnGuardar.style.display =
    "none";

} else {

  btnGuardar.style.display =
    "inline-block";

}

  
  document
    .getElementById(
      "modalAcuerdo"
    )
    .classList
    .add(
      "activo"
    );

}



function cerrarModalAcuerdo() {

  document
    .getElementById(
      "modalAcuerdo"
    )
    ?.classList
    .remove(
      "activo"
    );

}

async function guardarVoto() {

  if (!acuerdoActualId)
    return;

  const usuario =
    window.PCZ_AUTH
      ?.obtenerUsuarioActivo?.();

  if (!usuario)
    return;

  const votoSeleccionado =
    document.querySelector(
      'input[name="tipoVoto"]:checked'
    );

  if (!votoSeleccionado) {

    alert(
      "Selecciona un voto."
    );

    return;
  }

  const voto =
    votoSeleccionado.value;

  const observacion =
    document
      .getElementById(
        "observacionVoto"
      )
      .value
      .trim();

  const firebaseTools =
    window.PCZ_FIREBASE;

  const { db } =
    firebaseTools;

  const acuerdoSnap =
  await db
    .collection(
      "acuerdos"
    )
    .doc(
      acuerdoActualId
    )
    .get();

if (
  !acuerdoSnap.exists
) {

  alert(
    "Acuerdo no encontrado."
  );

  return;
}

const acuerdo =
  acuerdoSnap.data();

  

 let campoRol =
  usuario.rol;

if (
  campoRol === "vocal"
) {

  campoRol =
    "vocal1";

}

  if (

  acuerdo
    ?.votos
    ?.[campoRol]
    ?.voto

) {

  alert(
    "Usted ya emitió su voto."
  );

  return;
}

  

  if (
    campoRol === "vocal"
  ) {

    campoRol =
      "vocal1";
  }

  await db
    .collection(
      "acuerdos"
    )
    .doc(
      acuerdoActualId
    )
    .update({

      [`votos.${campoRol}`]: {

        voto,

        observacion,

        fecha:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp()

      }

    });
await recalcularAcuerdo(
  acuerdoActualId
);
  
  alert(
    "Voto guardado."
  );

  cerrarModalAcuerdo();

  cargarAcuerdos();

}




async function recalcularAcuerdo(id) {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db)
    return;

  const { db } =
    firebaseTools;

  const docSnap =
    await db
      .collection("acuerdos")
      .doc(id)
      .get();

  if (!docSnap.exists)
    return;

  const d =
    docSnap.data();

  let favor = 0;
  let contra = 0;
  let abstencion = 0;

  Object.values(
    d.votos || {}
  ).forEach((v) => {

    if (!v?.voto)
      return;

    if (v.voto === "favor")
      favor++;

    if (v.voto === "contra")
      contra++;

    if (
      v.voto === "abstencion"
    )
      abstencion++;

  });

let resultado =
  "pendiente";

const requiereComandante =
  d.requiereComandante;

const minimo =
  requiereComandante
    ? 4
    : 3;

if (
  favor >= minimo
) {

  resultado =
    "aprobado";

}

if (
  contra >= minimo
) {

  resultado =
    "rechazado";

}
  

  await db
    .collection("acuerdos")
    .doc(id)
    .update({

      totalFavor:
        favor,

      totalContra:
        contra,

      totalAbstencion:
        abstencion,

      resultado,

estado:
  resultado === "pendiente"
    ? "pendiente"
    : "resuelto",
      
      fechaResolucion:
        resultado === "aprobado"
          ? firebase.firestore
              .FieldValue
              .serverTimestamp()
          : null

    });

}



function obtenerSemaforo(resultado) {

  if (
    resultado === "aprobado"
  ) {

    return "🟢 Aprobado";

  }

  if (
    resultado === "rechazado"
  ) {

    return "🔴 Rechazado";

  }

  return "🟡 Pendiente";

}



async function descargarActaPDF() {

  if (!acuerdoActualData) {

    alert(
      "No hay acuerdo cargado."
    );

    return;
  }

  const d =
    acuerdoActualData;

  const {
    jsPDF
  } = window.jspdf;

  const pdf =
    new jsPDF();

  let y = 20;

  pdf.setFontSize(16);

  pdf.text(
    "PATRONATO ZACUALPAN",
    105,
    y,
    { align: "center" }
  );

  y += 8;

  pdf.setFontSize(12);

  pdf.text(
    "ACTA DIGITAL DE ACUERDO",
    105,
    y,
    { align: "center" }
  );

  y += 15;

  pdf.setFontSize(10);

  pdf.text(
    `Folio: ${d.folio || "-"}`,
    15,
    y
  );

  y += 7;

  pdf.text(
    `Tipo: ${d.tipo || "-"}`,
    15,
    y
  );

  y += 7;

  pdf.text(
    `Titulo: ${d.titulo || "-"}`,
    15,
    y
  );

  y += 7;

  pdf.text(
    `Monto estimado: $${Number(
      d.montoEstimado || 0
    ).toLocaleString()}`,
    15,
    y
  );

  y += 12;

  pdf.setFontSize(11);

  pdf.text(
    "Descripcion:",
    15,
    y
  );

  y += 6;

  pdf.setFontSize(10);

  pdf.text(
    pdf.splitTextToSize(
      d.descripcion || "-",
      170
    ),
    15,
    y
  );

  y += 18;

  pdf.setFontSize(11);

  pdf.text(
    "Justificacion:",
    15,
    y
  );

  y += 6;

  pdf.setFontSize(10);

  pdf.text(
    pdf.splitTextToSize(
      d.justificacion || "-",
      170
    ),
    15,
    y
  );

  y += 20;

  pdf.setFontSize(11);

  pdf.text(
    `Resultado: ${(d.resultado || "pendiente").toUpperCase()}`,
    15,
    y
  );

  y += 10;

  pdf.text(
    `Favor: ${d.totalFavor || 0}`,
    15,
    y
  );

  y += 6;

  pdf.text(
    `Contra: ${d.totalContra || 0}`,
    15,
    y
  );

  y += 6;

  pdf.text(
    `Abstencion: ${d.totalAbstencion || 0}`,
    15,
    y
  );

  y += 15;

  pdf.setFontSize(12);

  pdf.text(
    "VOTACION REGISTRADA",
    15,
    y
  );

  y += 10;

  pdf.setFontSize(10);

  Object.entries(
    d.votos || {}
  ).forEach(([rol, voto]) => {

    pdf.text(

      `${rol}: ${voto?.voto || "pendiente"}`,

      15,

      y

    );

    y += 6;

  });

  y += 12;

  if (d.fechaResolucion) {

    let fechaResolucion = "-";

    try {

      fechaResolucion =
        d.fechaResolucion
          .toDate()
          .toLocaleString();

    } catch (e) {}

    pdf.text(
      `Fecha resolucion: ${fechaResolucion}`,
      15,
      y
    );

    y += 8;
  }

  pdf.setFontSize(9);

  pdf.text(
    "Documento generado por el Sistema Institucional del Patronato Zacualpan.",
    15,
    y
  );

  pdf.save(
    `ACTA-${d.folio || "ACUERDO"}.pdf`
  );

}





    
