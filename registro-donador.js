
function registrarDonador() {
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const poblacion = document.getElementById("poblacion").value.trim();
  const promesa = parseInt(document.getElementById("promesa").value);

  if (!nombre || !telefono || !poblacion || promesa < 30) {
    alert("Por favor completa todos los campos con datos válidos.");
    return;
  }

  db.collection("donativos").add({
    nombre: nombre,
    telefono: telefono,
    poblacion: poblacion,
    promesa: promesa,
    status: "pendiente"
  }).then(() => {
    alert("Registro exitoso. Ahora puedes enviar tu comprobante por WhatsApp.");
  }).catch((error) => {
    console.error("Error al registrar: ", error);
    alert("Ocurrió un error al registrar. Inténtalo de nuevo.");
  });
}
