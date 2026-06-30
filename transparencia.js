let PUBLICACION_ACTIVA = null;


/* =========================================================
   transparencia.js
   Transparencia y Participación Comunitaria
   Patronato Zacualpan
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
     cargarTimelineOperativo();
    cargarDashboardPublico();
    cargarInventarioPublico();
     cargarMetasComunitarias();
     cargarPublicaciones();
     cargarReconocimientosPublicos();
  }, 700);
});

/* =========================================================
   DASHBOARD PUBLICO
========================================================= */

async function cargarDashboardPublico() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  try {

    const [
      ingresosSnap,
      egresosSnap,
      inventarioSnap
    ] = await Promise.all([

      db.collection("ingresos").get(),

      db.collection("egresos").get(),

      db.collection("inventario_equipo")
        .where("publico", "==", true)
        .get()

    ]);

    /* =========================================
       INGRESOS
    ========================================= */

    let totalIngresos = 0;

    ingresosSnap.forEach((doc) => {

      const d = doc.data();

      totalIngresos += Number(d.monto || 0);

    });

    /* =========================================
       EGRESOS
    ========================================= */

    let totalEgresos = 0;

    egresosSnap.forEach((doc) => {

      const d = doc.data();

      totalEgresos += Number(d.monto || 0);

    });

    /* =========================================
       INVENTARIO
    ========================================= */

    let equipos = 0;

    let entregados = 0;

    let inversionEquipo = 0;

    inventarioSnap.forEach((doc) => {

      const d = doc.data();

      equipos++;

      inversionEquipo += Number(
        d.costoTotal || 0
      );

      if (d.estado === "entregado") {
        entregados++;
      }

    });

    /* =========================================
       SALDO REAL
    ========================================= */

    const saldoDisponible =
      totalIngresos - totalEgresos;

    /* =========================================
       PINTAR
    ========================================= */

    setTexto(
      "dashboardTotalRecaudado",
      formatoMoneda(totalIngresos)
    );

    setTexto(
      "dashboardEquipoRegistrado",
      equipos
    );

    setTexto(
      "dashboardEquipoEntregado",
      entregados
    );

    setTexto(
      "dashboardParticipacion",
      "Activa"
    );

    /* =========================================
       NUEVAS METRICAS OPCIONALES
    ========================================= */

    setTexto(
      "dashboardInvertido",
      formatoMoneda(inversionEquipo)
    );

    setTexto(
      "dashboardSaldoDisponible",
      formatoMoneda(saldoDisponible)
    );

  } catch (error) {

    console.error(
      "Error cargando dashboard público:",
      error
    );
  }
}

/* =========================================================
   INVENTARIO PUBLICO
========================================================= */

async function cargarInventarioPublico() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor = document.getElementById(
    "contenedorInventarioPublico"
  );

  if (!contenedor) return;

  try {

    const snap = await db
      .collection("inventario_equipo")
      .where("publico", "==", true)
      .orderBy("creadoEn", "desc")
      .limit(20)
      .get();

    if (snap.empty) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            Aún no hay equipo público registrado.
          </p>

        </div>

      `;

      return;
    }

    contenedor.innerHTML = "";

    let totalInvertido = 0;
    let totalRegistrados = 0;
    let totalEntregados = 0;

    snap.forEach((doc) => {

      const d = doc.data();

      totalRegistrados++;

      totalInvertido += Number(
        d.costoTotal || 0
      );

      if (d.estado === "entregado") {
        totalEntregados++;
      }

      const card = document.createElement("div");

      card.className = "inventory-card";

      card.innerHTML = `

        ${
          (d.imagenUrl || d.fotoEquipoUrl)

            ? `

              <img
                src="${d.imagenUrl || d.fotoEquipoUrl}"
                alt="Equipo"
                class="inventory-image"
                onclick="abrirModalImagen('${d.imagenUrl || d.fotoEquipoUrl}')"
              >

            `

            : `

              <div class="inventory-placeholder">

                📍

                <span>
                  Evidencia visual pendiente
                  de documentación
                </span>

              </div>

            `
        }

        <div class="inventory-card-body">

          <p class="inventory-label">

            ${escapeHtml(
              formatearCategoria(
                d.categoria || ""
              )
            )}

          </p>

          <h3>

            ${escapeHtml(
              d.nombreEquipo || ""
            )}

          </h3>

          <p class="inventory-description">
<button
  class="secondary-btn"
  style="
    margin-top:10px;
    width:100%;
  "
>
  Leer más
</button>
            ${
              escapeHtml(
                d.descripcion || ""
              ) || "Sin descripción."
            }

          </p>

          <div class="inventory-data">

            <p>

              <strong>Cantidad:</strong>

              ${Number(
                d.cantidad || 0
              )}

            </p>

            <p>

              <strong>Inversión:</strong>

              ${formatoMoneda(
                d.costoTotal || 0
              )}

            </p>

            <div
              class="
                status-chip
                status-${d.estado || ""}
              "
            >

              ${escapeHtml(
                formatearEstado(
                  d.estado || ""
                )
              )}

            </div>

            ${
              d.comprobanteUrl

                ? `

                  <a
                    href="${d.comprobanteUrl}"
                    target="_blank"
                    class="btn-evidencia"
                  >
                    Ver comprobante
                  </a>

                `

                : ""
            }

          </div>

        </div>

      `;

      contenedor.appendChild(card);

    });

    /* =====================================
       RESUMEN SUPERIOR
    ===================================== */

    const totalInvertidoEl =
      document.getElementById(
        "publicoTotalInvertido"
      );

    const totalRegistradosEl =
      document.getElementById(
        "publicoEquiposRegistrados"
      );

    const totalEntregadosEl =
      document.getElementById(
        "publicoEquiposEntregados"
      );

    if (totalInvertidoEl) {

      totalInvertidoEl.textContent =
        formatoMoneda(
          totalInvertido
        );

    }

    if (totalRegistradosEl) {

      totalRegistradosEl.textContent =
        totalRegistrados;

    }

    if (totalEntregadosEl) {

      totalEntregadosEl.textContent =
        totalEntregados;

    }

  } catch (error) {

    console.error(
      "Error cargando inventario público:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudo cargar la
          información pública.
        </p>

      </div>

    `;
  }
}

 

/* =========================================================
   FORMATOS
========================================================= */

function setTexto(id, valor) {

  const el = document.getElementById(id);

  if (el) {
    el.textContent = valor;
  }
}

function formatoMoneda(valor) {

  return Number(valor || 0)
    .toLocaleString("es-MX", {
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

function formatearCategoria(categoria) {

  const mapa = {

    rescate_vehicular:
      "Rescate vehicular",

    equipo_medico:
      "Equipo médico",

    proteccion_personal:
      "Protección personal",

    radiocomunicacion:
      "Radiocomunicación",

    herramienta_manual:
      "Herramienta manual",

    vehiculo_apoyo:
      "Vehículo de apoyo",

    otro:
      "Otro"

  };

  return mapa[categoria] || categoria;
}

function formatearTipoPublicacion(tipo) {

  const mapa = {

    aviso:
      "Aviso",

    adquisicion:
      "Adquisición",

    entrega:
      "Entrega",

    agradecimiento:
      "Agradecimiento",

    actividad:
      "Actividad"

  };

  return mapa[tipo] || "Publicación";
}


function formatearEstado(estado) {

  const mapa = {

    solicitado:
      "Solicitado",

    cotizado:
      "Cotizado",

    comprado:
      "Comprado",

    recibido:
      "Recibido",

    entregado:
      "Entregado",

    en_uso:
      "En uso",

    mantenimiento:
      "Mantenimiento",

    baja:
      "Baja"
  };

  return mapa[estado] || estado;
}

/* =========================================================
   METAS COMUNITARIAS
========================================================= */

async function cargarMetasComunitarias() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor =
    document.getElementById(
      "contenedorMetas"
    );

  if (!contenedor) return;

  try {

    const snap = await db
     .collection("metas_comunitarias")
.limit(12)
.get();

    if (snap.empty) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            No hay metas activas
            por el momento.
          </p>

        </div>

      `;

      return;
    }

    contenedor.innerHTML = "";

    snap.forEach((doc) => {

      const d = doc.data();

      const meta =
        Number(d.montoMeta || 0);

      const actual =
        Number(d.montoActual || 0);

      const porcentaje =
        meta > 0
          ? Math.min(
              100,
              (actual / meta) * 100
            )
          : 0;

      const card =
        document.createElement("div");

      card.className =
  "inventory-card meta-card";

      card.innerHTML = `

        <div class="inventory-card-body">

          <p class="section-label">
            Meta comunitaria
          </p>

          <h3>
            ${escapeHtml(
              d.titulo || ""
            )}
          </h3>

          <p class="inventory-description">
            ${escapeHtml(
              d.descripcion || ""
            )}
          </p>

         <div class="inventory-data">

  <div class="meta-stat">

    <strong>Meta</strong>

    ${formatoMoneda(meta)}

  </div>

  <div class="meta-stat">

    <strong>Recaudado</strong>

    ${formatoMoneda(actual)}

  </div>

  <div class="meta-stat">

    <strong>Faltante</strong>

    ${formatoMoneda(
      Math.max(0, meta - actual)
    )}

  </div>

</div>

          <div class="progress-bar">

            <div
              class="progress-fill"
              style="
                width:${porcentaje}%;
              "
            ></div>

          </div>

          <p style="margin-top:10px;">

            <strong>
              ${porcentaje.toFixed(0)}%
            </strong>

            completado

          </p>

        </div>

      `;

      contenedor.appendChild(card);

    });

  } catch (error) {

    console.error(
      "Error cargando metas:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudieron cargar
          las metas comunitarias.
        </p>

      </div>

    `;
  }
}



/* =========================================================
   TIMELINE OPERATIVO
========================================================= */

async function cargarTimelineOperativo() {

  const firebaseTools = window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor =
    document.getElementById(
      "contenedorTimeline"
    );

  if (!contenedor) return;

  try {

    const actividades = [];

    /* =====================================
       INGRESOS
    ===================================== */

    const ingresosSnap = await db
      .collection("ingresos")
      .limit(4)
      .get();

    ingresosSnap.forEach((doc) => {

      const d = doc.data();

    actividades.push({

  tipo: "Ingreso",

 folio:
  d.folio
    ? `ING-${String(d.folio).padStart(3, "0")}`
    : "ING-SF",

  fecha:
    d.fechaIngreso?.toDate
      ? d.fechaIngreso.toDate()
      : null,

texto:

  `Donativo recibido<br>
   Monto: ${formatoMoneda(d.monto || 0)}`

});
    });

    /* =====================================
       EGRESOS
    ===================================== */

    const egresosSnap = await db
      .collection("egresos")
      .limit(4)
      .get();

    egresosSnap.forEach((doc) => {

      const d = doc.data();
actividades.push({

  tipo: "Egreso",
folio:
  d.folio
    ? `EGR-${String(d.folio).padStart(3,"0")}`
    : "EGR-SF",

  fecha:
    d.creadoEn?.toDate
      ? d.creadoEn.toDate()
      : null,

  texto:

  `${escapeHtml(d.concepto || "Egreso")}<br>
   Monto: ${formatoMoneda(d.monto || 0)}`

});
    });

    /* =====================================
       INVENTARIO
    ===================================== */

    const inventarioSnap = await db
      .collection("inventario_equipo")
      .where("publico", "==", true)
      .limit(4)
      .get();

    inventarioSnap.forEach((doc) => {

      const d = doc.data();
actividades.push({

  tipo: "Equipo",

folio:

d.folioEntrega

? `${d.folioInventario || "INV-SF"} / ${d.folioEntrega}`

: (d.folioInventario || "INV-SF"),

  fecha:
    d.creadoEn?.toDate
      ? d.creadoEn.toDate()
      : null,

texto:

d.folioEntrega

? `Equipo entregado a operación: ${escapeHtml(d.nombreEquipo || "")}.
<br>
Costo: ${formatoMoneda(d.costoTotal || 0)}`

: `Equipo registrado: ${escapeHtml(d.nombreEquipo || "")}.
<br>
Costo: ${formatoMoneda(d.costoTotal || 0)}`
});
    });

    /* =====================================
       ORDENAR
    ===================================== */

    actividades.sort((a, b) => {

      return (
        (b.fecha?.getTime?.() || 0)
        -
        (a.fecha?.getTime?.() || 0)
      );

    });

    const ultimas =
      actividades.slice(0, 8);

    /* =====================================
       VALIDAR
    ===================================== */

    if (!ultimas.length) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            No hay actividad reciente.
          </p>

        </div>

      `;

      return;
    }

    /* =====================================
       PINTAR
    ===================================== */

    contenedor.innerHTML = "";

    ultimas.forEach((item) => {

     const fechaTexto =

item.fecha

? item.fecha.toLocaleString(
    "es-MX",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  )

: "Sin fecha";

      const div =
        document.createElement("div");

      div.className =
  `timeline-item timeline-${item.tipo.toLowerCase()}`;

    div.innerHTML = `

<div class="timeline-top">

  <div>

    <span class="timeline-type">
      ${item.tipo}
    </span>

    <div class="timeline-folio">

      ${item.folio || ""}

    </div>

  </div>

  <span class="timeline-date">
    ${fechaTexto}
  </span>

</div>

  

  <div class="timeline-text">
    ${item.texto}
  </div>

`;

      contenedor.appendChild(div);

    });

  } catch (error) {

    console.error(
      "Error timeline:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudo cargar la actividad.
        </p>

      </div>

    `;
  }
}


/* =========================================
   MODAL IMAGEN
========================================= */

window.abrirModalImagen = function(url) {

  const modal =
    document.getElementById(
      "modalImagen"
    );

  const imagen =
    document.getElementById(
      "imagenModalContenido"
    );

  if (!modal || !imagen) return;

  imagen.src = url;

  modal.classList.add("activo");
};

window.cerrarModalImagen = function() {

  const modal =
    document.getElementById(
      "modalImagen"
    );

  if (!modal) return;

  modal.classList.remove("activo");
};

/* =========================================
   EVENTOS MODAL
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const modal =
      document.getElementById(
        "modalImagen"
      );

    const cerrar =
      document.getElementById(
        "cerrarModalImagen"
      );

    if (cerrar) {

      cerrar.addEventListener(
        "click",
        cerrarModalImagen
      );
    }

    if (modal) {

      modal.addEventListener(
        "click",
        (e) => {

          if (e.target === modal) {

            cerrarModalImagen();
          }
        }
      );
    }
  }
);


/* =========================================================
   PUBLICACIONES
========================================================= */

async function cargarPublicaciones() {

  const firebaseTools =
    window.PCZ_FIREBASE;

  if (!firebaseTools?.db) return;

  const { db } = firebaseTools;

  const contenedor =
    document.getElementById(
      "contenedorPublicaciones"
    );

  if (!contenedor) return;

  try {

    const snap = await db
      .collection("publicaciones")
      .where("publico", "==", true)
      .where("activa", "==", true)
      .limit(8)
      .get();

    if (snap.empty) {

      contenedor.innerHTML = `

        <div class="info-card">

          <p>
            No hay publicaciones disponibles.
          </p>

        </div>

      `;

      return;
    }

    contenedor.innerHTML = "";

    snap.forEach((doc) => {

      const d = doc.data();


       
      const fecha =
        d.creadoEn?.toDate
          ? d.creadoEn
              .toDate()
              .toLocaleDateString("es-MX")
          : "Sin fecha";

      const card =
        document.createElement("div");

      card.className =
        "inventory-card";

      card.innerHTML = `

        

    ${
  d.imagenUrl

    ? `

      <div class="inventory-image-placeholder">

        <img
          src="${d.imagenUrl}"
          alt="Publicación"
          class="publicacion-imagen"
        >

      </div>

    `

    : `

      <div class="inventory-image-placeholder">

        <img
          src="assets/logos/logo-patronato.png"
          alt="Patronato Zacualpan"
          class="publicacion-imagen"
        >

      </div>

    `
}

<div class="inventory-card-body">

  <p class="section-label">
    Publicación
  </p>

  <h3>
    ${escapeHtml(
      d.titulo || ""
    )}
  </h3>

<p class="inventory-description">

  ${escapeHtml(
    (d.descripcion || "")
      .substring(0, 220)
  )}

  ${
    (d.descripcion || "").length > 220
      ? "..."
      : ""
  }

</p>

<button
  class="secondary-btn"
  onclick="abrirPublicacion(
    '${doc.id}'
  )"
>
  📖 Leer más
</button>

  <div class="timeline-top">

<span class="timeline-type">

  ${formatearTipoPublicacion(
    d.tipoPublicacion
  )}

</span>

    <span class="timeline-date">
      ${fecha}
    </span>

  </div>

</div>

      `;

      contenedor.appendChild(card);

    });

  } catch (error) {

    console.error(
      "Error publicaciones:",
      error
    );

    contenedor.innerHTML = `

      <div class="info-card">

        <p>
          ⚠️ No se pudieron cargar
          las publicaciones.
        </p>

      </div>

    `;
  }
}

/* =========================================
   CLICK IMAGEN PUBLICACION
========================================= */

document.addEventListener(
  "click",
  (e) => {

    const imagen =
      e.target.closest(
        ".publicacion-imagen"
      );

    if (!imagen) return;

    const url = imagen.src;

    abrirModalImagen(url);
  }
);

/* =====================================
   MODAL IMAGEN
===================================== */

function abrirModalImagen(url) {

  const modal =
    document.getElementById(
      "modalImagen"
    );

  const imagen =
    document.getElementById(
      "imagenModalContenido"
    );

  if (!modal || !imagen) return;

  imagen.src = url;

  modal.classList.add(
    "activo"
  );
}

/* CERRAR MODAL IMAGEN */

document
  .getElementById(
    "cerrarModalImagen"
  )
  ?.addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "modalImagen"
        )
        ?.classList.remove(
          "activo"
        );
    }
  );

/* CERRAR TOCANDO AFUERA */

document.addEventListener(
  "click",
  (e) => {

    const modal =
      document.getElementById(
        "modalImagen"
      );

    if (
      e.target === modal
    ) {

      modal.classList.remove(
        "activo"
      );
    }
  }
);

/* =====================================================
   SUSCRIPCION AVISOS
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "MODAL SUSCRIPCION READY"
    );

    const modalSuscripcion =
      document.getElementById(
        "modalSuscripcion"
      );

    const btnRecibirAvisosAbrir =
      document.getElementById(
        "btnRecibirAvisos"
      );

    const btnCerrarSuscripcion =
      document.getElementById(
        "btnCerrarSuscripcion"
      );

    const btnGuardarSuscripcion =
      document.getElementById(
        "btnGuardarSuscripcion"
      );

    console.log(
      "BOTON:",
      btnRecibirAvisosAbrir
    );

    console.log(
      "MODAL:",
      modalSuscripcion
    );

    /* =====================================
       ABRIR
    ===================================== */

    btnRecibirAvisosAbrir?.addEventListener(
      "click",
      () => {

        console.log(
          "CLICK ABRIR MODAL"
        );

        modalSuscripcion?.classList.add(
          "activo"
        );
      }
    );

    /* =====================================
       CERRAR
    ===================================== */

    btnCerrarSuscripcion?.addEventListener(
      "click",
      () => {

        modalSuscripcion?.classList.remove(
          "activo"
        );
      }
    );

    /* =====================================
       CERRAR AFUERA
    ===================================== */

    modalSuscripcion?.addEventListener(
      "click",
      (e) => {

        if (
          e.target === modalSuscripcion
        ) {

          modalSuscripcion.classList.remove(
            "activo"
          );
        }
      }
    );

    /* =====================================
       GUARDAR
    ===================================== */

    btnGuardarSuscripcion?.addEventListener(
      "click",
      async () => {

        try {

          const firebaseTools =
            window.PCZ_FIREBASE;

          if (!firebaseTools?.db) {

            alert(
              "Firebase no disponible."
            );

            return;
          }

          const { db } =
            firebaseTools;

          const nombre =
            document.getElementById(
              "suscriptorNombre"
            ).value.trim();

          const telefono =
            document.getElementById(
              "suscriptorTelefono"
            ).value.trim();

          if (
            !nombre ||
            !telefono
          ) {

            alert(
              "Completa todos los campos."
            );

            return;
          }

          await db
            .collection(
              "suscriptores_avisos"
            )
            .add({

              nombre,

              telefono,

              activo: true,

              fechaRegistro:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            });

          alert(
            "Registro completado correctamente."
          );

          modalSuscripcion.classList.remove(
            "activo"
          );

        } catch (error) {

          console.error(error);

          alert(
            "No se pudo guardar."
          );
        }
      }
    );
  }
);



/* =====================================
   MODAL PUBLICACION
===================================== */

async function abrirPublicacion(id) {
console.log("ABRIR PUBLICACION");
console.log("ID RECIBIDO:", id);
  try {

    const firebaseTools =
      window.PCZ_FIREBASE;

    if (!firebaseTools?.db) return;

    const { db } =
      firebaseTools;

    const doc =
      await db
        .collection(
          "publicaciones"
        )
        .doc(id)
        .get();

    if (!doc.exists) return;

    const d =
      doc.data();

PUBLICACION_ACTIVA = d;
     
    document.getElementById(
      "modalPublicacionTitulo"
    ).textContent =
      d.titulo || "";

    document.getElementById(
      "modalPublicacionTexto"
    ).textContent =
      d.descripcion || "";

    const img =
      document.getElementById(
        "modalPublicacionImagen"
      );

    if (d.imagenUrl) {

      img.src =
        d.imagenUrl;

      img.style.display =
        "block";

    } else {

      img.style.display =
        "none";
    }

   const modal =
  document.getElementById(
    "modalPublicacion"
  );

console.log(modal);

modal.classList.remove(
  "hidden"
);

modal.classList.add(
  "activo"
);

  } catch (error) {

    console.error(
      error
    );
  }
}


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const cerrar =
      document.getElementById(
        "cerrarModalPublicacion"
      );

    const modal =
      document.getElementById(
        "modalPublicacion"
      );

    if (cerrar) {

      cerrar.addEventListener(
        "click",
        () => {

         modal.classList.remove(
  "activo"
);
        }
      );
    }

    if (modal) {

      modal.addEventListener(
        "click",
        (e) => {

          if (
            e.target === modal
          ) {

         modal.classList.remove(
  "activo"
);

modal.classList.add(
  "hidden"
);
          }
        }
      );
    }
  }
);


/* =====================================
   COMPARTIR WHATSAPP
===================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const btn =
      document.getElementById(
        "btnCompartirWhatsapp"
      );

    if (!btn) return;

    btn.addEventListener(
      "click",
      () => {

        if (
          !PUBLICACION_ACTIVA
        ) return;

        const texto =

`${PUBLICACION_ACTIVA.titulo || ""}

${PUBLICACION_ACTIVA.descripcion || ""}

https://patronatozacualpan.github.io/voluntarios/transparencia.html`;

        window.open(

          `https://wa.me/?text=${encodeURIComponent(texto)}`,

          "_blank"

        );

      }
    );

  }
);



/*=========================================================
RECONOCIMIENTOS PÚBLICOS
=========================================================*/

async function cargarReconocimientosPublicos(){

try{

const lista =
document.getElementById(
"contenedorReconocimientos"
);

if(!lista)return;

lista.innerHTML="";

const {db}=window.PCZ_FIREBASE;

const snap=

await db

.collection("reconocimientos")

.where(
"publicado",
"==",
true
)

.orderBy(
"creadoEn",
"desc"
)

.limit(6)

.get();

if(snap.empty){

lista.innerHTML=`

<div class="info-card">

<p>

Aún no existen reconocimientos públicos.

</p>

</div>

`;

return;

}

snap.forEach(doc=>{

const d=doc.data();

lista.innerHTML+=`

<div class="info-card">

<img

src="${
d.fotoApoyoUrl||
'assets/img/sin-imagen.png'
}"

style="
width:100%;
height:220px;
object-fit:cover;
border-radius:12px;
margin-bottom:15px;
">

<p class="section-label">

${d.folioReconocimiento}

</p>

<h3>

${d.articuloDonado||""}

</h3>

<p>

${
d.publicarNombre
?
d.nombreBenefactor
:
"Benefactor Anónimo"
}

</p>

<button

class="primary-btn"

onclick="window.location.href='reconocimiento.html?folio=${d.folioReconocimiento}'"

>

Ver reconocimiento

</button>

</div>

`;

});

}catch(error){

console.log(error.code);

console.log(error.message);

console.log(error);

}

}





