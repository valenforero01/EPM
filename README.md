# EPM – Portal Corporativo y PQR 360

Prototipo académico funcional del proceso TO-BE **“Gestión de PQR por Cobros Improcedentes”** de Empresas Públicas de Medellín (EPM). Construido con React, TypeScript, Tailwind CSS, Zustand, Recharts y Framer Motion (100 % frontend en memoria con persistencia en `localStorage`).

> **Aviso importante:** Todos los clientes, contratos, facturas, lecturas, tarifas y radicados son **datos ficticios** con fines estrictamente académicos. Este no es el sitio oficial de EPM.

---

## 1. Rutas principales (`HashRouter`)

- `#/` — **Sitio Institucional de EPM**: Presentación corporativa, accesos rápidos, portafolio de servicios, segmentos hogar/empresa, línea de tiempo 1955–2026, sostenibilidad, noticias ficticias, banda secundaria PQR 360, tarifas de referencia 2026, oficinas y preguntas frecuentes, más el asistente virtual **Epi**.
- `#/admin/login` y `#/admin/*` — **Consola Trabajadores EPM**:
  - `#/admin` — Dashboard ejecutivo (12 KPIs, 6 gráficas Recharts y panel de Alertas Tempranas SLA).
  - `#/admin/solicitudes` — Tabla paginada/ordenable, exportación CSV, tablero Kanban Drag & Drop y radicación de oficio.
  - `#/admin/clientes` — Directorio de 60 clientes ficticios y vista **Cliente 360**.
  - `#/admin/facturacion` — 360 facturas (Mayo–Octubre 2026) y auditoría preventiva de **Cobros Sospechosos**.
  - `#/admin/visitas` — Agenda de cuadrillas e informe técnico digital con re-evaluación automática.
  - `#/admin/reglas` — Configuración en vivo del motor BRMS, simulador de impacto, webhook **n8n** y restablecimiento de datos demo.
  - `#/admin/reportes` — Exportación CSV/PDF, bitácora de auditoría y bandeja de correos enviados.
- `#/clientes/login` y `#/clientes/*` — **Portal de Autogestión de Clientes**:
  - `#/clientes` — Resumen de contrato, última factura y PQRs en curso.
  - `#/clientes/facturas` — Histórico de consumo (6 meses) y reclamación prellenada desde factura.
  - `#/clientes/solicitudes` — Seguimiento SLA, detalle, reprogramación de visitas, constancia imprimible y envío de copia por correo.
  - `#/clientes/radicar` — Formulario completo de 14 campos, simulación OCR, pipeline automático de 4 pasos y resultado inmediato.
  - `#/clientes/notificaciones` — Respuestas de analistas y avisos de resolución.

---

## 2. Credenciales de demostración (`DEMO_MODE = true`)

- **Consola Administrativa (`#/admin/login`):**
  - Usuario: `ADMINISTRADOR`
  - Contraseña: `823027`
  - Incluye bloqueo de 30 segundos tras 3 intentos fallidos y cierre automático a los 10 minutos de inactividad (con aviso al minuto 9).

- **Portal Clientes (`#/clientes/login`):**
  - Ingresar con el **Número de contrato (7 dígitos)** y la **Cédula del titular** como contraseña.
  - La pantalla de ingreso incluye un selector rápido con los 60 clientes ficticios para autocompletar en demostraciones.

> **Nota de seguridad:** Las credenciales fijas y el modo `DEMO_MODE` son exclusivos para este prototipo académico sin backend; en un entorno productivo la autenticación debe delegarse a un servidor OAuth2/OIDC con verificación de tokens en backend.

---

## 3. Integración con n8n (“Enviar copia a mi correo”)

1. Crea un flujo en **n8n** con un nodo **Webhook** (`Method: POST`).
2. Conecta un nodo **Gmail** / **SMTP** / **Send Email**:
   - **To / Destinatario:** `{{$json.body.cliente.correo}}` (o `{{$json.cliente.correo}}` según versión de n8n; si llega por fallback `no-cors`, parsear `JSON.parse($json.body.payload)`).
   - **Subject / Asunto:** `{{$json.body.asunto}}`
   - **HTML Body:** `{{$json.body.constanciaHTML}}`
3. Copia la URL de producción del Webhook y pégala en **Consola Admin → Reglas e integración → Integración n8n**.
4. Si no configuras ninguna URL, la aplicación simula el envío localmente y registra la vista previa HTML en **Reportes y auditoría**.

---

## 4. Mapeo con el Proceso TO-BE

| Etapa TO-BE | Pantalla / Módulo en el Prototipo |
| :--- | :--- |
| Radicación omnicanal | Portal Clientes (`#/clientes/radicar`) y Asistente **Epi** |
| Extracción OCR | Carga/simulación de comprobante y foto del medidor (SVG local) |
| Consulta recaudo e histórico | Motor `rulesEngine.ts` frente a las 360 facturas y fechas de corte |
| Motor de Reglas BRMS (R1–R5) | Decisión automática STP (`Procedente`), `No procedente`, `En validación AMI`, `Visita técnica` o `Análisis` |
| Control preventivo SLA (15 d. háb.) | Alertas tempranas día 8 y dictamen preventivo día 13 en Dashboard Admin |
| Constancia y notificación | Modal imprimible Ley 142/1994 + envío de copia por Webhook n8n |
