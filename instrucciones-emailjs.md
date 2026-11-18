# Guía de Conexión: Notificaciones por Correo con EmailJS

Esta guía te explica detalladamente cómo conectar el formulario de contacto con **EmailJS** para que, cada vez que una persona envíe un mensaje, recibas una notificación instantánea y formateada directamente en tu bandeja de entrada de correo personal o corporativo (Gmail, Outlook, etc.).

---

## 📋 ¿Qué Información Recibirás en tu Correo?

El correo de notificación llegará con:
- **Asunto:** `Nuevo mensaje recibido desde el formulario de contacto`
- **Nombre del remitente:** El nombre ingresado por el usuario.
- **Correo del remitente:** Dirección del usuario (configurada para que al hacer clic en "Responder" le contestes a él directamente).
- **Comentario / Mensaje:** El texto completo enviado.
- **Fecha y Hora:** El momento exacto del envío.

---

## 🛠️ Paso 1: Crear una Cuenta Gratuita en EmailJS

1. Ingresa al sitio oficial: [https://www.emailjs.com/](https://www.emailjs.com/).
2. Haz clic en **"Sign Up"** (Registrarse).
3. EmailJS ofrece un plan gratuito que incluye **hasta 200 correos al mes**, suficiente para proyectos personales y profesionales.
4. Confirma tu cuenta mediante el enlace que recibirás en tu correo.

---

## 📬 Paso 2: Conectar tu Servicio de Correo (Service ID)

1. En el panel principal de EmailJS (Dashboard), ve al menú lateral izquierdo y haz clic en **"Email Services"**.
2. Haz clic en el botón azul **"Add New Service"** (Agregar nuevo servicio).
3. Selecciona tu proveedor de correo favorito:
   - **Gmail** (Recomendado)
   - **Outlook**
   - **Yahoo**, iCloud u otros proveedores SMTP.
4. Haz clic en **"Connect Account"** para autorizar a EmailJS a enviar correos desde tu cuenta.
5. Verás un campo llamado **Service ID** (por ejemplo: `service_abc123` o `service_contacto`).
6. **Copia y anota este Service ID**.

---

## 📝 Paso 3: Crear la Plantilla de Correo (Template ID)

1. En el menú lateral izquierdo de EmailJS, haz clic en **"Email Templates"**.
2. Haz clic en el botón **"Create New Template"**.
3. Se abrirá el diseñador de plantillas. Configura los campos exactamente así:

### A. Asunto del Correo (Subject):
Coloca:
```
Nuevo mensaje recibido desde el formulario de contacto
```

### B. Contenido del Correo (Content / Body):
En el cuerpo del mensaje puedes pegar este diseño limpio y ordenado:

```html
¡Hola!

Has recibido un nuevo mensaje desde el Formulario de Contacto de tu página web.

Detalles del contacto:
--------------------------------------------------
• Nombre completo: {{nombre}}
• Correo electrónico: {{email}}
• Fecha y hora de envío: {{fecha_hora}}

Mensaje o Comentario:
--------------------------------------------------
{{comentario}}

--------------------------------------------------
Puedes responder directamente a este correo para contestar al usuario.
```

### C. Campos del remitente y destinatario (Pestaña "Settings"):
- **To Email:** Tu dirección de correo donde quieres recibir las alertas (ejemplo: `tucorreo@gmail.com`).
- **From Name:** `Formulario Web - {{nombre}}`
- **Reply To:** `{{email}}` *(De esta forma, cuando presiones "Responder" en tu lector de correo, responderás directamente al usuario)*.

4. Haz clic en el botón verde **"Save"** en la esquina superior derecha.
5. En la parte superior verás el **Template ID** (por ejemplo: `template_xyz456` o `template_contacto`).
6. **Copia y anota este Template ID**.

---

## 🔑 Paso 4: Obtener tu Clave Pública (Public Key)

1. En el menú lateral izquierdo de EmailJS, ve a **"Account"** (icono de engranaje o usuario).
2. En la pestaña **General**, busca la sección **API Keys**.
3. Verás el campo **Public Key** (una serie de letras y números, por ejemplo: `A1b2C3d4E5f6G7h8I`).
4. **Copia esta Public Key**.

---

## 🔗 Paso 5: Conectar las Credenciales con el Formulario

Tienes dos formas de colocar tus credenciales:

### Opción A (Recomendada): En el archivo `script.js`
Abre el archivo `script.js` y coloca tus tres valores en el objeto `CONFIG`:

```javascript
const CONFIG = {
  GOOGLE_SHEETS_SCRIPT_URL: "...", // URL de Google Apps Script

  // Credenciales de EmailJS:
  EMAILJS_PUBLIC_KEY: "A1b2C3d4E5f6G7h8I",     // Tu Public Key real
  EMAILJS_SERVICE_ID: "service_contacto",       // Tu Service ID real
  EMAILJS_TEMPLATE_ID: "template_contacto",     // Tu Template ID real

  ALLOW_DEMO_MODE_IF_UNCONFIGURED: false
};
```

### Opción B: Directamente desde la Interfaz Web
1. Abre `index.html` en tu navegador.
2. Haz clic en el botón superior **⚙️ Conexiones**.
3. En la sección **EmailJS**, completa:
   - **Public Key**
   - **Service ID**
   - **Template ID**
4. Haz clic en **"Guardar Credenciales"**.

---

## 🧪 Paso 6: Probar el Envío y Verificar la Notificación

1. Abre `index.html` en el navegador.
2. Completa los campos:
   - **Nombre:** María Fernanda Pérez
   - **Correo:** maria.fernanda@ejemplo.com
   - **Comentario:** Hola, me encantó su proyecto y me gustaría agendar una reunión informativa para la próxima semana.
3. Haz clic en **"ENVIAR MI MENSAJE"**.
4. Verás la animación de carga, la confirmación de éxito y la celebración de pétalos.
5. Abre la bandeja de entrada de tu correo electrónico. ¡Tendrás el correo nuevo con todos los datos ordenados!

---

## ❓ Solución de Preguntas Frecuentes

- **¿Dónde reviso si hubo un error en EmailJS?**  
  En tu cuenta de EmailJS, ve a la pestaña **"History"** (Historial). Allí podrás ver el estado de cada correo enviado y los mensajes de error en caso de que algún dato no coincida.
- **¿Es seguro dejar la Public Key en JavaScript?**  
  Sí, la `Public Key` de EmailJS está diseñada específicamente para ser utilizada en el navegador (cliente). EmailJS cuenta con protección contra spam, listas de bloqueo y límites de tasa para mantener la seguridad.
- **¿Por qué no me llega el correo?**  
  1. Revisa la carpeta de **Spam / Correo no deseado**.  
  2. Verifica que las variables en tu plantilla se llamen exactamente `{{nombre}}`, `{{email}}`, `{{comentario}}` y `{{fecha_hora}}`.  
  3. Comprueba que el Service ID y Template ID no tengan espacios en blanco al inicio o al final.
