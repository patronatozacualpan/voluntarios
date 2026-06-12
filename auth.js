/* =========================================================
   auth.js
   Autenticación y control de roles
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  inicializarAuth();
});

function inicializarAuth() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.auth || !firebaseTools.db) {
    console.warn("Firebase aún no está listo para autenticación.");
    return;
  }

  const { auth } = firebaseTools;

  const formLogin = document.getElementById("formLogin");
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");
  const btnRecuperarPassword = document.getElementById("btnRecuperarPassword");

  if (formLogin) {
    formLogin.addEventListener("submit", iniciarSesion);
  }

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", cerrarSesion);
  }

  if (btnRecuperarPassword) {
    btnRecuperarPassword.addEventListener("click", recuperarPassword);
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await cargarPerfilUsuario(user);
    } else {
      mostrarLogin();
    }
  });
}

/* ---------------------------------------------------------
   Iniciar sesión
--------------------------------------------------------- */

async function iniciarSesion(event) {

  event.preventDefault();

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.auth) {

    alert("⚠️ Firebase no está configurado.");

    return;
  }

  const { auth } = firebaseTools;

  const email =
    document.getElementById("loginEmail")
    .value
    .trim();

  const password =
    document.getElementById("loginPassword")
    .value
    .trim();

  if (!email || !password) {

    alert(
      "⚠️ Ingresa correo y contraseña."
    );

    return;
  }

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

  } catch (error) {

    console.error(
      "Error iniciando sesión:",
      error
    );

    alert(
      "ERROR FIREBASE:\n\n" +
      error.code +
      "\n\n" +
      error.message
    );
  }
}

/* ---------------------------------------------------------
   Cargar perfil del usuario
--------------------------------------------------------- */

async function cargarPerfilUsuario(user) {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.db) {
    alert("⚠️ Firestore no está disponible.");
    return;
  }

  const { db, registrarLog } = firebaseTools;

  try {
    const doc = await db.collection("usuarios").doc(user.uid).get();

    if (!doc.exists) {
      alert("⛔ Tu usuario no tiene perfil administrativo autorizado.");
      await cerrarSesion();
      return;
    }

    const perfil = doc.data();

    if (!perfil.activo) {
      alert("⛔ Tu usuario está desactivado.");
      await cerrarSesion();
      return;
    }

    const usuarioActivo = {
      uid: user.uid,
      email: user.email,
      nombre: perfil.nombre || user.email,
      rol: perfil.rol || "sin_rol",
      telefono: perfil.telefono || ""
    };

    localStorage.setItem("pcz_usuario", JSON.stringify(usuarioActivo));

    window.PCZ_USUARIO = usuarioActivo;

    await registrarLog({
      accion: "login",
      descripcion: `Inicio de sesión: ${usuarioActivo.nombre}`,
      usuarioUid: usuarioActivo.uid,
      usuarioNombre: usuarioActivo.nombre,
      modulo: "auth",
      datos: {
        rol: usuarioActivo.rol,
        email: usuarioActivo.email
      }
    });

    mostrarPanel(usuarioActivo);

  } catch (error) {
    console.error("Error cargando perfil:", error);
    alert("⚠️ No se pudo cargar el perfil del usuario.");
  }
}


/* ---------------------------------------------------------
   Mostrar panel
--------------------------------------------------------- */

function mostrarPanel(usuario) {
  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");
  const usuarioActivoTexto = document.getElementById("usuarioActivoTexto");

  if (loginSection) loginSection.classList.add("hidden");
  if (panelSection) panelSection.classList.remove("hidden");
  if (btnCerrarSesion) btnCerrarSesion.classList.remove("hidden");

  if (usuarioActivoTexto) {
    usuarioActivoTexto.textContent = `${usuario.nombre} | Rol: ${usuario.rol}`;
  }

  aplicarPermisosVisuales(usuario.rol);

  if (typeof cargarDashboardPanel === "function") {
    cargarDashboardPanel();
  }
}

/* ---------------------------------------------------------
   Mostrar login
--------------------------------------------------------- */

function mostrarLogin() {
  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");

  if (loginSection) loginSection.classList.remove("hidden");
  if (panelSection) panelSection.classList.add("hidden");
  if (btnCerrarSesion) btnCerrarSesion.classList.add("hidden");

  localStorage.removeItem("pcz_usuario");
  window.PCZ_USUARIO = null;
}

/* ---------------------------------------------------------
   Aplicar permisos visuales
--------------------------------------------------------- */

function aplicarPermisosVisuales(rol) {
  const elementosSoloTesorera = document.querySelectorAll(".solo-tesorera");

  elementosSoloTesorera.forEach((elemento) => {
    if (rol === "tesorera") {
      elemento.classList.remove("hidden");
    } else {
      elemento.classList.add("hidden");
    }
  });
}

/* ---------------------------------------------------------
   Cerrar sesión
--------------------------------------------------------- */

async function cerrarSesion() {
  const firebaseTools = window.PCZ_FIREBASE;

  try {
    const usuario = window.PCZ_USUARIO;

    if (firebaseTools?.registrarLog && usuario) {
      await firebaseTools.registrarLog({
        accion: "logout",
        descripcion: `Cierre de sesión: ${usuario.nombre}`,
        usuarioUid: usuario.uid,
        usuarioNombre: usuario.nombre,
        modulo: "auth",
        datos: {
          rol: usuario.rol,
          email: usuario.email
        }
      });
    }

    if (firebaseTools?.auth) {
      await firebaseTools.auth.signOut();
    }

 localStorage.removeItem("pcz_usuario");
window.PCZ_USUARIO = null;

window.location.href = "index.html";

  } catch (error) {
    console.error("Error cerrando sesión:", error);
    alert("⚠️ No se pudo cerrar sesión correctamente.");
  }
}

/* ---------------------------------------------------------
   Recuperar contraseña
--------------------------------------------------------- */

async function recuperarPassword() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools || !firebaseTools.auth) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  const email = document.getElementById("loginEmail")?.value.trim();

  if (!email) {
    alert("Escribe tu correo en el campo de correo y vuelve a intentarlo.");
    return;
  }

  try {
    await firebaseTools.auth.sendPasswordResetEmail(email);
    alert("✅ Se envió un correo para recuperar tu contraseña.");
  } catch (error) {
    console.error("Error enviando recuperación:", error);
    alert("⚠️ No se pudo enviar el correo de recuperación.");
  }
}

/* ---------------------------------------------------------
   Utilidades globales
--------------------------------------------------------- */

function obtenerUsuarioActivo() {
  if (window.PCZ_USUARIO) return window.PCZ_USUARIO;

  const local = localStorage.getItem("pcz_usuario");

  if (!local) return null;

  try {
    return JSON.parse(local);
  } catch {
    return null;
  }
}

function usuarioEsTesorera() {
  const usuario = obtenerUsuarioActivo();
  return usuario?.rol === "tesorera";
}

function usuarioEsMesaDirectiva() {
  const usuario = obtenerUsuarioActivo();

 return [

  "presidente",

  "tesorera",

  "secretario",

  "vocal1",

  "vocal2",

  "comandante_operativo"

].includes(usuario?.rol);
}

window.PCZ_AUTH = {
  obtenerUsuarioActivo,
  usuarioEsTesorera,
  usuarioEsMesaDirectiva,
  cerrarSesion
};
