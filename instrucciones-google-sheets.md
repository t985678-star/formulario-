# Guía de Conexión: Formulario con Google Sheets (Google Apps Script)

Esta guía te explica paso a paso cómo almacenar automáticamente cada respuesta del formulario de contacto en una hoja de cálculo de Google Sheets en tiempo real, utilizando **Google Apps Script** como intermediario seguro y sin costo.

---

## 📋 Estructura de Datos que se Guardarán

Cada vez que un usuario envíe el formulario, se registrarán automáticamente las siguientes 4 columnas:
1. **Fecha y Hora**: Momento exacto del envío (ejemplo: `24/05/2025 15:30:45`).
2. **Nombre Completo**: Nombre y apellido del usuario.
3. **Correo Electrónico**: Dirección de correo validada del remitente.
4. **Comentario**: Mensaje o consulta detallada (mínimo 20 caracteres).

---

## 🛠️ Paso 1: Crear la Hoja de Cálculo en Google Sheets

1. Abre tu navegador e ingresa a [Google Sheets](https://sheets.google.com).
2. Haz clic en **"En blanco"** para crear una nueva hoja de cálculo.
3. Asigna un nombre a tu hoja en la esquina superior izquierda, por ejemplo:
   `Respuestas - Formulario de Contacto`.
4. En la fila 1, escribe los encabezados de las columnas (opcional, el script los creará automáticamente si la hoja está vacía):
   - **Columna A:** `Fecha y Hora`
   - **Columna B:** `Nombre Completo`
   - **Columna C:** `Correo Electrónico`
   - **Columna D:** `Comentario`

---

## 💻 Paso 2: Abrir el Editor de Google Apps Script

1. En el menú superior de Google Sheets, haz clic en **Extensiones** > **Apps Script**.
2. Se abrirá una nueva pestaña con el editor de código.
3. En la parte superior, puedes cambiar el nombre del proyecto de `Sin título` a `API Formulario Contacto`.
4. Borra todo el código que aparece por defecto en el archivo `Código.gs`.

---

## 📜 Paso 3: Pegar el Código del Servidor (Google Apps Script)

Copia y pega el siguiente código en el editor de Apps Script:

```javascript
/**
 * SERVICIO WEB PARA REGISTRO DE FORMULARIO DE CONTACTO EN GOOGLE SHEETS
 * Recibe solicitudes POST con los datos: timestamp, nombre, email, comentario.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Bloqueo de 10 segundos para evitar colisiones en envíos simultáneos
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};

    // 1. Procesar datos recibidos (JSON o parámetros de formulario)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // 2. Si la hoja está vacía, crear encabezados estilizados
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha y Hora",
        "Nombre Completo",
        "Correo Electrónico",
        "Comentario"
      ]);
      // Estilo visual pastel para los encabezados
      var headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#FCE0EC"); // Rosa suave
      headerRange.setFontColor("#4E2915");   // Marrón canela
    }

    // 3. Extraer valores con fecha por defecto de respaldo
    var fechaHora = data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    var nombre = (data.nombre || "").toString().trim();
    var email = (data.email || "").toString().trim();
    var comentario = (data.comentario || "").toString().trim();

    // 4. Insertar la nueva fila con los datos del usuario
    sheet.appendRow([fechaHora, nombre, email, comentario]);

    // 5. Retornar respuesta exitosa en formato JSON con cabeceras CORS
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "¡Datos guardados correctamente en Google Sheets!"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Retornar detalle del error en formato JSON
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    // Liberar bloqueo de concurrencia
    lock.releaseLock();
  }
}

/**
 * Función auxiliar para verificar que el servicio está activo desde el navegador
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "active",
      message: "El servicio Web App de Google Sheets está funcionando correctamente."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

5. Presiona el icono de **Guardar** (Ctrl + S o Cmd + S).

---

## 🚀 Paso 4: Implementar como Aplicación Web (Obtener la URL)

Este paso es crucial para que el formulario pueda comunicarse con Google Sheets:

1. En la esquina superior derecha del editor de Apps Script, haz clic en el botón azul **Implementar** (Deploy) y selecciona **Nueva implementación** (New deployment).
2. Haz clic en el icono de engranaje ⚙️ junto a "Seleccionar tipo" y elige **Aplicación web** (Web app).
3. Configura los siguientes campos exactamente como se indica:
   - **Descripción:** `Versión 1 - Formulario de Contacto`.
   - **Ejecutar como (Execute as):** `Yo (tu correo electrónico)` *(Ejecuta con tus permisos)*.
   - **Quién tiene acceso (Who has access):** **Cualquier usuario** *(Anyone)*.  
     *(⚠️ IMPORTANTE: Debe ser "Cualquier usuario" para que los visitantes de tu página web puedan enviar datos sin necesidad de iniciar sesión en Google).*
4. Haz clic en **Implementar** (Deploy).
5. Google te solicitará **Autorizar el acceso**:
   - Haz clic en **Autorizar acceso**.
   - Selecciona tu cuenta de Google.
   - Si aparece la pantalla *"Google no ha verificado esta aplicación"*, haz clic en **Avanzado** (o Advanced) en la parte inferior izquierda.
   - Haz clic en **Ir a API Formulario Contacto (no seguro)**.
   - Haz clic en **Permitir** (Allow).
6. Una vez completado, Google te mostrará la pantalla con la **URL de la aplicación web**.
   Tendrá un formato similar a este:
   ```
   https://script.google.com/macros/s/AKfycbx...TU_ID.../exec
   ```
7. **Copia esta URL completa**.

---

## 🔗 Paso 5: Conectar la URL con tu Formulario

Tienes dos opciones muy sencillas para conectar tu URL:

### Opción A (Recomendada): En el archivo `script.js`
Abre el archivo `script.js` y reemplaza el valor de `GOOGLE_SHEETS_SCRIPT_URL`:

```javascript
const CONFIG = {
  // Pega aquí la URL copiada de Google Apps Script:
  GOOGLE_SHEETS_SCRIPT_URL: "https://script.google.com/macros/s/TU_SCRIPT_ID_REAL/exec",
  
  EMAILJS_PUBLIC_KEY: "...",
  EMAILJS_SERVICE_ID: "...",
  EMAILJS_TEMPLATE_ID: "..."
};
```

### Opción B: Directamente desde la Página Web
1. Abre `index.html` en tu navegador.
2. En la esquina superior derecha, haz clic en el botón **⚙️ Conexiones**.
3. En el campo **"URL de Aplicación Web de Apps Script"**, pega tu enlace.
4. Haz clic en **"Guardar Credenciales"**. La URL se guardará automáticamente.

---

## ✅ Paso 6: Probar el Funcionamiento

1. Abre tu formulario (`index.html`) en el navegador.
2. Llena los tres campos con datos de prueba:
   - **Nombre:** Tu Nombre y Apellido
   - **Correo:** tu_correo@ejemplo.com
   - **Comentario:** Este es un mensaje de prueba para verificar que Google Sheets guarde la información.
3. Haz clic en **"ENVIAR MI MENSAJE"**.
4. Ve a tu hoja de Google Sheets. ¡Verás aparecer la nueva fila con los datos de inmediato!

---

## ❓ Solución de Problemas Frecuentes

- **¿Qué hago si edito el código en Apps Script?**  
  Cada vez que modifiques el código en Apps Script, debes ir a **Implementar** > **Administrar implementaciones** > Editar > seleccionar **Nueva versión** y hacer clic en **Implementar**.
- **Error "Failed to fetch" o permisos denegados:**  
  Verifica que en "Quién tiene acceso" hayas seleccionado **"Cualquier usuario"** (Anyone), no "Solo yo".
