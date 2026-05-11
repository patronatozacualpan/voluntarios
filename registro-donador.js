/* =========================================================
   registro-donador.js
   Registro público de donadores
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const formDonador = document.getElementById("formDonador");

  if (!formDonador) return;

  formDonador.addEventListener("submit", registrarDonador);
});

async function registrarDonador(event) {
  event.preventDefault();

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.db) {
    alert("⚠️ Firebase aún no está configurado.");
    return;
  }

  const {
    db,
    obtenerTimestampServidor,
    limpiarTelefono,
    normalizarTelefonoMexico,
    sanitizarTexto,
    esTelefonoValido,
    registrarLog
  } = firebaseTools;

  const nombre = sanitizarTexto(document.getElementById("donadorNombre").value);
  const telefono = limpiarTelefono(document.getElementById("donadorTelefono").value);
  const telefonoNormalizado = normalizarTelefonoMexico(telefono);
  const poblacion = sanitizarTexto(document.getElementById("donadorPoblacion").value);
  const cantidadSeleccionada = document.getElementById("donadorCantidad").value;
  const cantidadOtra = document.getElementById("donadorCantidadOtra")?.value || "";
  const aceptaWhatsApp = document.getElementById("aceptaWhatsApp")?.checked || false;

  let promesaMensual = cantidadSeleccionada === "otra"
    ? Number(cantidadOtra)
    : Number(cantidadSeleccionada);

  if (!nombre || !telefono || !poblacion || !promesaMensual) {
    alert("⚠️ Completa todos los campos obligatorios.");
    return;
  }

  if (!esTelefonoValido(telefono)) {
    alert("⚠️ El teléfono debe tener 10 dígitos.");
    return;
  }

  if (promesaMensual <= 0) {
    alert("⚠️ La cantidad mensual debe ser mayor a cero.");
    return;
  }

  try {
    const existe = await db
      .collection("donadores")
      .where("telefono", "==", telefono)
      .limit(1)
      .get();

    if (!existe.empty) {
      alert("⚠️ Este teléfono ya está registrado como donador.");
      return;
    }

    const nuevoDonador = {
      nombre,
      telefono,
      telefonoNormalizado,
      poblacion,
      promesaMensual,
      aceptaWhatsApp,
      recordatoriosActivos: aceptaWhatsApp,
      estadoValidacion: "pendiente",
      activo: false,
      origenRegistro: "web_publica",
      totalAportado: 0,
      ultimoPago: null,
      diaPagoPreferido: new Date().getDate(),
      creadoEn: obtenerTimestampServidor(),
      actualizadoEn: obtenerTimestampServidor()
    };

    const docRef = await db.collection("donadores").add(nuevoDonador);

    await registrarLog({
      accion: "crear_donador",
      descripcion: `Nuevo donador registrado desde web pública: ${nombre}`,
      modulo: "donadores",
      datos: {
        donadorId: docRef.id,
        nombre,
        telefono,
        poblacion,
        promesaMensual
      }
    });

    const mensaje = document.getElementById("mensajeDonador");

    if (mensaje) {
      mensaje.classList.remove("hidden");

      setTimeout(() => {
        mensaje.classList.add("hidden");
      }, 5000);
    }

    formDonador.reset();

    const campoOtra = document.getElementById("campoCantidadOtra");
    if (campoOtra) campoOtra.classList.add("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {
    console.error("Error registrando donador:", error);
    alert("⚠️ No se pudo registrar el donador. Intenta nuevamente.");
  }
}
