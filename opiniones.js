/* =========================================================
   opiniones.js
   Registro público de opiniones y encuestas
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const formOpinion = document.getElementById("formOpinion");

  if (!formOpinion) return;

  formOpinion.addEventListener("submit", guardarOpinion);
});

async function guardarOpinion(event) {
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

  const nombre = sanitizarTexto(document.getElementById("opinionNombre")?.value || "");
  const telefonoCapturado = document.getElementById("opinionTelefono")?.value || "";
  const telefono = limpiarTelefono(telefonoCapturado);
  const telefonoNormalizado = telefono ? normalizarTelefonoMexico(telefono) : "";
  const poblacion = sanitizarTexto(document.getElementById("opinionPoblacion")?.value || "");
  const apoyaCausa = document.getElementById("apoyaCausa")?.value || "";
  const necesidadUrgente = document.getElementById("necesidadUrgente")?.value || "";
  const quiereSerDonador = document.getElementById("quiereSerDonador")?.value || "";
  const calificacion = Number(document.getElementById("calificacion")?.value || 0);
  const opinion = sanitizarTexto(document.getElementById("opinionTexto")?.value || "");

  if (!poblacion || !apoyaCausa || !necesidadUrgente || !quiereSerDonador || !calificacion || !opinion) {
    alert("⚠️ Completa los campos obligatorios de la encuesta.");
    return;
  }

  if (telefono && !esTelefonoValido(telefono)) {
    alert("⚠️ Si escribes teléfono, debe tener 10 dígitos.");
    return;
  }

  if (opinion.length < 10) {
    alert("⚠️ Escribe una opinión un poco más detallada.");
    return;
  }

  if (calificacion < 1 || calificacion > 5) {
    alert("⚠️ La calificación debe estar entre 1 y 5.");
    return;
  }

  try {
    const nuevaOpinion = {
      nombre,
      telefono,
      telefonoNormalizado,
      poblacion,
      opinion,
      apoyaCausa,
      necesidadUrgente,
      quiereSerDonador,
      calificacion,
      estadoRevision: "pendiente",
      origen: "web_publica",
      creadoEn: obtenerTimestampServidor()
    };

    const docRef = await db.collection("opiniones").add(nuevaOpinion);

    await registrarLog({
      accion: "crear_opinion",
      descripcion: "Nueva opinión registrada desde web pública.",
      modulo: "opiniones",
      datos: {
        opinionId: docRef.id,
        poblacion,
        apoyaCausa,
        necesidadUrgente,
        quiereSerDonador,
        calificacion
      }
    });

    const mensaje = document.getElementById("mensajeOpinion");

    if (mensaje) {
      mensaje.classList.remove("hidden");

      setTimeout(() => {
        mensaje.classList.add("hidden");
      }, 5000);
    }

    event.target.reset();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {
    console.error("Error guardando opinión:", error);
    alert("⚠️ No se pudo guardar tu opinión. Intenta nuevamente.");
  }
}
