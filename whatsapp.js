/* =========================================================
   whatsapp.js
   Seguimiento WhatsApp de Donadores
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  setTimeout(() => {

    cargarSeguimientoWhatsApp();

  }, 800);

});

/* ---------------------------------------------------------
   Cargar seguimiento
--------------------------------------------------------- */

async function cargarSeguimientoWhatsApp() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) {

    alert(
      "⚠️ Firebase no está configurado."
    );

    return;
  }

  const { db } =
    firebaseTools;

  const tbody =
    document.getElementById(
      "tablaSeguimientoBody"
    );

  if (tbody) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Cargando seguimiento...
        </td>
      </tr>
    `;
  }

  try {

    const snapshot =
      await db
        .collection("donadores")
        .orderBy("creadoEn", "desc")
        .get();

    const seguimiento = [];

    let totalPrimeraAportacion = 0;
    let totalAtrasados = 0;
    let totalWhatsApp = 0;

    snapshot.forEach((doc) => {

      const donador = {

        id: doc.id,
        ...doc.data()

      };

      if (
        donador.aceptaWhatsApp === true
      ) {

        totalWhatsApp++;

      }

      const calculo =
        calcularEstatusDonador(
          donador
        );

      if (
        calculo.estatusClave ===
        "primera_aportacion"
      ) {

        totalPrimeraAportacion++;

        seguimiento.push({
          donador,
          calculo
        });

      }

      else if (
        calculo.estatusClave ===
        "atrasado"
      ) {

        totalAtrasados++;

        seguimiento.push({
          donador,
          calculo
        });

      }

    });

    const totalSeguimiento =
      seguimiento.length;

    actualizarResumenWhatsApp({

      totalPrimeraAportacion,
      totalAtrasados,
      totalWhatsApp,
      totalSeguimiento

    });

    pintarTablaSeguimiento(
      seguimiento
    );

  } catch (error) {

    console.error(
      "Error cargando seguimiento:",
      error
    );

    if (tbody) {

      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            ⚠️ Error cargando seguimiento.
          </td>
        </tr>
      `;
    }
  }
}

/* ---------------------------------------------------------
   Resumen superior
--------------------------------------------------------- */

function actualizarResumenWhatsApp({

  totalPrimeraAportacion,
  totalAtrasados,
  totalWhatsApp,
  totalSeguimiento

}) {

  const elPrimera =
    document.getElementById(
      "totalPrimeraAportacion"
    );

  const elAtrasados =
    document.getElementById(
      "totalAtrasados"
    );

  const elWhatsApp =
    document.getElementById(
      "totalWhatsApp"
    );

  const elSeguimiento =
    document.getElementById(
      "totalSeguimiento"
    );

  if (elPrimera) {

    elPrimera.textContent =
      totalPrimeraAportacion;

  }

  if (elAtrasados) {

    elAtrasados.textContent =
      totalAtrasados;

  }

  if (elWhatsApp) {

    elWhatsApp.textContent =
      totalWhatsApp;

  }

  if (elSeguimiento) {

    elSeguimiento.textContent =
      totalSeguimiento;

  }

}

/* ---------------------------------------------------------
   Tabla seguimiento
--------------------------------------------------------- */

function pintarTablaSeguimiento(
  registros
) {

  const tbody =
    document.getElementById(
      "tablaSeguimientoBody"
    );

  if (!tbody) return;

  if (!registros.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          No hay donadores para seguimiento.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = "";

  registros.forEach((item) => {

    const donador =
      item.donador;

    const calculo =
      item.calculo;

    const telefono =
      donador.telefonoNormalizado
      || normalizarTelefonoParaWhatsApp(
        donador.telefono
      );

    const mensaje =
      crearMensajeWhatsApp(
        donador,
        calculo
      );

    const tr =
      document.createElement("tr");

    tr.innerHTML = `

      <td>
        ${escapeHtml(
          donador.nombre || ""
        )}
      </td>

      <td>
        ${escapeHtml(
          donador.telefono || ""
        )}
      </td>

      <td>
        ${formatoMoneda(
          donador.promesaMensual || 0
        )}
      </td>

      <td>
        ${formatoMoneda(
          donador.totalAportado || 0
        )}
      </td>

      <td>
        <span class="estatus-badge ${calculo.estatusClase}">
          ${calculo.estatusTexto}
        </span>
      </td>

      <td>

        <a
          class="btn-mini"
          href="https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}"
          target="_blank"
          rel="noopener"
        >
          WhatsApp
        </a>

      </td>

    `;

    tbody.appendChild(tr);

  });

}

/* ---------------------------------------------------------
   Calcular estatus
--------------------------------------------------------- */

function calcularEstatusDonador(
  donador
) {

  const promesaMensual =
    Number(
      donador.promesaMensual || 0
    );

  const totalAportado =
    Number(
      donador.totalAportado || 0
    );

  if (
    donador.estadoValidacion ===
      "pendiente"
    ||
    donador.activo === false
  ) {

    return {

      montoEsperado: 0,

      montoPendiente: 0,

      estatusClave:
        "pendiente",

      estatusClase:
        "pendiente",

      estatusTexto:
        "🕓 Pendiente"

    };

  }

  if (
    donador.estadoValidacion ===
      "validado"
    &&
    totalAportado === 0
  ) {

    return {

      montoEsperado:
        promesaMensual,

      montoPendiente:
        promesaMensual,

      estatusClave:
        "primera_aportacion",

      estatusClase:
        "pendiente",

      estatusTexto:
        "🟡 Primera aportación"

    };

  }

  const fechaRegistro =
    obtenerFechaRegistro(
      donador
    );

  const meses =
    calcularMesesTranscurridos(
      fechaRegistro
    );

  const montoEsperado =
    meses *
    promesaMensual;

  const montoPendiente =
    Math.max(
      montoEsperado -
      totalAportado,
      0
    );

  if (
    totalAportado >
    montoEsperado
  ) {

    return {

      montoEsperado,

      montoPendiente,

      estatusClave:
        "adelantado",

      estatusClase:
        "adelantado",

      estatusTexto:
        "⏩ Adelantado"

    };

  }

  if (
    totalAportado ===
    montoEsperado
  ) {

    return {

      montoEsperado,

      montoPendiente,

      estatusClave:
        "al_dia",

      estatusClase:
        "al-dia",

      estatusTexto:
        "✅ Al día"

    };

  }

  return {

    montoEsperado,

    montoPendiente,

    estatusClave:
      "atrasado",

    estatusClase:
      "atrasado",

    estatusTexto:
      "⏪ Atrasado"

  };

}

/* ---------------------------------------------------------
   Fechas
--------------------------------------------------------- */

function obtenerFechaRegistro(
  donador
) {

  if (
    donador.fechaRegistro?.toDate
  ) {

    return donador
      .fechaRegistro
      .toDate();

  }

  if (
    donador.creadoEn?.toDate
  ) {

    return donador
      .creadoEn
      .toDate();

  }

  if (
    donador.fechaRegistro
  ) {

    return new Date(
      donador.fechaRegistro
    );

  }

  return new Date();

}

function calcularMesesTranscurridos(
  fechaRegistro
) {

  const inicio =
    new Date(fechaRegistro);

  const hoy =
    new Date();

  let meses =

    (
      hoy.getFullYear()
      -
      inicio.getFullYear()
    ) * 12

    +

    (
      hoy.getMonth()
      -
      inicio.getMonth()
    )

    + 1;

  if (meses < 1) {

    meses = 1;

  }

  return meses;

}
