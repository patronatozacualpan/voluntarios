/* =========================================================
   main.js
   Patronato Zacualpan Pro-equipamiento de Protección Civil
   ========================================================= */

/* ---------------------------------------------------------
   FRASES DINÁMICAS
--------------------------------------------------------- */

const FRASES_PORTADA = [
  "Tu apoyo equipa a nuestros héroes voluntarios.",
  "Cada peso puede convertirse en una herramienta para salvar vidas.",
  "Un Zacualpan unido responde mejor ante la emergencia.",
  "La solidaridad también rescata vidas.",
  "Equipar a Protección Civil es proteger a todos.",
  "Un peso al día puede hacer una gran diferencia."
];

let indiceFrase = 0;

function iniciarFrasesDinamicas() {
  const fraseElemento = document.getElementById("fraseDinamica");

  if (!fraseElemento) return;

  fraseElemento.textContent = FRASES_PORTADA[indiceFrase];

  setInterval(() => {
    indiceFrase++;

    if (indiceFrase >= FRASES_PORTADA.length) {
      indiceFrase = 0;
    }

    fraseElemento.classList.add("fade-out");

    setTimeout(() => {
      fraseElemento.textContent = FRASES_PORTADA[indiceFrase];
      fraseElemento.classList.remove("fade-out");
      fraseElemento.classList.add("fade-in");

      setTimeout(() => {
        fraseElemento.classList.remove("fade-in");
      }, 500);

    }, 350);

  }, 3000);
}

/* ---------------------------------------------------------
   SCROLL SUAVE
--------------------------------------------------------- */

function activarScrollSuave() {

  const enlaces = document.querySelectorAll('a[href^="#"]');

  enlaces.forEach((enlace) => {

    enlace.addEventListener("click", (event) => {

      const destinoId = enlace.getAttribute("href");

      if (!destinoId || destinoId === "#") return;

      const destino = document.querySelector(destinoId);

      if (!destino) return;

      event.preventDefault();

      destino.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    });

  });

}

/* ---------------------------------------------------------
   MOSTRAR CAMPO OTRA CANTIDAD
--------------------------------------------------------- */

function activarCantidadOtra() {

  const selectCantidad = document.getElementById("donadorCantidad");
  const campoCantidadOtra = document.getElementById("campoCantidadOtra");

  if (!selectCantidad || !campoCantidadOtra) return;

  selectCantidad.addEventListener("change", () => {

    if (selectCantidad.value === "otra") {
      campoCantidadOtra.classList.remove("hidden");
    } else {
      campoCantidadOtra.classList.add("hidden");
    }

  });

}

/* ---------------------------------------------------------
   UTILIDADES
--------------------------------------------------------- */

function limpiarTelefono(telefono) {
  return String(telefono || "").replace(/\D/g, "");
}

function validarTelefonoMexicano(telefono) {
  return limpiarTelefono(telefono).length === 10;
}

function mostrarMensajeTemporal(elemento, tiempo = 5000) {

  if (!elemento) return;

  elemento.classList.remove("hidden");

  setTimeout(() => {
    elemento.classList.add("hidden");
  }, tiempo);

}

function limpiarFormulario(formulario) {
  if (!formulario) return;
  formulario.reset();
}

function scrollAlInicio() {

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}

/* ---------------------------------------------------------
   VALIDACIÓN FORMULARIO DONADOR
--------------------------------------------------------- */

function activarFormularioDonador() {

  const formDonador = document.getElementById("formDonador");

  if (!formDonador) return;

  formDonador.addEventListener("submit", (event) => {

    event.preventDefault();

    const nombre = document.getElementById("donadorNombre").value.trim();

    const telefono = limpiarTelefono(
      document.getElementById("donadorTelefono").value
    );

    const poblacion = document.getElementById("donadorPoblacion").value.trim();

    const cantidad = document.getElementById("donadorCantidad").value;

    if (!nombre || !telefono || !poblacion || !cantidad) {

      alert("⚠️ Completa todos los campos obligatorios.");
      return;

    }

    if (!validarTelefonoMexicano(telefono)) {

      alert("⚠️ El teléfono debe tener 10 dígitos.");
      return;

    }

    const mensaje = document.getElementById("mensajeDonador");

    mostrarMensajeTemporal(mensaje);

    limpiarFormulario(formDonador);

    scrollAlInicio();

    console.log("Donador listo para Firebase");

  });

}

/* ---------------------------------------------------------
   VALIDACIÓN FORMULARIO OPINIÓN
--------------------------------------------------------- */

function activarFormularioOpinion() {

  const formOpinion = document.getElementById("formOpinion");

  if (!formOpinion) return;

  formOpinion.addEventListener("submit", (event) => {

    event.preventDefault();

    const poblacion = document.getElementById("opinionPoblacion").value.trim();

    const opinion = document.getElementById("opinionTexto").value.trim();

    if (!poblacion || !opinion) {

      alert("⚠️ Completa los campos obligatorios.");
      return;

    }

    if (opinion.length < 10) {

      alert("⚠️ Escribe una opinión más detallada.");
      return;

    }

    const mensaje = document.getElementById("mensajeOpinion");

    mostrarMensajeTemporal(mensaje);

    limpiarFormulario(formOpinion);

    scrollAlInicio();

    console.log("Opinión lista para Firebase");

  });

}

/* ---------------------------------------------------------
   INICIALIZACIÓN GENERAL
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  iniciarFrasesDinamicas();

  activarScrollSuave();

  activarCantidadOtra();

  activarFormularioDonador();

  activarFormularioOpinion();

});
