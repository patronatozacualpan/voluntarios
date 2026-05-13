/* =========================================================
   opiniones_admin.js
   Panel administrativo de opiniones y encuestas
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    cargarOpinionesAdmin();
  }, 900);
});

async function cargarOpinionesAdmin() {
  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) {
    alert("⚠️ Firebase no está configurado.");
    return;
  }

  const { db } = firebaseTools;
  const tbody = document.getElementById("tablaOpinionesBody");

  if (!tbody) return;

  try {
    const snap = await db
      .collection("opiniones")
      .orderBy("creadoEn", "desc")
      .limit(100)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">No hay opiniones registradas.</td>
        </tr>
      `;

      actualizarResumenOpiniones([]);
      return;
    }

    const opiniones = [];

    snap.forEach((doc) => {
      opiniones.push({
        id: doc.id,
        ...doc.data()
      });
    });

    pintarOpiniones(opiniones);
    actualizarResumenOpiniones(opiniones);

  } catch (error) {
    console.error("Error cargando opiniones:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="9">⚠️ No se pudieron cargar las opiniones.</td>
      </tr>
    `;
  }
}

function pintarOpiniones(opiniones) {
  const tbody = document.getElementById("tablaOpinionesBody");

  if (!tbody) return;

  tbody.innerHTML = "";

  opiniones.forEach((opinion) => {
    const fecha = opinion.creadoEn?.toDate
      ? opinion.creadoEn.toDate().toLocaleDateString("es-MX")
      : "Sin fecha";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(fecha)}</td>
      <td>${escapeHtml(opinion.nombre || "Anónimo")}</td>
      <td>${escapeHtml(opinion.telefono || "")}</td>
      <td>${escapeHtml(opinion.poblacion || "")}</td>
      <td>${formatearApoyo(opinion.apoyaCausa)}</td>
      <td>${formatearNecesidad(opinion.necesidadUrgente)}</td>
      <td>${formatearQuiereDonar(opinion.quiereSerDonador)}</td>
      <td>${"★".repeat(Number(opinion.calificacion || 0))}</td>
      <td>${escapeHtml(opinion.opinion || "")}</td>
    `;

    tbody.appendChild(tr);
  });
}

function actualizarResumenOpiniones(opiniones) {
  const totalOpiniones = opiniones.length;

  const sumaCalificacion = opiniones.reduce((acc, item) => {
    return acc + Number(item.calificacion || 0);
  }, 0);

  const promedio = totalOpiniones
    ? (sumaCalificacion / totalOpiniones).toFixed(1)
    : "0";

  const interesados = opiniones.filter((item) => {
    return item.quiereSerDonador === "si";
  }).length;

  const totalEl = document.getElementById("totalOpiniones");
  const promedioEl = document.getElementById("promedioCalificacion");
  const interesadosEl = document.getElementById("interesadosDonar");

  if (totalEl) totalEl.textContent = totalOpiniones;
  if (promedioEl) promedioEl.textContent = promedio;
  if (interesadosEl) interesadosEl.textContent = interesados;
}

function formatearApoyo(valor) {
  const mapa = {
    si: "Sí",
    no: "No",
    necesito_mas_informacion: "Necesita más información"
  };

  return mapa[valor] || valor || "";
}

function formatearNecesidad(valor) {
  const mapa = {
    herramientas_rescate: "Herramientas de rescate",
    equipo_medico: "Equipo médico",
    uniformes_proteccion: "Uniformes/protección",
    radiocomunicacion: "Radiocomunicación",
    vehiculo_apoyo: "Vehículo de apoyo",
    capacitacion: "Capacitación",
    otro: "Otro"
  };

  return mapa[valor] || valor || "";
}

function formatearQuiereDonar(valor) {
  const mapa = {
    si: "Sí",
    tal_vez: "Tal vez",
    no_por_el_momento: "No por ahora"
  };

  return mapa[valor] || valor || "";
}

function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
