/* =========================================================
   recibos.js
   Generador de recibos PDF
   Patronato Zacualpan Pro-equipamiento de Protección Civil
========================================================= */

const FRASES_RECIBO = [
  "Tu generosidad equipa a nuestros héroes voluntarios.",
  "Cada peso recibido fortalece la respuesta ante emergencias.",
  "Gracias por ser parte de esta causa que salva vidas.",
  "Tu apoyo deja huella en la seguridad de Zacualpan.",
  "Unidos convertimos la solidaridad en herramientas de rescate.",
  "La ayuda de hoy puede salvar una vida mañana.",
  "Tu donativo fortalece a quienes sirven sin esperar nada.",
  "Gracias por apoyar a Protección Civil Zacualpan.",
  "Cada aportación suma esperanza y capacidad de respuesta.",
  "Tu compromiso ayuda a proteger a nuestra comunidad.",
  "Zacualpan se fortalece con personas como tú.",
  "La generosidad también es una forma de rescate."
];

function obtenerFraseRecibo() {
  const indice = Math.floor(Math.random() * FRASES_RECIBO.length);
  return FRASES_RECIBO[indice];
}

function generarReciboPDF(datos) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("⚠️ No se cargó la librería jsPDF.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [216, 93]
  });

  const azul = [0, 33, 71];
  const amarillo = [244, 196, 48];

  // Marco exterior azul
  pdf.setDrawColor(...azul);
  pdf.setLineWidth(3);
  pdf.rect(4, 4, 208, 85);

  // Marco interior amarillo
  pdf.setDrawColor(...amarillo);
  pdf.setLineWidth(3);
  pdf.rect(9, 9, 198, 75);

  // Encabezado
  pdf.setTextColor(...azul);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text("RECIBO DE DONACIÓN", 108, 20, { align: "center" });

  // Nombre patronato
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Patronato Zacualpan Pro-equipamiento de Protección Civil", 108, 27, { align: "center" });

  // Folio
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(`Folio: ${datos.folioTexto || "000000"}`, 176, 20);

  // Datos
  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const fecha = datos.fechaTexto || new Date().toLocaleDateString("es-MX");

  pdf.text(`Fecha: ${fecha}`, 18, 38);
  pdf.text(`Recibí de: ${datos.nombreDonador || ""}`, 18, 48);
  pdf.text(`Cantidad: ${formatearMonedaRecibo(datos.monto || 0)}`, 18, 58);
  pdf.text(`Forma de pago: ${formatearFormaPago(datos.formaPago || "")}`, 18, 68);

  // Firma
  pdf.setFont("helvetica", "bold");
  pdf.text("Recibido por Tesorera", 130, 55);

  pdf.setFont("helvetica", "normal");
  pdf.text(datos.nombreTesorera || "Tesorera Patronato Zacualpan", 130, 63);

  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.3);
  pdf.line(128, 70, 193, 70);

  pdf.setFontSize(9);
  pdf.text("Firma", 160, 76, { align: "center" });

  // Logo reservado
  pdf.setDrawColor(...azul);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(171, 31, 22, 18, 2, 2);
  pdf.setFontSize(7);
  pdf.setTextColor(...azul);
  pdf.text("LOGO", 182, 42, { align: "center" });

  // Frase inferior
  pdf.setTextColor(...azul);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  const frase = datos.fraseRecibo || obtenerFraseRecibo();
  pdf.text(frase, 108, 82, { align: "center", maxWidth: 175 });

  const nombreArchivo = `recibo-${datos.folioTexto || "000000"}-${limpiarNombreArchivo(datos.nombreDonador || "donador")}.pdf`;

  pdf.save(nombreArchivo);
}

function formatearMonedaRecibo(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

function formatearFormaPago(valor) {
  const mapa = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    deposito: "Depósito",
    spin_oxxo: "SPIN OXXO",
    otro: "Otro"
  };

  return mapa[valor] || valor;
}

function limpiarNombreArchivo(nombre) {
  return String(nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

window.PCZ_RECIBOS = {
  FRASES_RECIBO,
  obtenerFraseRecibo,
  generarReciboPDF
};
