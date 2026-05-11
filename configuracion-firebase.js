/* =========================================================
   configuracion-firebase.js
   Patronato Zacualpan Pro-equipamiento de Protección Civil
   ========================================================= */

/* =========================================================
   IMPORTANTE

   ESTE ARCHIVO CENTRALIZA:
   - Firebase App
   - Firestore
   - Authentication
   - Storage

   AQUÍ SE PEGARÁ LA CONFIGURACIÓN REAL
   CUANDO EL PROYECTO FIREBASE ESTÉ CREADO.
========================================================= */

/* ---------------------------------------------------------
   1. Verificar carga Firebase
--------------------------------------------------------- */

if (typeof firebase === "undefined") {

  console.error("Firebase SDK no fue cargado.");

} else {

  console.log("Firebase SDK cargado correctamente.");

}

/* ---------------------------------------------------------
   2. Configuración Firebase
   REEMPLAZAR CON LOS DATOS REALES DEL PROYECTO
--------------------------------------------------------- */

const firebaseConfig = {

  apiKey: "REEMPLAZAR_API_KEY",

  authDomain: "REEMPLAZAR_AUTH_DOMAIN",

  projectId: "REEMPLAZAR_PROJECT_ID",

  storageBucket: "REEMPLAZAR_STORAGE_BUCKET",

  messagingSenderId: "REEMPLAZAR_MESSAGING_SENDER_ID",

  appId: "REEMPLAZAR_APP_ID"

};

/* ---------------------------------------------------------
   3. Inicializar Firebase
--------------------------------------------------------- */

let app = null;
let db = null;
let auth = null;
let storage = null;

try {

  app = firebase.initializeApp(firebaseConfig);

  db = firebase.firestore();

  auth = firebase.auth();

  storage = firebase.storage();

  console.log("Firebase inicializado correctamente.");

} catch (error) {

  console.error("Error inicializando Firebase:", error);

}

/* ---------------------------------------------------------
   4. Configuración Firestore
--------------------------------------------------------- */

if (db) {

  db.settings({
    ignoreUndefinedProperties: true
  });

}

/* ---------------------------------------------------------
   5. Utilidades generales Firestore
--------------------------------------------------------- */

function obtenerTimestampServidor() {

  return firebase.firestore.FieldValue.serverTimestamp();

}

function generarIdAleatorio(longitud = 20) {

  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let resultado = "";

  for (let i = 0; i < longitud; i++) {

    resultado += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );

  }

  return resultado;

}

/* ---------------------------------------------------------
   6. Normalizar teléfonos México
--------------------------------------------------------- */

function limpiarTelefono(telefono) {

  return String(telefono || "")
    .replace(/\D/g, "");

}

function normalizarTelefonoMexico(telefono) {

  const limpio = limpiarTelefono(telefono);

  if (limpio.length === 10) {

    return `52${limpio}`;

  }

  if (limpio.length === 12 && limpio.startsWith("52")) {

    return limpio;

  }

  return limpio;

}

/* ---------------------------------------------------------
   7. Sanitizar texto
--------------------------------------------------------- */

function sanitizarTexto(texto) {

  return String(texto || "")
    .trim()
    .replace(/[<>]/g, "");

}

/* ---------------------------------------------------------
   8. Obtener fecha legible
--------------------------------------------------------- */

function obtenerFechaLegible(fecha = new Date()) {

  return fecha.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

}

/* ---------------------------------------------------------
   9. Formatear moneda MXN
--------------------------------------------------------- */

function formatearMonedaMXN(cantidad) {

  const numero = Number(cantidad || 0);

  return numero.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });

}

/* ---------------------------------------------------------
   10. Formatear folios
--------------------------------------------------------- */

function formatearFolio(numero) {

  return String(numero).padStart(6, "0");

}

/* ---------------------------------------------------------
   11. Validaciones generales
--------------------------------------------------------- */

function esMontoValido(valor) {

  const numero = Number(valor);

  return !isNaN(numero) && numero > 0;

}

function esTelefonoValido(telefono) {

  return limpiarTelefono(telefono).length === 10;

}

/* ---------------------------------------------------------
   12. Logs básicos
--------------------------------------------------------- */

async function registrarLog({

  accion = "",
  descripcion = "",
  usuarioUid = "",
  usuarioNombre = "",
  modulo = "",
  datos = {}

}) {

  try {

    if (!db) return;

    await db.collection("logs").add({

      accion,
      descripcion,
      usuarioUid,
      usuarioNombre,
      modulo,
      datos,
      creadoEn: obtenerTimestampServidor()

    });

    console.log("Log registrado:", accion);

  } catch (error) {

    console.error("Error registrando log:", error);

  }

}

/* ---------------------------------------------------------
   13. Subida genérica de archivos
--------------------------------------------------------- */

async function subirArchivoStorage({

  archivo,
  ruta

}) {

  try {

    if (!storage) {
      throw new Error("Storage no inicializado.");
    }

    if (!archivo) {
      throw new Error("Archivo no proporcionado.");
    }

    const referencia = storage.ref().child(ruta);

    const snapshot = await referencia.put(archivo);

    const url = await snapshot.ref.getDownloadURL();

    return {
      ok: true,
      url
    };

  } catch (error) {

    console.error("Error subiendo archivo:", error);

    return {
      ok: false,
      error
    };

  }

}

/* ---------------------------------------------------------
   14. Variables globales públicas
--------------------------------------------------------- */

window.PCZ_FIREBASE = {

  app,
  db,
  auth,
  storage,

  obtenerTimestampServidor,
  generarIdAleatorio,

  limpiarTelefono,
  normalizarTelefonoMexico,
  sanitizarTexto,

  obtenerFechaLegible,
  formatearMonedaMXN,
  formatearFolio,

  esMontoValido,
  esTelefonoValido,

  registrarLog,

  subirArchivoStorage

};

console.log("PCZ_FIREBASE listo.");
