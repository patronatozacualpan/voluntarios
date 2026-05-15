# CHANGELOG
## Patronato Zacualpan Pro-equipamiento de Protección Civil

Este archivo documenta cambios importantes, módulos agregados, correcciones y mejoras del sistema.

---

# 2026-05-14

## Infraestructura

- Configurado Firebase Authentication.
- Configurado Firestore Database.
- Configurado Firebase Storage.
- Configurado GitHub Pages.
- Implementado sistema de roles:
  - presidente
  - tesorera
  - secretario
  - vocal1
  - vocal2

---

## Seguridad

### Firestore Rules

- Público puede registrar donadores.
- Público puede registrar opiniones.
- Solo tesorera puede registrar ingresos.
- Solo tesorera puede registrar egresos.
- Solo tesorera puede registrar traspasos.
- Mesa directiva puede consultar información administrativa.
- Se bloqueó eliminación de ingresos/egresos/traspasos.

### Storage Rules

- Protección de firmas.
- Protección de comprobantes.
- Protección de recibos.
- Restricción por tipo de archivo.
- Restricción por tamaño máximo.

---

## Página pública

### index.html

Se agregaron:

- Hero institucional.
- Imagen emblemática de Zacualpan.
- Formulario público de donadores.
- Transparencia pública.
- Encuesta/opiniones.
- Aviso de modelo ciudadano sin cobranza.
- Efectos visuales y animaciones.

### main.js

Corrección importante:

- Eliminadas interferencias con formularios.
- main.js ya no controla submit de donadores ni opiniones.

---

## Donadores

### registro-donador.js

Correcciones:

- Registro funcional desde móvil.
- Eliminada lectura pública de donadores.
- Mejorada validación.
- Toast flotante visible en móvil y PC.

### donadores.js

Funciones agregadas:

- Validación de donadores.
- Estados:
  - Pendiente
  - Primera aportación
  - Al día
  - Adelantado
  - Atrasado
  - Descartado

- Botón WhatsApp.
- Botón Pago.
- Integración con ingresos.html mediante URL.

---

## Ingresos

### ingresos.js

Implementado:

- Registro de ingresos.
- Folios consecutivos.
- Actualización de total aportado.
- Detección automática de donador desde URL.
- Monto sugerido automático.
- Balance por forma de pago.
- Cobertura de cuota mensual.
- Cálculo “cubre hasta”.
- Historial reciente.

### ingresos.html

Se agregaron:

- Dashboard de balances.
- Modal de confirmación.
- Flujo centrado para PDF.

### recibos.js

Implementado:

- Recibo PDF institucional.
- Logo del patronato.
- Firma tesorera.
- Folio.
- Frases motivadoras aleatorias.
- Promesa mensual.
- Total aportado.
- Cobertura de cuota.

---

## Modal de confirmación

Se reemplazó toast automático por modal centrado con botón Aceptar debido a:

- Toast quedaba oculto.
- PDF cubría visualización.
- Mala experiencia móvil.

Nuevo flujo:

1. Registrar ingreso.
2. Generar PDF.
3. Mostrar modal.
4. Tesorera confirma manualmente.

---

## Egresos

Implementado:

- Registro de egresos.
- Subida de comprobantes.
- Historial reciente.
- Protección por rol tesorera.

Pendiente:

- fuentePago:
  - efectivo
  - banco

---

## Traspasos internos

Archivos creados:

- traspasos.html
- traspasos.js

Objetivo:

Controlar movimientos internos entre efectivo y banco sin registrarlos como egreso.

Implementado:

- Registro de traspasos.
- Balance operativo real.
- Soporte de comprobantes.
- Historial reciente.
- Dashboard:
  - efectivo real
  - banco real
  - total disponible

---

## Opiniones

Implementado:

- Registro público.
- Dashboard administrativo.
- Estadísticas básicas.

---

## WhatsApp

Implementado:

- Botón WhatsApp por donador.

Pendiente:

- Integrar último recibo.
- Integrar datos del último pago.
- Automatización futura con WhatsApp Cloud API.

---

## Pendientes prioritarios

1. Terminar traspasos internos.
2. Agregar fuentePago en egresos.
3. Crear balance general financiero.
4. Guardar PDF en Firebase Storage.
5. Historial individual de pagos.
6. Integración inventario-egresos.
7. Exportaciones y respaldos.
8. Panel de auditoría/logs.
9. Filtros mensuales.
10. Cierre mensual de tesorería.
