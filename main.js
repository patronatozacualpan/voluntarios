/* =========================================================
   main.js
   Patronato Zacualpan Pro-equipamiento de Protección Civil
   Funciones visuales generales
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
    indiceFrase = (indiceFrase + 1) % FRASES_PORTADA.length;

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
  const inputCantidadOtra = document.getElementById("donadorCantidadOtra");

  if (!selectCantidad || !campoCantidadOtra) return;

  selectCantidad.addEventListener("change", () => {
    if (selectCantidad.value === "otra") {
      campoCantidadOtra.classList.remove("hidden");

      if (inputCantidadOtra) {
        inputCantidadOtra.setAttribute("required", "required");
        inputCantidadOtra.focus();
      }
    } else {
      campoCantidadOtra.classList.add("hidden");

      if (inputCantidadOtra) {
        inputCantidadOtra.removeAttribute("required");
        inputCantidadOtra.value = "";
      }
    }
  });
}

/* ---------------------------------------------------------
   UTILIDADES VISUALES
--------------------------------------------------------- */

function mostrarMensajeTemporal(elemento, tiempo = 5000) {
  if (!elemento) return;

  elemento.classList.remove("hidden");

  setTimeout(() => {
    elemento.classList.add("hidden");
  }, tiempo);
}

function scrollAlInicio() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* ---------------------------------------------------------
   INICIALIZACIÓN GENERAL
   Importante:
   main.js NO guarda formularios.
   registro-donador.js guarda donadores.
   opiniones.js guarda opiniones.
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  iniciarFrasesDinamicas();
  activarScrollSuave();
  activarCantidadOtra();
});

/* ---------------------------------------------------------
   EXPONER UTILIDADES OPCIONALES
--------------------------------------------------------- */

window.PCZ_MAIN = {
  mostrarMensajeTemporal,
  scrollAlInicio
};



/* =====================================
   MENU MOVIL COMPACTO
===================================== */

const mobileMenuToggle =
  document.getElementById("mobileMenuToggle");

const mainNav =
  document.getElementById("mainNav");

/* =====================================
   ABRIR / CERRAR MENU
===================================== */

if (mobileMenuToggle && mainNav){

 mobileMenuToggle.addEventListener("click", () => {

  mainNav.classList.toggle("active");

  /* ICONO DINAMICO */

  if (mainNav.classList.contains("active")){

    mobileMenuToggle.innerHTML = "✕ Cerrar menú";

  } else {

    mobileMenuToggle.innerHTML = "☰ Navegación rápida";

  }

});

}




/* =====================================
   AUTO CERRAR MENU AL TOCAR LINK
===================================== */

const navLinks =
  document.querySelectorAll(".main-nav a");

navLinks.forEach(link => {

  link.addEventListener("click", () => {

    if (window.innerWidth <= 768){

      mainNav.classList.remove("active");

    }

  });

});


/* =====================================
   CERRAR MENU AL TOCAR FUERA
===================================== */

document.addEventListener("click", (e) => {

  const clickDentroMenu =
    mainNav.contains(e.target);

  const clickBoton =
    mobileMenuToggle.contains(e.target);

  if (
    !clickDentroMenu &&
    !clickBoton &&
    window.innerWidth <= 768
  ){

    mainNav.classList.remove("active");

    mobileMenuToggle.innerHTML =
      "☰ Navegación rápida";

  }

});
