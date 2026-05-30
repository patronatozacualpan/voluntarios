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

      fechaCreacion:
        firebase
          .firestore
          .FieldValue
          .serverTimestamp(),

      votos: {

        presidente:
          null,

        secretario:
          null,

        tesorera:
          null,

        vocal1:
          null,

        vocal2:
          null,

        comandante_operativo:
          null

      }

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





    
