/* =========================================================
   donadores.js
   Panel de seguimiento de donadores
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

let DONADORES_CACHE = [];

document.addEventListener("DOMContentLoaded", () => {
  const btnRecargar = document.getElementById("btnRecargarDonadores");
  const buscar = document.getElementById("buscarDonador");
  const filtro = document.getElementById("filtroEstatus");

  if (btnRecargar) {
    btnRecargar.addEventListener("click", cargarDonadores);
  }

  if (buscar) {
    buscar.addEventListener("input", aplicarFiltrosDonadores);
  }

  if (filtro) {
    filtro.addEventListener("change", aplicarFiltrosDonadores);
  }

  setTimeout(cargarDonadores, 800);
});

/* ---------------------------------------------------------
   Cargar donadores desde Firestore
--------------------------------------------------------- */

async function cargarDonadores() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.db) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  const { db } = firebaseTools;
  const tbody = document.getElementById("tablaDonadoresBody");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">Cargando donadores...</td>
      </tr>
    `;
  }

  try {
    const snapshot = await db
      .collection("donadores")
      .orderBy("creadoEn", "desc")
      .get();

    DONADORES_CACHE = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      DONADORES_CACHE.push({
        id: doc.id,
        ...data
      });
    });

    aplicarFiltrosDonadores();

  } catch (error) {
    console.error("Error cargando donadores:", error);

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">⚠️ No se pudieron cargar los donadores.</td>
        </tr>
      `;
    }
  }
}

/* ---------------------------------------------------------
   Aplicar filtros
--------------------------------------------------------- */

function aplicarFiltrosDonadores() {
  const texto = String(document.getElementById("buscarDonador")?.value || "")
    .toLowerCase()
    .trim();

  const filtroEstatus = document.getElementById("filtroEstatus")?.value || "";

  const filtrados = DONADORES_CACHE.filter((donador) => {
    const resumen = `
      ${donador.nombre || ""}
      ${donador.telefono || ""}
      ${donador.poblacion || ""}
    `.toLowerCase();

    const calculo = calcularEstatusDonador(donador);

    const coincideTexto = !texto || resumen.includes(texto);
    const coincideEstatus = !filtroEstatus || calculo.estatusClave === filtroEstatus;

    return coincideTexto && coincideEstatus;
  });

  pintarTablaDonadores(filtrados);
}

/* ---------------------------------------------------------
   Pintar tabla
--------------------------------------------------------- */

function pintarTablaDonadores(donadores) {
  const tbody = document.getElementById("tablaDonadoresBody");

  if (!tbody) return;

  if (!donadores.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">No hay donadores para mostrar.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  donadores.forEach((donador) => {
    const calculo = calcularEstatusDonador(donador);

    const telefonoWhatsApp = donador.telefonoNormalizado
      || normalizarTelefonoParaWhatsApp(donador.telefono);

    const mensaje = crearMensajeWhatsApp(donador, calculo);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(donador.nombre || "Sin nombre")}</td>
      <td>${escapeHtml(donador.telefono || "")}</td>
      <td>${escapeHtml(donador.poblacion || "")}</td>
      <td>${formatoMoneda(donador.promesaMensual || 0)}</td>
      <td>${formatoMoneda(donador.totalAportado || 0)}</td>
      <td>${formatoMoneda(calculo.montoEsperado)}</td>
      <td>${formatoMoneda(calculo.montoPendiente)}</td>
 <td>
  <span class="estatus-badge ${calculo.estatusClase}">
    ${calculo.estatusTexto}
  </span>
</td>

<td>
  ${pintarRegularizacion(donador)}
</td>

<td>
  ${pintarValidacion(donador)}
  ${pintarBotonesValidacion(donador)}
</td>
      
      <td>
  <div class="acciones-donador">
    <a 
      class="btn-mini"
      href="https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}"
      target="_blank"
      rel="noopener"
    >
      WhatsApp
    </a>

    ${donador.estadoValidacion === "validado" ? `
      <a 
        class="btn-mini pago"
        href="ingresos.html?donadorId=${donador.id}"
      >
        Pago
      </a>
    ` : ""}
  </div>
</td>
    `;

    tbody.appendChild(tr);
  });
}

/* ---------------------------------------------------------
   Cálculo correcto de estatus
--------------------------------------------------------- */

function calcularEstatusDonador(donador) {
  const promesaMensual = Number(donador.promesaMensual || 0);
  const totalAportado = Number(donador.totalAportado || 0);

  if (donador.estadoValidacion === "pendiente" || donador.activo === false) {
    return {
      montoEsperado: 0,
      montoPendiente: 0,
      estatusClave: "pendiente",
      estatusClase: "pendiente",
      estatusTexto: "🕓 Pendiente"
    };
  }

if (
  donador.estadoValidacion === "validado" &&
  totalAportado === 0 &&
  !donador.esDonadorHistorico
) {
  return {
    montoEsperado: promesaMensual,
    montoPendiente: promesaMensual,
    estatusClave: "primera_aportacion",
    estatusClase: "pendiente",
    estatusTexto: "🟡 Primera aportación"
  };
}

let montoEsperado;
let montoPendiente;

const fechaRegistro =
  obtenerFechaRegistro(
    donador
  );

const meses =
  calcularMesesTranscurridos(
    fechaRegistro
  );

montoEsperado =
  meses *
  promesaMensual;

montoPendiente =
  Math.max(
    montoEsperado -
    totalAportado,
    0
  );

  if (montoPendiente < 0) {
    return {
      montoEsperado,
      montoPendiente,
      estatusClave: "adelantado",
      estatusClase: "adelantado",
      estatusTexto: "⏩ Adelantado"
    };
  }

  if (montoPendiente === 0) {
    return {
      montoEsperado,
      montoPendiente,
      estatusClave: "al_dia",
      estatusClase: "al-dia",
      estatusTexto: "✅ Al día"
    };
  }

  return {
    montoEsperado,
    montoPendiente,
    estatusClave: "atrasado",
    estatusClase: "atrasado",
    estatusTexto: "⏪ Atrasado"
  };
}
/* ---------------------------------------------------------
   Fechas
--------------------------------------------------------- */

function obtenerFechaRegistro(donador) {

  if (
    donador.fechaInicioPatrocinio?.toDate
  ) {

    return donador
      .fechaInicioPatrocinio
      .toDate();

  }

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

  return new Date();

}

function calcularMesesTranscurridos(fechaRegistro) {
  const inicio = new Date(fechaRegistro);
  const hoy = new Date();

  let meses =
    (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    (hoy.getMonth() - inicio.getMonth()) + 1;

  if (meses < 1) meses = 1;

  return meses;
}

/* ---------------------------------------------------------
   Validación visual
--------------------------------------------------------- */

function pintarValidacion(donador) {
  if (donador.estadoValidacion === "validado") {
    return `<span class="estatus-badge al-dia">Validado</span>`;
  }

  if (donador.estadoValidacion === "descartado") {
    return `<span class="estatus-badge atrasado">Descartado</span>`;
  }

  return `<span class="estatus-badge pendiente">Pendiente</span>`;
}


async function regularizarHistorial(donadorId) {

  const { db } = window.PCZ_FIREBASE;

  await db
    .collection("donadores")
    .doc(donadorId)
    .update({

      decisionRegularizacion:
        "regularizar_historial",

      fechaRegularizacion:
        firebase.firestore.FieldValue.serverTimestamp()

    });

  await cargarDonadores();
}

async function comenzarDesdeHoy(donadorId) {

  const { db } = window.PCZ_FIREBASE;

  await db
    .collection("donadores")
    .doc(donadorId)
    .update({

      decisionRegularizacion:
        "comenzar_desde_hoy",

      fechaRegularizacion:
        firebase.firestore.FieldValue.serverTimestamp()

    });

  await cargarDonadores();
}

async function revisarAportaciones(donadorId) {

  const { db } = window.PCZ_FIREBASE;

  await db
    .collection("donadores")
    .doc(donadorId)
    .update({

      decisionRegularizacion:
        "revisar_aportaciones",

      fechaRegularizacion:
        firebase.firestore.FieldValue.serverTimestamp()

    });

  await cargarDonadores();
}

/* ---------------------------------------------------------
   WhatsApp
--------------------------------------------------------- */

function crearMensajeWhatsApp(donador, calculo) {
  const nombre = donador.nombre || "amigo";
  const promesa = formatoMoneda(donador.promesaMensual || 0);
  const pendiente = formatoMoneda(calculo.montoPendiente || 0);


   /* --------------------------------------------------
   DONADORES HISTORICOS
-------------------------------------------------- */

if (donador.esDonadorHistorico === true) {

  const fechaInicio =
    donador.fechaInicioPatrocinio?.toDate
      ? donador.fechaInicioPatrocinio.toDate()
      : new Date();

  const meses =
    calcularMesesTranscurridos(
      fechaInicio
    );

  const participacionEsperada =
    meses *
    Number(
      donador.promesaMensual || 0
    );

const aportado =
  Number(
    donador.totalAportado || 0
  );

const pendienteRegularizacion =
  Math.max(
    participacionEsperada -
    aportado,
    0
  );
   

  return `Hola ${nombre}.

Queremos agradecerte porque apareces en nuestros registros como uno de los padrinos fundadores del Patronato Zacualpan.
Antes que nada queremos agradecerte porque tu apoyo durante este tiempo ayudó a mantener viva esta iniciativa ciudadana aun antes de contar con la plataforma actual.
Tu registro histórico indica una participación desde ${fechaInicio.toLocaleDateString("es-MX")}.

Desde entonces han transcurrido aproximadamente *${meses} meses*.

Con una aportación comprometida de *${promesa} mensuales*:

• Participación acumulada estimada desde tu incorporación:
*${formatoMoneda(participacionEsperada)}*

• Aportaciones registradas actualmente en la plataforma:
*${formatoMoneda(aportado)}*

• Diferencia pendiente de regularización:
*${formatoMoneda(pendienteRegularizacion)}*

Estos importes son únicamente una referencia de actualización histórica y podrán ajustarse si existen aportaciones anteriores que aún no hayan sido registradas en el sistema.

Actualmente estamos regularizando los registros históricos debido a que anteriormente no contábamos con una plataforma integral de control y transparencia.

Hoy ya disponemos de una plataforma pública donde cualquier ciudadano puede consultar ingresos, egresos, inventario, adquisiciones y avances institucionales.

Por ello queremos consultarte qué opción prefieres:

OPCIÓN 1
Regularizar tu historial de participación considerando el tiempo transcurrido desde tu incorporación.

OPCIÓN 2
Comenzar desde hoy con registro nuevo dentro de la plataforma y dejar el historial anterior únicamente como antecedente ciudadano.

OPCIÓN 3
Solicitar revisión de aportaciones anteriores que pudieran no estar registradas actualmente en el sistema.

Tu decisión será respetada en cualquiera de los casos.

Portal de transparencia:

https://patronatozacualpan.github.io/voluntarios/transparencia.html

Si deseas continuar apoyando esta causa ciudadana te agradeceremos responder este mensaje.

Puedes responder simplemente:

1 = Regularizar historial

2 = Comenzar desde hoy

3 = Revisar aportaciones anteriores

Muchas gracias por tu confianza y apoyo.

*Patronato Zacualpan Pro-equipamiento de Protección Civil*`;
}

if (calculo.estatusClave === "primera_aportacion") {

  return `Hola ${nombre}.

Gracias por confirmar tu participación como padrino del Patronato Zacualpan y pueblos circunvecinos.

Tu apoyo mensual comprometido es de ${promesa}.

Aún no aparece registrada tu primera aportación y queremos compartirte las opciones disponibles para realizarla:

1.- Entregarla directamente a Tesorería.

2.- Transferencia bancaria.

3.- Depósito en OXXO.

Cada aportación ayuda a fortalecer el equipamiento de Protección Civil Zacualpan y pueblos circunvecinos.

Muchas gracias por formar parte de esta causa.`;
}
   
if (calculo.estatusClave === "atrasado") {

 return `Hola ${nombre}.

*Recordatorio de aportación*

De acuerdo con nuestros registros, actualmente aparece una aportación pendiente por *${pendiente}*.

Cada peso aportado ayuda a fortalecer el equipamiento y la capacidad de respuesta de Protección Civil Zacualpan.

*Opciones para realizar tu aportación:*

*CUENTA SPIN OXXO*
4217 4701 2331 3559

*CLABE INTERBANCARIA*
7289 6900 0138 8899 56

*TITULAR TESORERA*
Miriam Camacho Martínez

Una vez realizado el depósito o transferencia, te agradeceremos compartir la captura o fotografía de tu comprobante.

También te invitamos a consultar nuestro portal de transparencia y seguimiento institucional:

https://patronatozacualpan.github.io/voluntarios/transparencia.html

Ahí podrás conocer los ingresos, egresos, inventario, avances y actividades que se realizan gracias al apoyo de la comunidad.

Gracias por continuar apoyando esta causa ciudadana en beneficio de Zacualpan.

*Patronato Zacualpan Pro-equipamiento de Protección Civil*`;

}

  if (calculo.estatusClave === "adelantado") {
    return `Hola ${nombre}, gracias por tu apoyo al Patronato Zacualpan. Tu aportación va adelantada y eso fortalece mucho la causa de Protección Civil.`;
  }

  if (calculo.estatusClave === "al_dia") {
    return `Hola ${nombre}, gracias por mantenerte al día con tu apoyo mensual de ${promesa} al Patronato Zacualpan. Tu generosidad equipa a nuestros héroes voluntarios.`;
  }

 return `Hola ${nombre}.

*Gracias por registrarte como donador del Patronato Zacualpan.*

Queremos confirmar tu apoyo mensual de *${promesa}* para fortalecer a Protección Civil Zacualpan.

*FORMAS DE REALIZAR TU APORTACIÓN*

1. Entregarla directamente con la tesorera.

2. Realizar transferencia bancaria.

3. Depositar en cualquier tienda OXXO.

*CUENTA SPIN OXXO*
4217 4701 2331 3559

*CLABE INTERBANCARIA*
7289 6900 0138 8899 56

*TITULAR TESORERA*
Miriam Camacho Martínez

*Gracias por unirte a este esfuerzo colectivo.*

Una vez realizado tu pago, agradecemos enviar fotografía o captura del comprobante.

No contamos con servicio de cobranza a domicilio, lo que nos permite destinar más recursos al equipamiento de Protección Civil Zacualpan.

*Cada aportación ayuda a salvar vidas.*

¡Muchas gracias por tu apoyo!`;
}

function normalizarTelefonoParaWhatsApp(telefono) {
  const limpio = String(telefono || "").replace(/\D/g, "");

  if (limpio.length === 10) return `52${limpio}`;
  if (limpio.length === 12 && limpio.startsWith("52")) return limpio;

  return limpio;
}

/* ---------------------------------------------------------
   Formatos
--------------------------------------------------------- */

function formatoMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------------------------------------
   Botones de validación
--------------------------------------------------------- */

function pintarBotonesValidacion(donador) {
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!usuario) return "";

  const rolesPermitidos = ["presidente", "tesorera", "secretario"];

  if (!rolesPermitidos.includes(usuario.rol)) return "";

  if (donador.estadoValidacion === "validado") {
    return "";
  }

  if (donador.estadoValidacion === "descartado") {
    return "";
  }

  return `
    <div class="acciones-validacion">
      <button class="btn-mini validar" onclick="validarDonador('${donador.id}')">
        Validar
      </button>

      <button class="btn-mini descartar" onclick="descartarDonador('${donador.id}')">
        Descartar
      </button>
    </div>
  `;
}

/* ---------------------------------------------------------
   Validar donador
--------------------------------------------------------- */

async function validarDonador(donadorId) {
  const firebaseTools = window.PCZ_FIREBASE;
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!firebaseTools?.db) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  if (!usuario) {
    alert("⛔ No hay sesión activa.");
    return;
  }

  const confirmar = confirm("¿Confirmas que este donador fue validado por llamada o WhatsApp?");

  if (!confirmar) return;

  try {
    await firebaseTools.db.collection("donadores").doc(donadorId).update({
      estadoValidacion: "validado",
      activo: true,
      actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
      validadoPorUid: usuario.uid,
      validadoPorNombre: usuario.nombre,
      validadoEn: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (firebaseTools.registrarLog) {
      await firebaseTools.registrarLog({
        accion: "validar_donador",
        descripcion: "Donador validado por mesa directiva.",
        usuarioUid: usuario.uid,
        usuarioNombre: usuario.nombre,
        modulo: "donadores",
        datos: {
          donadorId
        }
      });
    }

    alert("✅ Donador validado correctamente.");

    await cargarDonadores();

  } catch (error) {
    console.error("Error validando donador:", error);
    alert("⚠️ No se pudo validar el donador.");
  }
}

/* ---------------------------------------------------------
   Descartar donador
--------------------------------------------------------- */

async function descartarDonador(donadorId) {
  const firebaseTools = window.PCZ_FIREBASE;
  const usuario = window.PCZ_AUTH?.obtenerUsuarioActivo?.();

  if (!firebaseTools?.db) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  if (!usuario) {
    alert("⛔ No hay sesión activa.");
    return;
  }

  const confirmar = confirm("¿Confirmas que deseas descartar este registro?");

  if (!confirmar) return;

  try {
    await firebaseTools.db.collection("donadores").doc(donadorId).update({
      estadoValidacion: "descartado",
      activo: false,
      actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
      descartadoPorUid: usuario.uid,
      descartadoPorNombre: usuario.nombre,
      descartadoEn: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (firebaseTools.registrarLog) {
      await firebaseTools.registrarLog({
        accion: "descartar_donador",
        descripcion: "Donador descartado por mesa directiva.",
        usuarioUid: usuario.uid,
        usuarioNombre: usuario.nombre,
        modulo: "donadores",
        datos: {
          donadorId
        }
      });
    }

    alert("✅ Registro descartado correctamente.");

    await cargarDonadores();

  } catch (error) {
    console.error("Error descartando donador:", error);
    alert("⚠️ No se pudo descartar el donador.");
  }
}



}
    
async function regularizarHistorial(donadorId) {

  const { db } = window.PCZ_FIREBASE;

  await db
    .collection("donadores")
    .doc(donadorId)
    .update({

      decisionRegularizacion:
        "regularizar_historial",

      fechaRegularizacion:
        firebase.firestore.FieldValue.serverTimestamp()

    });

  await cargarDonadores();
}

async function comenzarDesdeHoy(donadorId) {

  const { db } = window.PCZ_FIREBASE;

  await db
    .collection("donadores")
    .doc(donadorId)
    .update({

      decisionRegularizacion:
        "comenzar_desde_hoy",

      fechaRegularizacion:
        firebase.firestore.FieldValue.serverTimestamp()

    });

  await cargarDonadores();
}

async function revisarAportaciones(donadorId) {

  const { db } = window.PCZ_FIREBASE;

  await db
    .collection("donadores")
    .doc(donadorId)
    .update({

      decisionRegularizacion:
        "revisar_aportaciones",

      fechaRegularizacion:
        firebase.firestore.FieldValue.serverTimestamp()

    });

  await cargarDonadores();
}
