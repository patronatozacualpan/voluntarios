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
            Estado:
            ${d.estado}
          </p>

        </div>
        `;

      }
    );

    contenedor.innerHTML =
      html;

  } catch (error) {

    console.error(
      error
    );

  }

}





    
