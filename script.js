/**
 * ==========================================================================
 * FORMULARIO DE CONTACTO INTERACTIVO - SCRIPT PRINCIPAL (VANILLA JS)
 * ==========================================================================
 * 
 * Este archivo gestiona:
 * 1. Validaciones inteligentes en tiempo real (Nombre, Correo, Comentario >= 20 car.)
 * 2. Contador dinámico de caracteres restantes
 * 3. Conexión real con Google Sheets mediante Google Apps Script (Web App POST)
 * 4. Conexión real con EmailJS para envío de notificación por correo
 * 5. Efectos visuales: partículas flotantes, efecto ripple, animaciones y modal
 * 
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * Reemplaza los siguientes valores con tus credenciales reales obtenidas según
 * las guías adjuntas (instrucciones-google-sheets.md e instrucciones-emailjs.md),
 * o configúralos directamente desde el botón de configuración (⚙️) en la interfaz.
 */

// ==========================================================================
// 1. CONFIGURACIÓN DE CONEXIONES (MODIFICA AQUÍ TUS CREDENCIALES)
// ==========================================================================
const CONFIG = {
  // URL de la aplicación web de Google Apps Script publicada
  // Ejemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
  GOOGLE_SHEETS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxSQUNR3DKoTplkOvdNMhtQc56iC5ekYemR4wR9kp2cx4MX7eR-SWCylzJM6l-_u738/exec",

  // Credenciales de EmailJS (obtenidas desde https://dashboard.emailjs.com/)
  EMAILJS_PUBLIC_KEY: "yk0Qx3bc2qit4F-Ec",
  EMAILJS_SERVICE_ID: "service_f11sacj",
  EMAILJS_TEMPLATE_ID: "template_52ow3lb",

  // Parámetro para permitir modo de simulación de prueba en caso de querer
  // explorar toda la experiencia visual y animaciones antes de configurar API keys
  ALLOW_DEMO_MODE_IF_UNCONFIGURED: true
};

// Cargar credenciales guardadas en localStorage si existen (para permitir probar desde la UI)
(function loadSavedConfig() {
  try {
    const saved = localStorage.getItem("contact_form_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.GOOGLE_SHEETS_SCRIPT_URL) CONFIG.GOOGLE_SHEETS_SCRIPT_URL = parsed.GOOGLE_SHEETS_SCRIPT_URL;
      if (parsed.EMAILJS_PUBLIC_KEY) CONFIG.EMAILJS_PUBLIC_KEY = parsed.EMAILJS_PUBLIC_KEY;
      if (parsed.EMAILJS_SERVICE_ID) CONFIG.EMAILJS_SERVICE_ID = parsed.EMAILJS_SERVICE_ID;
      if (parsed.EMAILJS_TEMPLATE_ID) CONFIG.EMAILJS_TEMPLATE_ID = parsed.EMAILJS_TEMPLATE_ID;
    }
  } catch (e) {
    console.warn("No se pudo leer la configuración local:", e);
  }
})();

// ==========================================================================
// 2. ELEMENTOS DEL DOM Y ESTADO GLOBAL
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Elementos del formulario
  const contactForm = document.getElementById("contact-form");
  const nameInput = document.getElementById("user-name");
  const emailInput = document.getElementById("user-email");
  const commentInput = document.getElementById("user-comment");
  const submitBtn = document.getElementById("submit-btn");

  // Grupos de formulario para manipulación visual
  const nameGroup = document.getElementById("group-name");
  const emailGroup = document.getElementById("group-email");
  const commentGroup = document.getElementById("group-comment");

  // Elementos de error
  const nameError = document.getElementById("error-name");
  const emailError = document.getElementById("error-email");
  const commentError = document.getElementById("error-comment");

  // Contador de caracteres
  const charCounterText = document.getElementById("char-counter-text");
  const charCounterProgress = document.getElementById("char-counter-progress");

  // Vistas y tarjetas
  const formFieldsWrapper = document.getElementById("form-fields-wrapper");
  const confirmationCard = document.getElementById("confirmation-card");
  const resetFormBtn = document.getElementById("reset-form-btn");

  // Resumen de éxito
  const summaryName = document.getElementById("summary-name");
  const summaryEmail = document.getElementById("summary-email");
  const summaryDate = document.getElementById("summary-date");

  // Modal de configuración y badges
  const configModal = document.getElementById("config-modal");
  const openConfigBtn = document.getElementById("open-config-btn");
  const closeConfigBtn = document.getElementById("close-config-btn");
  const saveConfigBtn = document.getElementById("save-config-btn");
  const configSheetsUrlInput = document.getElementById("config-sheets-url");
  const configEmailjsPublicInput = document.getElementById("config-emailjs-public");
  const configEmailjsServiceInput = document.getElementById("config-emailjs-service");
  const configEmailjsTemplateInput = document.getElementById("config-emailjs-template");
  const statusBadgeText = document.getElementById("status-badge-text");

  // Estado de envío
  let isSubmitting = false;

  // Inicializar SDK de EmailJS si está configurado
  initEmailJS();

  // Actualizar badge de estado en la barra superior
  updateStatusBadge();

  // ==========================================================================
  // 3. REGLAS Y FUNCIONES DE VALIDACIÓN
  // ==========================================================================

  /**
   * Valida el campo Nombre:
   * - No vacío
   * - Solo letras, tildes, ñ/Ñ, espacios y guiones
   * - Mínimo 2 letras
   */
  function validateName() {
    const value = nameInput.value.trim();

    if (!value) {
      setFieldError(nameGroup, nameError, "Por favor, ingresa tu nombre completo.");
      return false;
    }

    // Comprobar si contiene números
    if (/\d/.test(value)) {
      setFieldError(nameGroup, nameError, "Por favor, ingresa un nombre válido. No se permiten números.");
      return false;
    }

    // Comprobar que solo tenga letras permitidas, tildes, espacios y guiones
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-]+$/;
    if (!nameRegex.test(value)) {
      setFieldError(nameGroup, nameError, "El nombre solo puede contener letras y espacios.");
      return false;
    }

    // Contar letras reales (excluyendo espacios y guiones)
    const letterCount = value.replace(/[\s\-]/g, "").length;
    if (letterCount < 2) {
      setFieldError(nameGroup, nameError, "El nombre debe contener al menos 2 letras.");
      return false;
    }

    setFieldSuccess(nameGroup, nameError);
    return true;
  }

  /**
   * Valida el campo Correo Electrónico:
   * - No vacío
   * - Formato de email válido estándar
   */
  function validateEmail() {
    const value = emailInput.value.trim();

    if (!value) {
      setFieldError(emailGroup, emailError, "Ingresa una dirección de correo electrónico válida.");
      return false;
    }

    // Expresión regular estándar y estricta para correos
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      setFieldError(emailGroup, emailError, "Ingresa una dirección de correo electrónico válida.");
      return false;
    }

    setFieldSuccess(emailGroup, emailError);
    return true;
  }

  /**
   * Valida el campo Comentario:
   * - No vacío
   * - Mínimo 20 caracteres
   */
  function validateComment() {
    const value = commentInput.value.trim();
    const length = value.length;

    updateCommentCounter(length);

    if (length === 0 || length < 20) {
      setFieldError(commentGroup, commentError, "Tu comentario debe contener al menos 20 caracteres.");
      return false;
    }

    setFieldSuccess(commentGroup, commentError);
    return true;
  }

  /**
   * Actualiza el contador dinámico y barra de progreso del textarea
   */
  function updateCommentCounter(currentLength) {
    const minRequired = 20;

    if (currentLength < minRequired) {
      const remaining = minRequired - currentLength;
      const charWord = remaining === 1 ? "carácter" : "caracteres";
      charCounterText.textContent = `${currentLength} / ${minRequired} caracteres (te faltan ${remaining} ${charWord})`;
      charCounterText.classList.remove("met");
      charCounterProgress.classList.remove("is-completed");
    } else {
      charCounterText.textContent = `${currentLength} caracteres ✓ ¡Requisito completado!`;
      charCounterText.classList.add("met");
      charCounterProgress.classList.add("is-completed");
    }

    // Porcentaje de progreso (hasta el mínimo requerido)
    const percentage = Math.min(100, Math.round((currentLength / minRequired) * 100));
    charCounterProgress.style.width = `${percentage}%`;
  }

  /**
   * Aplica estilos de error al campo
   */
  function setFieldError(groupElement, errorElement, message) {
    groupElement.classList.remove("is-valid");
    groupElement.classList.add("is-invalid");

    const textSpan = errorElement.querySelector(".error-text");
    if (textSpan) {
      textSpan.textContent = message;
    } else {
      errorElement.textContent = message;
    }
  }

  /**
   * Aplica estilos de éxito al campo
   */
  function setFieldSuccess(groupElement, errorElement) {
    groupElement.classList.remove("is-invalid");
    groupElement.classList.add("is-valid");

    const textSpan = errorElement.querySelector(".error-text");
    if (textSpan) {
      textSpan.textContent = "";
    } else {
      errorElement.textContent = "";
    }
  }

  /**
   * Limpia el estado de validación de un campo
   */
  function clearFieldState(groupElement, errorElement) {
    groupElement.classList.remove("is-invalid", "is-valid");
    const textSpan = errorElement.querySelector(".error-text");
    if (textSpan) {
      textSpan.textContent = "";
    } else {
      errorElement.textContent = "";
    }
  }

  // ==========================================================================
  // 4. EVENTOS EN TIEMPO REAL
  // ==========================================================================

  // Validación de nombre en tiempo real
  nameInput.addEventListener("input", () => {
    // Si ya comenzó a escribir, validar
    if (nameInput.value.length > 0) {
      validateName();
    } else {
      clearFieldState(nameGroup, nameError);
    }
  });

  nameInput.addEventListener("blur", () => {
    if (nameInput.value.length > 0) {
      validateName();
    }
  });

  // Validación de email en tiempo real
  emailInput.addEventListener("input", () => {
    if (emailInput.value.length > 0) {
      validateEmail();
    } else {
      clearFieldState(emailGroup, emailError);
    }
  });

  emailInput.addEventListener("blur", () => {
    if (emailInput.value.length > 0) {
      validateEmail();
    }
  });

  // Validación de comentario en tiempo real
  commentInput.addEventListener("input", () => {
    validateComment();
  });

  commentInput.addEventListener("blur", () => {
    if (commentInput.value.length > 0) {
      validateComment();
    }
  });

  // ==========================================================================
  // 5. ENVÍO DEL FORMULARIO E INTEGRACIONES
  // ==========================================================================

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Evitar envíos múltiples o duplicados
    if (isSubmitting) return;

    // Ejecutar todas las validaciones
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isCommentValid = validateComment();

    // Si algún campo no cumple las reglas, enfocar el primer campo inválido
    if (!isNameValid || !isEmailValid || !isCommentValid) {
      showToast("Por favor revisa los campos señalados en rojo antes de enviar.", "error", "Atención");

      if (!isNameValid) {
        nameInput.focus();
      } else if (!isEmailValid) {
        emailInput.focus();
      } else if (!isCommentValid) {
        commentInput.focus();
      }
      return;
    }

    // Extraer datos limpios
    const formData = {
      nombre: nameInput.value.trim(),
      email: emailInput.value.trim(),
      comentario: commentInput.value.trim(),
      fecha_hora: formatCurrentDateTime()
    };

    // Verificar si las credenciales están configuradas
    const isSheetsConfigured = isRealCredential(CONFIG.GOOGLE_SHEETS_SCRIPT_URL);
    const isEmailjsConfigured = isRealCredential(CONFIG.EMAILJS_PUBLIC_KEY) &&
                                isRealCredential(CONFIG.EMAILJS_SERVICE_ID) &&
                                isRealCredential(CONFIG.EMAILJS_TEMPLATE_ID);

    // Si ninguna credencial está configurada y no se permite modo demo
    if (!isSheetsConfigured && !isEmailjsConfigured && !CONFIG.ALLOW_DEMO_MODE_IF_UNCONFIGURED) {
      showToast("Debes configurar tu URL de Google Apps Script o tus claves de EmailJS para realizar un envío real.", "error", "Credenciales Requeridas");
      openConfigModal();
      return;
    }

    // Activar estado de carga en botón
    setSubmittingState(true);

    try {
      const results = [];

      // 1. Envío a Google Sheets (si está configurado)
      if (isSheetsConfigured) {
        results.push(sendToGoogleSheets(formData));
      } else {
        console.info("[Google Sheets] Credencial no configurada aún. Revisa instrucciones-google-sheets.md");
      }

      // 2. Envío a EmailJS (si está configurado)
      if (isEmailjsConfigured) {
        results.push(sendToEmailJS(formData));
      } else {
        console.info("[EmailJS] Credenciales no configuradas aún. Revisa instrucciones-emailjs.md");
      }

      // Si ambos están sin configurar pero estamos en modo visual/demo guiado:
      if (!isSheetsConfigured && !isEmailjsConfigured) {
        // Simulación con retardo elegante para demostrar el flujo de éxito
        await new Promise((resolve) => setTimeout(resolve, 1400));
        showToast("Modo de prueba: Datos validados correctamente. Configura tus claves reales en el botón ⚙️.", "info", "Validación Exitosa");
      } else {
        // Esperar a que los servicios activos completen
        await Promise.all(results);
      }

      // Ambos servicios (o los configurados) respondieron exitosamente
      handleSuccessSubmission(formData);

    } catch (error) {
      console.error("Error durante el envío:", error);
      showToast(
        `Ocurrió un error al procesar el mensaje: ${error.message || "Error de conexión"}. Por favor verifica tus credenciales e intenta nuevamente.`,
        "error",
        "Error en el envío"
      );
    } finally {
      setSubmittingState(false);
    }
  });

  /**
   * Envía los datos a Google Sheets mediante Google Apps Script Web App
   */
  async function sendToGoogleSheets(data) {
    const url = CONFIG.GOOGLE_SHEETS_SCRIPT_URL;

    // Google Apps Script Web App requiere envío mediante POST
    // Utilizar text/plain para evitar errores de preflight CORS en Google Apps Script
    const payload = JSON.stringify({
      timestamp: data.fecha_hora,
      nombre: data.nombre,
      email: data.email,
      comentario: data.comentario
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: payload
      });

      // Si Google responde
      if (!response.ok && response.status !== 0) {
        throw new Error(`Google Apps Script respondió con código HTTP ${response.status}`);
      }

      return true;
    } catch (err) {
      // En navegadores, las redirecciones de Google Apps Script pueden causar respuestas de tipo opaque
      // Si la URL es válida, se procesa en el script. Si falla de red, lanzamos error.
      if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
        // Intento alternativo con mode 'no-cors' como fallback estándar para Google Apps Script
        try {
          await fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              timestamp: data.fecha_hora,
              nombre: data.nombre,
              email: data.email,
              comentario: data.comentario
            })
          });
          return true;
        } catch (innerErr) {
          throw new Error("No se pudo conectar con Google Apps Script. Revisa que la Web App esté publicada con acceso a 'Cualquier usuario'.");
        }
      }
      throw err;
    }
  }

  /**
   * Envía la notificación por correo mediante EmailJS
   */
  async function sendToEmailJS(data) {
    if (typeof emailjs === "undefined") {
      throw new Error("El SDK de EmailJS no se cargó correctamente.");
    }

    const templateParams = {
      nombre: data.nombre,
      email: data.email,
      comentario: data.comentario,
      fecha_hora: data.fecha_hora
    };

    const response = await emailjs.send(
      CONFIG.EMAILJS_SERVICE_ID,
      CONFIG.EMAILJS_TEMPLATE_ID,
      templateParams,
      CONFIG.EMAILJS_PUBLIC_KEY
    );

    if (response.status !== 200) {
      throw new Error(`EmailJS respondió con código ${response.status}: ${response.text}`);
    }

    return true;
  }

  /**
   * Inicializa EmailJS si la clave pública está disponible
   */
  function initEmailJS() {
    if (typeof emailjs !== "undefined" && isRealCredential(CONFIG.EMAILJS_PUBLIC_KEY)) {
      try {
        emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
        console.log("EmailJS inicializado correctamente.");
      } catch (err) {
        console.warn("Aviso al inicializar EmailJS:", err);
      }
    }
  }

  /**
   * Gestiona la interfaz y transición cuando el envío es exitoso
   */
  function handleSuccessSubmission(data) {
    // Rellenar datos en la tarjeta de resumen
    summaryName.textContent = data.nombre;
    summaryEmail.textContent = data.email;
    summaryDate.textContent = data.fecha_hora;

    // Disparar celebración de pétalos
    triggerPetalCelebration();

    // Transición suave entre formulario y confirmación
    formFieldsWrapper.classList.add("is-hidden");
    confirmationCard.classList.add("is-visible");

    // Limpiar formulario según requerimiento
    contactForm.reset();
    clearFieldState(nameGroup, nameError);
    clearFieldState(emailGroup, emailError);
    clearFieldState(commentGroup, commentError);
    updateCommentCounter(0);

    // Desplazar suavemente a la tarjeta de confirmación
    confirmationCard.scrollIntoView({ behavior: "smooth", block: "center" });

    showToast("¡Mensaje registrado y enviado exitosamente!", "success", "¡Excelente!");
  }

  /**
   * Botón para enviar otro mensaje y reiniciar el formulario
   */
  resetFormBtn.addEventListener("click", () => {
    confirmationCard.classList.remove("is-visible");
    formFieldsWrapper.classList.remove("is-hidden");
    nameInput.focus();
  });

  /**
   * Controla el estado visual del botón durante el envío
   */
  function setSubmittingState(loading) {
    isSubmitting = loading;
    submitBtn.disabled = loading;

    const btnText = submitBtn.querySelector(".btn-text");

    if (loading) {
      submitBtn.classList.add("is-loading");
      if (btnText) btnText.textContent = "ENVIANDO MENSAJE...";
    } else {
      submitBtn.classList.remove("is-loading");
      if (btnText) btnText.textContent = "ENVIAR MI MENSAJE";
    }
  }

  /**
   * Verifica si una credencial ha sido cambiada de su valor por defecto
   */
  function isRealCredential(val) {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim();
    if (trimmed === "" ||
        trimmed.startsWith("TU_") ||
        trimmed.includes("AQUI") ||
        trimmed.includes("...") ||
        trimmed === "TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI" ||
        trimmed === "TU_EMAILJS_PUBLIC_KEY_AQUI") {
      return false;
    }
    return true;
  }

  /**
   * Actualiza el badge superior indicando si las credenciales están listas
   */
  function updateStatusBadge() {
    const hasSheets = isRealCredential(CONFIG.GOOGLE_SHEETS_SCRIPT_URL);
    const hasEmailjs = isRealCredential(CONFIG.EMAILJS_PUBLIC_KEY) &&
                       isRealCredential(CONFIG.EMAILJS_SERVICE_ID) &&
                       isRealCredential(CONFIG.EMAILJS_TEMPLATE_ID);

    if (hasSheets && hasEmailjs) {
      statusBadgeText.textContent = "Sheets y EmailJS Conectados";
    } else if (hasSheets) {
      statusBadgeText.textContent = "Google Sheets Conectado";
    } else if (hasEmailjs) {
      statusBadgeText.textContent = "EmailJS Conectado";
    } else {
      statusBadgeText.textContent = "Modo interactivo preparado";
    }

    // Actualizar pills del modal si existe
    const sheetsPill = document.getElementById("pill-sheets-status");
    const emailjsPill = document.getElementById("pill-emailjs-status");

    if (sheetsPill) {
      sheetsPill.textContent = hasSheets ? "Conectado" : "Pendiente";
      sheetsPill.className = `service-status-pill ${hasSheets ? "ready" : "pending"}`;
    }

    if (emailjsPill) {
      emailjsPill.textContent = hasEmailjs ? "Conectado" : "Pendiente";
      emailjsPill.className = `service-status-pill ${hasEmailjs ? "ready" : "pending"}`;
    }
  }

  /**
   * Formatea la fecha y hora actual en formato DD/MM/AAAA HH:mm:ss
   */
  function formatCurrentDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");

    const dia = pad(now.getDate());
    const mes = pad(now.getMonth() + 1);
    const anio = now.getFullYear();
    const horas = pad(now.getHours());
    const minutos = pad(now.getMinutes());
    const segundos = pad(now.getSeconds());

    return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
  }

  // ==========================================================================
  // 6. EFECTO ONDA (RIPPLE) EN BOTÓN
  // ==========================================================================
  submitBtn.addEventListener("click", function (e) {
    if (this.disabled) return;

    const rect = this.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");

    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    this.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });

  // ==========================================================================
  // 7. SISTEMA DE NOTIFICACIONES TOAST
  // ==========================================================================
  const toastContainer = document.getElementById("toast-container");

  function showToast(message, type = "info", title = "") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "error") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === "success") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div>${message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar">&times;</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  // ==========================================================================
  // 8. MODAL DE CONFIGURACIÓN DE CONEXIONES
  // ==========================================================================
  function openConfigModal() {
    configSheetsUrlInput.value = isRealCredential(CONFIG.GOOGLE_SHEETS_SCRIPT_URL) ? CONFIG.GOOGLE_SHEETS_SCRIPT_URL : "";
    configEmailjsPublicInput.value = isRealCredential(CONFIG.EMAILJS_PUBLIC_KEY) ? CONFIG.EMAILJS_PUBLIC_KEY : "";
    configEmailjsServiceInput.value = isRealCredential(CONFIG.EMAILJS_SERVICE_ID) ? CONFIG.EMAILJS_SERVICE_ID : "";
    configEmailjsTemplateInput.value = isRealCredential(CONFIG.EMAILJS_TEMPLATE_ID) ? CONFIG.EMAILJS_TEMPLATE_ID : "";

    configModal.classList.add("is-open");
    configModal.setAttribute("aria-hidden", "false");
  }

  function closeConfigModal() {
    configModal.classList.remove("is-open");
    configModal.setAttribute("aria-hidden", "true");
  }

  if (openConfigBtn) openConfigBtn.addEventListener("click", openConfigModal);
  if (closeConfigBtn) closeConfigBtn.addEventListener("click", closeConfigModal);

  // Cerrar al hacer clic en el backdrop
  configModal.addEventListener("click", (e) => {
    if (e.target === configModal) closeConfigModal();
  });

  // Guardar configuración
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener("click", () => {
      const sheetsUrl = configSheetsUrlInput.value.trim();
      const emailPublic = configEmailjsPublicInput.value.trim();
      const emailService = configEmailjsServiceInput.value.trim();
      const emailTemplate = configEmailjsTemplateInput.value.trim();

      if (sheetsUrl) CONFIG.GOOGLE_SHEETS_SCRIPT_URL = sheetsUrl;
      if (emailPublic) CONFIG.EMAILJS_PUBLIC_KEY = emailPublic;
      if (emailService) CONFIG.EMAILJS_SERVICE_ID = emailService;
      if (emailTemplate) CONFIG.EMAILJS_TEMPLATE_ID = emailTemplate;

      try {
        localStorage.setItem("contact_form_config", JSON.stringify({
          GOOGLE_SHEETS_SCRIPT_URL: CONFIG.GOOGLE_SHEETS_SCRIPT_URL,
          EMAILJS_PUBLIC_KEY: CONFIG.EMAILJS_PUBLIC_KEY,
          EMAILJS_SERVICE_ID: CONFIG.EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID: CONFIG.EMAILJS_TEMPLATE_ID
        }));
      } catch (err) {
        console.warn("No se pudo guardar en localStorage:", err);
      }

      initEmailJS();
      updateStatusBadge();
      closeConfigModal();
      showToast("Configuración guardada exitosamente.", "success", "Guardado");
    });
  }

  // ==========================================================================
  // 9. CELEBRACIÓN DE PÉTALOS Y CONFETI PASTEL
  // ==========================================================================
  function triggerPetalCelebration() {
    const count = 35;
    const colors = ["#FBC6DD", "#FCE0EC", "#EA5C9A", "#BFD8A8", "#E6F4D8", "#F9DFC3"];

    for (let i = 0; i < count; i++) {
      const petal = document.createElement("div");
      petal.className = "celebration-petal";

      const size = Math.random() * 12 + 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const startX = window.innerWidth / 2 + (Math.random() * 200 - 100);
      const startY = window.innerHeight * 0.45;
      const endX = startX + (Math.random() * 400 - 200);
      const endY = startY + (Math.random() * 300 + 150);
      const rotation = Math.random() * 720 - 360;

      petal.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size * 1.3}px;
        background-color: ${color};
        border-radius: 50% 0 50% 50%;
        top: ${startY}px;
        left: ${startX}px;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.9;
        transform: translate(0, 0) rotate(0deg);
        transition: transform 1.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.8s ease;
      `;

      document.body.appendChild(petal);

      requestAnimationFrame(() => {
        petal.style.transform = `translate(${endX - startX}px, ${endY - startY}px) rotate(${rotation}deg)`;
        petal.style.opacity = "0";
      });

      setTimeout(() => {
        petal.remove();
      }, 2000);
    }
  }

  // Marca de inicialización exitosa
  window.__CONTACT_FORM_INITIALIZED__ = true;
});

// ==========================================================================
// 10. CANVAS DE PARTÍCULAS PASTEL INTERACTIVAS DE FONDO
// ==========================================================================
(function initAmbientParticles() {
  // Respetar preferencia de movimiento reducido
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];
  const particleColors = [
    "rgba(251, 198, 221, 0.45)",  // Rosa pastel
    "rgba(252, 224, 236, 0.55)",  // Rosa suave
    "rgba(230, 244, 216, 0.5)",   // Verde natural
    "rgba(249, 223, 195, 0.45)",  // Crema
    "rgba(191, 216, 168, 0.35)"   // Verde suave
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 5 + 3;
      this.speedY = Math.random() * 0.45 + 0.15;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.02;
      this.aspect = Math.random() * 0.5 + 0.7; // Para forma orgánica de pétalo
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX + Math.sin(this.angle) * 0.2;
      this.angle += this.angularSpeed;

      if (this.y < -20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      // Dibujar forma de pétalo orgánico
      ctx.ellipse(0, 0, this.size, this.size * this.aspect, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Inicializar conjunto de partículas
  const count = Math.min(30, Math.floor((width * height) / 32000));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  let animationFrameId;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  // Pausar animación cuando la pestaña está en segundo plano para ahorrar batería
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
    } else {
      animate();
    }
  });
})();
