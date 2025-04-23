
const frases = [
  "Un peso por día, una vida que podemos salvar.",
  "Gracias por fortalecer a Protección Civil Zacualpan.",
  "Tu ayuda hace la diferencia en cada emergencia.",
  "Unidos por la seguridad de nuestra comunidad."
];
let index = 0;
function rotarFrases() {
  document.getElementById("frase").textContent = frases[index];
  index = (index + 1) % frases.length;
}
rotarFrases();
setInterval(rotarFrases, 4000);
