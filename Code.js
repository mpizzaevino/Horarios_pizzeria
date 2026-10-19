/**
 * MARCELLINO PIZZA Y VINO
 * Gestión de turnos, enlaces privados y compensación de horas extra.
 * Base de datos interna: PropertiesService.
 */

const CONFIG = {
  EMPLEADOS: 'MPV_EMPLEADOS',
  CALENDARIOS: 'MPV_CALENDARIOS',
  ENLACES: 'MPV_ENLACES',
  COMPENSOS: 'MPV_COMPENSOS',
  HISTORIAL_SALDOS: 'MPV_HISTORIAL_SALDOS',
  AJUSTES: 'MPV_AJUSTES',
  PLANTILLAS: 'MPV_PLANTILLAS',
  NOMBRE_NEGOCIO: 'Marcellino Pizza y Vino',
  CADUCIDAD_CALENDARIO: 45,
  CADUCIDAD_COMPENSO: 15,
  get ZONA_HORARIA() {
    try {
      return Session.getScriptTimeZone() || 'Europe/Madrid';
    } catch (e) {
      return 'Europe/Madrid';
    }
  }
};

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TURNOS_BASE = {
  manana: { nombre: 'Mañana', inicio: '10:00', fin: '16:00' },
  tarde: { nombre: 'Comida', inicio: '13:00', fin: '16:30' },
  cena: { nombre: 'Cena', inicio: '19:30', fin: '23:30' }
};

const NECESIDADES_BASE = {
  manana: { COCINA: 1, PIZZERIA: 0, SALA: 2 },
  tarde: { COCINA: 1, PIZZERIA: 1, SALA: 2 },
  cena: { COCINA: 1, PIZZERIA: 1, SALA: 3 }
};

/* =========================
   ENRUTADOR WEB SEGURO
   ========================= */

function doGet(e) {
  const parametros = e && e.parameter ? e.parameter : {};

  const pagina = String(parametros.page || 'admin').trim();
  const token = String(parametros.token || '').trim();

  if (pagina === 'view_schedule' || pagina === 'view_compensation') {
    const plantilla = HtmlService.createTemplateFromFile('View');
    plantilla.pagina = pagina;
    plantilla.token = token;

    return plantilla.evaluate()
      .setTitle('Control de Horarios y Turnos')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.NOMBRE_NEGOCIO + ' · Gestión de turnos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* =========================
   INICIALIZACIÓN Y UTILIDADES
   ========================= */

function inicializarSistema() {
  const empleados = obtenerEmpleados_();

  if (!empleados || empleados.length === 0) {
    guardarEmpleados_([
      {
        id: '1',
        name: 'Gilberto Nasser',
        phone: '+34 676 44 92 13',
        email: '',
        dept: 'SALA',
        hours: 40,
        active: true,
        prefShift: ['Cualquiera'],
        exclShift: [],
        exclDay: []
      },
      {
        id: '2',
        name: 'Mohammed Husein',
        phone: '+34 632 41 09 21',
        email: '',
        dept: 'PIZZERIA',
        hours: 40,
        active: true,
        prefShift: ['Cualquiera'],
        exclShift: [],
        exclDay: []
      },
      {
        id: '3',
        name: 'Angela Nasser',
        phone: '+34 610 19 41 62',
        email: '',
        dept: 'COCINA',
        hours: 40,
        active: true,
        prefShift: ['Cualquiera'],
        exclShift: [],
        exclDay: []
      },
      {
        id: '4',
        name: 'Manuel (nuevo)',
        phone: '+34 654 44 25 99',
        email: '',
        dept: 'SALA',
        hours: 40,
        active: true,
        prefShift: ['Cualquiera'],
        exclShift: [],
        exclDay: []
      },
      {
        id: '5',
        name: 'Rosmary Nasser',
        phone: '+34 681 35 75 83',
        email: '',
        dept: 'SALA',
        hours: 40,
        active: false,
        prefShift: ['Cualquiera'],
        exclShift: [],
        exclDay: []
      },
      {
        id: '6',
        name: 'Facundo Cam',
        phone: '+34 654 44 25 99',
        email: '',
        dept: 'SALA',
        hours: 40,
        active: true,
        prefShift: ['Cualquiera'],
        exclShift: ['Mañana', 'Tarde'],
        exclDay: ['Lunes', 'Martes', 'Miércoles', 'Jueves']
      }
    ]);
  }

  const ajustes = obtenerJson_(CONFIG.AJUSTES, null);
  if (!ajustes) {
    guardarJson_(CONFIG.AJUSTES, {
      precioHoraExtra: 8.50,
      logoTexto: 'Marcellino Pizza y Vino'
    });
  }

  if (!obtenerJson_(CONFIG.CALENDARIOS, null)) guardarJson_(CONFIG.CALENDARIOS, []);
  if (!obtenerJson_(CONFIG.ENLACES, null)) guardarJson_(CONFIG.ENLACES, []);
  if (!obtenerJson_(CONFIG.COMPENSOS, null)) guardarJson_(CONFIG.COMPENSOS, []);
  if (!obtenerJson_(CONFIG.HISTORIAL_SALDOS, null)) guardarJson_(CONFIG.HISTORIAL_SALDOS, []);

  // F3: Inicialización de plantillas predeterminadas
  if (!obtenerJson_(CONFIG.PLANTILLAS, null)) {
    guardarPlantillas_([
      {
        id: 'plantilla_estandar',
        nombre: 'Estándar Marcellino',
        turnos: TURNOS_BASE,
        necesidades: NECESIDADES_BASE,
        horariosRoles: {
          manana: {
            COCINA:   { inicio: '10:00', fin: '16:00' },
            PIZZERIA: { inicio: '10:00', fin: '16:00' },
            SALA:     { inicio: '10:00', fin: '16:00' }
          },
          tarde: {
            COCINA:   { inicio: '13:00', fin: '16:30' },
            PIZZERIA: { inicio: '13:00', fin: '16:30' },
            SALA:     { inicio: '13:00', fin: '16:30' }
          },
          cena: {
            COCINA:   { inicio: '19:30', fin: '23:30' },
            PIZZERIA: { inicio: '19:30', fin: '23:30' },
            SALA:     { inicio: '19:30', fin: '23:30' }
          }
        },
        turnosActivosPorDia: normalizarTurnosActivosPorDia_({}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  }

  return { ok: true, mensaje: 'Sistema inicializado correctamente.' };
}

function obtenerDatosIniciales(tokenSesion) {
  verificarSesion_(tokenSesion);
  inicializarSistema();

  limpiarEnlacesExpirados();

  // FIX-05 / BUG-FIX: la comprobación de almacenamiento se realiza de forma no bloqueante.
  // checkStorageCapacity_ puede disparar un respaldo en Google Sheets que es lento.
  // Para no bloquear el login ni el primer cargarDatos(), se ejecuta después de devolver
  // los datos, usando un disparador de tiempo inmediato si hay alerta, o simplemente
  // calculando el estado sin ejecutar el respaldo en esta llamada.
  let estadoAlmacenamiento;
  try {
    estadoAlmacenamiento = checkStorageCapacidadSolo_();
  } catch (error) {
    console.error('No se pudo comprobar el almacenamiento: ' + error.message);
    estadoAlmacenamiento = {
      totalBytes: 0,
      bytesCalendarios: 0,
      porcentajeTotal: 0,
      porcentajeCalendarios: 0,
      alerta: false,
      ultimaLimpieza: new Date().toISOString(),
      error: error.message
    };
  }

  return {
    empleados: obtenerEmpleados_(),
    calendarios: obtenerCalendarios_(),
    enlaces: obtenerEnlaces_(),
    plantillas: obtenerPlantillas_(),
    ajustes: obtenerJson_(CONFIG.AJUSTES, { precioHoraExtra: 8.50, precioHoraFestiva: 11.60, diasLaborablesSemana: 6 }),
    urlApp: obtenerUrlApp_(),
    almacenamiento: estadoAlmacenamiento
  };
}

// BUG-FIX: versión de checkStorageCapacity_ que solo calcula el estado sin ejecutar
// el respaldo automático ni la purga. Así no bloquea el login ni el primer cargarDatos().
// El respaldo y la purga se realizan solo cuando se llama a checkStorageCapacity_
// directamente (por ejemplo, al generar un calendario).
function checkStorageCapacidadSolo_() {
  const propiedades = PropertiesService.getScriptProperties().getProperties();
  let totalBytes = 0;
  const bytesPorClave = {};

  Object.keys(propiedades).forEach(function(clave) {
    const bytes = Utilities.newBlob(propiedades[clave] || '').getBytes().length;
    bytesPorClave[clave] = bytes;
    totalBytes += bytes;
  });

  const bytesCalendarios = bytesPorClave[CONFIG.CALENDARIOS] || 0;
  const alerta = (bytesCalendarios >= CUOTA_BYTES_PROPIEDAD * UMBRAL_ALERTA_CUOTA) ||
    (totalBytes >= CUOTA_BYTES_TOTAL * UMBRAL_ALERTA_CUOTA);

  return {
    totalBytes: totalBytes,
    bytesCalendarios: bytesCalendarios,
    porcentajeTotal: redondear2Decimales_((totalBytes / CUOTA_BYTES_TOTAL) * 100),
    porcentajeCalendarios: redondear2Decimales_((bytesCalendarios / CUOTA_BYTES_PROPIEDAD) * 100),
    alerta: alerta,
    ultimaLimpieza: new Date().toISOString()
  };
}

function obtenerJson_(clave, valorDefecto) {
  const valor = PropertiesService.getScriptProperties().getProperty(clave);
  if (!valor) return valorDefecto;
  try {
    return JSON.parse(valor);
  } catch (error) {
    return valorDefecto;
  }
}

function guardarJson_(clave, datos) {
  PropertiesService.getScriptProperties().setProperty(clave, JSON.stringify(datos));
}

function generarId_() {
  return Utilities.getUuid();
}

function generarToken_() {
  const semilla = Utilities.getUuid() + '|' + new Date().getTime() + '|' + Math.random();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, semilla);
  return bytes.map(function(b) {
    const valor = (b + 256) % 256;
    return ('0' + valor.toString(16)).slice(-2);
  }).join('');
}

function obtenerUrlApp_() {
  const url = ScriptApp.getService().getUrl() || '';
  return url.replace(/\/u\/\d+\//, '/');
}

function fechaISO_(fecha) {
  return Utilities.formatDate(new Date(fecha), CONFIG.ZONA_HORARIA, 'yyyy-MM-dd');
}

function fechaLegible_(fecha) {
  return Utilities.formatDate(new Date(fecha), CONFIG.ZONA_HORARIA, 'dd/MM/yyyy');
}

function sumarDias_(fecha, dias) {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + Number(dias));
  return resultado;
}

function redondearHoras_(numero) {
  return Math.round((Number(numero) || 0) * 2) / 2;
}

function redondear2Decimales_(numero) {
  return Math.round((Number(numero) || 0) * 100) / 100;
}

function redondear_(numero) {
  return redondearHoras_(numero);
}

function redondear(valor) {
  return redondearHoras_(valor);
}

function normalizarTelefono_(telefono) {
  return String(telefono || '').replace(/[^\d]/g, '');
}

/* =========================
   FESTIVOS NACIONALES Y VALENCIA
   ========================= */

function calcularDomingoPascua_(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia, 12);
}

function formatearFechaISO_(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function obtenerFestivosOficialesValencia(desdeStr, hastaStr) {
  if (!desdeStr || !hastaStr) return [];
  const anioInicio = parseInt(desdeStr.substring(0, 4), 10);
  const anioFin = parseInt(hastaStr.substring(0, 4), 10);
  const festivos = [];

  for (let anio = anioInicio; anio <= anioFin; anio++) {
    const fijos = [
      { mes: '01', dia: '01', nombre: 'Año Nuevo', tipo: 'Nacional' },
      { mes: '01', dia: '06', nombre: 'Epifanía del Señor (Reyes)', tipo: 'Nacional' },
      { mes: '01', dia: '22', nombre: 'San Vicente Mártir', tipo: 'Local Valencia' },
      { mes: '03', dia: '19', nombre: 'San José', tipo: 'Autonómico C. Valenciana' },
      { mes: '05', dia: '01', nombre: 'Fiesta del Trabajo', tipo: 'Nacional' },
      { mes: '06', dia: '24', nombre: 'San Juan', tipo: 'Autonómico C. Valenciana' },
      { mes: '08', dia: '15', nombre: 'Asunción de la Virgen', tipo: 'Nacional' },
      { mes: '10', dia: '09', nombre: 'Día de la Comunitat Valenciana', tipo: 'Autonómico C. Valenciana' },
      { mes: '10', dia: '12', nombre: 'Fiesta Nacional de España', tipo: 'Nacional' },
      { mes: '11', dia: '01', nombre: 'Todos los Santos', tipo: 'Nacional' },
      { mes: '12', dia: '06', nombre: 'Día de la Constitución Española', tipo: 'Nacional' },
      { mes: '12', dia: '08', nombre: 'Inmaculada Concepción', tipo: 'Nacional' },
      { mes: '12', dia: '25', nombre: 'Natividad del Señor (Navidad)', tipo: 'Nacional' }
    ];

    fijos.forEach(function(f) {
      festivos.push({
        fecha: anio + '-' + f.mes + '-' + f.dia,
        nombre: f.nombre + ' (' + f.tipo + ')',
        tipo: f.tipo
      });
    });

    const pascua = calcularDomingoPascua_(anio);

    const viernesSanto = new Date(pascua.getTime() - 2 * 24 * 60 * 60 * 1000);
    festivos.push({
      fecha: formatearFechaISO_(viernesSanto),
      nombre: 'Viernes Santo (Nacional)',
      tipo: 'Nacional'
    });

    const lunesPascua = new Date(pascua.getTime() + 1 * 24 * 60 * 60 * 1000);
    festivos.push({
      fecha: formatearFechaISO_(lunesPascua),
      nombre: 'Lunes de Pascua (Autonómico C. Valenciana)',
      tipo: 'Autonómico C. Valenciana'
    });

    const sanVicenteFerrer = new Date(pascua.getTime() + 8 * 24 * 60 * 60 * 1000);
    festivos.push({
      fecha: formatearFechaISO_(sanVicenteFerrer),
      nombre: 'San Vicente Ferrer (Local Valencia)',
      tipo: 'Local Valencia'
    });
  }

  return festivos
    .filter(function(f) { return f.fecha >= desdeStr && f.fecha <= hastaStr; })
    .sort(function(a, b) { return a.fecha.localeCompare(b.fecha); });
}

/* =========================
   FIX-02: AUTENTICACIÓN DE ADMINISTRADOR
   ========================= */

const CLAVE_ADMIN_HASH = 'MPV_ADMIN_PASS_HASH';
const DURACION_SESION_MINUTOS = 240;

function generarHash_(texto) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto));
  return bytes.map(function(b) {
    return ('0' + ((b + 256) % 256).toString(16)).slice(-2);
  }).join('');
}

function verificarHash_(texto, hash) {
  return generarHash_(String(texto || '')) === hash;
}

function existeContrasenaAdmin() {
  return Boolean(PropertiesService.getScriptProperties().getProperty(CLAVE_ADMIN_HASH));
}

function configurarContrasenaAdmin(tokenSesion, nuevaContrasena, contrasenaActual) {
  const scriptProps = PropertiesService.getScriptProperties();
  const hashActual = scriptProps.getProperty(CLAVE_ADMIN_HASH);

  // Primer uso del sistema: no existe todavía ninguna contraseña, así que no se exige sesión previa.
  if (hashActual) {
    verificarSesion_(tokenSesion);
    if (!verificarHash_(contrasenaActual, hashActual)) {
      throw new Error('La contraseña actual no es correcta.');
    }
  }

  if (!nuevaContrasena || String(nuevaContrasena).length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
  }

  scriptProps.setProperty(CLAVE_ADMIN_HASH, generarHash_(nuevaContrasena));
  return { ok: true };
}

function crearTokenSesion_() {
  const token = generarToken_();
  CacheService.getScriptCache().put('SESION_' + token, 'valida', DURACION_SESION_MINUTOS * 60);
  return token;
}

function iniciarSesionAdmin(contrasena) {
  const hashGuardado = PropertiesService.getScriptProperties().getProperty(CLAVE_ADMIN_HASH);

  if (!hashGuardado) {
    // No hay contraseña configurada todavía: la primera introducida se guarda como contraseña inicial.
    if (!contrasena || String(contrasena).length < 6) {
      throw new Error('Configura una contraseña de al menos 6 caracteres para crear el acceso de administrador.');
    }
    configurarContrasenaAdmin(null, contrasena, null);
    return { token: crearTokenSesion_(), primerUso: true };
  }

  if (!verificarHash_(contrasena, hashGuardado)) {
    throw new Error('Contraseña incorrecta.');
  }

  return { token: crearTokenSesion_(), primerUso: false };
}

function validarSesionAdmin(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('SESION_' + token) === 'valida';
}

function verificarSesion_(token) {
  if (!validarSesionAdmin(token)) {
    throw new Error('Sesión no válida o caducada. Vuelve a iniciar sesión.');
  }
}

function cerrarSesionAdmin(token) {
  if (token) CacheService.getScriptCache().remove('SESION_' + token);
  return { ok: true };
}

/* =========================
   FIX-01: CONTROL DE CUOTA Y LIMPIEZA AUTOMÁTICA
   ========================= */

const CUOTA_BYTES_TOTAL = 500 * 1024;   // límite aproximado de PropertiesService por proyecto
const CUOTA_BYTES_PROPIEDAD = 9 * 1024; // límite aproximado por propiedad individual
const UMBRAL_ALERTA_CUOTA = 0.75;       // 75%
const DIAS_ARCHIVADO_CALENDARIO = 60;
const DIAS_PURGA_ENLACES = 30;

function checkStorageCapacity_() {
  const propiedades = PropertiesService.getScriptProperties().getProperties();
  let totalBytes = 0;
  const bytesPorClave = {};

  Object.keys(propiedades).forEach(function(clave) {
    const bytes = Utilities.newBlob(propiedades[clave] || '').getBytes().length;
    bytesPorClave[clave] = bytes;
    totalBytes += bytes;
  });

  const bytesCalendarios = bytesPorClave[CONFIG.CALENDARIOS] || 0;
  const alerta = (bytesCalendarios >= CUOTA_BYTES_PROPIEDAD * UMBRAL_ALERTA_CUOTA) ||
    (totalBytes >= CUOTA_BYTES_TOTAL * UMBRAL_ALERTA_CUOTA);

  const resultado = {
    totalBytes: totalBytes,
    bytesCalendarios: bytesCalendarios,
    porcentajeTotal: redondear2Decimales_((totalBytes / CUOTA_BYTES_TOTAL) * 100),
    porcentajeCalendarios: redondear2Decimales_((bytesCalendarios / CUOTA_BYTES_PROPIEDAD) * 100),
    alerta: alerta,
    ultimaLimpieza: new Date().toISOString()
  };

  if (alerta) {
    // FIX-06: el respaldo automático y la purga se protegen por separado. Un fallo en uno
    // (por ejemplo, al escribir en Sheets) nunca debe impedir que el otro se ejecute,
    // ni debe propagarse hacia quien llamó a checkStorageCapacity_ (login, generación de calendario, etc.).
    try {
      exportDataToGoogleSheet_();
    } catch (errorRespaldo) {
      console.error('No se pudo generar el respaldo automático: ' + errorRespaldo.message);
      resultado.errorRespaldo = errorRespaldo.message;
    }

    try {
      resultado.calendariosPurgados = purgarCalendariosArchivados_();
    } catch (errorPurga) {
      console.error('No se pudo purgar calendarios archivados: ' + errorPurga.message);
      resultado.calendariosPurgados = 0;
      resultado.errorPurga = errorPurga.message;
    }
  }

  return resultado;
}

function purgarCalendariosArchivados_() {
  const limite = sumarDias_(new Date(), -DIAS_ARCHIVADO_CALENDARIO);
  const calendarios = obtenerCalendarios_();

  const vigentes = calendarios.filter(function(c) {
    return new Date(c.hasta) >= limite;
  });

  const purgados = calendarios.length - vigentes.length;

  if (purgados > 0) {
    guardarCalendarios_(vigentes);

    const idsVigentes = vigentes.map(function(c) { return c.id; });
    const enlaces = obtenerEnlaces_().filter(function(enlace) {
      return !enlace.calendarId || idsVigentes.indexOf(enlace.calendarId) >= 0;
    });
    guardarEnlaces_(enlaces);
  }

  return purgados;
}

function limpiarEnlacesExpirados() {
  const limite = sumarDias_(new Date(), -DIAS_PURGA_ENLACES);
  const enlaces = obtenerEnlaces_();

  const restantes = enlaces.filter(function(enlace) {
    return new Date(enlace.expiresAt) >= limite;
  });

  const eliminados = enlaces.length - restantes.length;
  if (eliminados > 0) guardarEnlaces_(restantes);

  return { ok: true, eliminados: eliminados };
}

/* =========================
   FIX-04: RESPALDOS (EXPORTACIÓN)
   ========================= */

function exportDataToGoogleSheet_() {
  const nombreArchivo = 'MPV_Respaldo_' + CONFIG.NOMBRE_NEGOCIO;
  const archivosExistentes = DriveApp.getFilesByName(nombreArchivo);
  let hojaCalculo;

  if (archivosExistentes.hasNext()) {
    hojaCalculo = SpreadsheetApp.open(archivosExistentes.next());
  } else {
    hojaCalculo = SpreadsheetApp.create(nombreArchivo);
  }

  escribirRespaldoHoja_(hojaCalculo, 'Empleados', obtenerEmpleados_());
  escribirRespaldoHoja_(hojaCalculo, 'Calendarios', obtenerCalendarios_());
  escribirRespaldoHoja_(hojaCalculo, 'Enlaces', obtenerEnlaces_());
  escribirRespaldoHoja_(hojaCalculo, 'Compensos', obtenerJson_(CONFIG.COMPENSOS, []));
  escribirRespaldoHoja_(hojaCalculo, 'Plantillas', obtenerPlantillas_());

  const hojaResumen = hojaCalculo.getSheetByName('Resumen') || hojaCalculo.insertSheet('Resumen', 0);
  hojaResumen.clear();
  hojaResumen.getRange(1, 1, 2, 2).setValues([
    ['Último respaldo', new Date().toISOString()],
    ['Origen', 'Automático (cuota) o manual']
  ]);

  return { ok: true, url: hojaCalculo.getUrl() };
}

// FIX-07: Google Sheets rechaza cualquier valor de celda que supere los 50.000 caracteres.
// El JSON completo de calendarios/enlaces puede superar ese límite fácilmente, así que
// el contenido se trocea en fragmentos seguros y cada fragmento se escribe en su propia fila.
// Para reconstruir el JSON original basta con concatenar el contenido de todas las filas
// de datos de la hoja (a partir de la fila 2) en orden.
const LIMITE_CARACTERES_CELDA_ = 45000; // margen de seguridad bajo el límite real de 50.000

function escribirRespaldoHoja_(hojaCalculo, nombreHoja, datos) {
  let hoja = hojaCalculo.getSheetByName(nombreHoja);
  if (!hoja) hoja = hojaCalculo.insertSheet(nombreHoja);
  hoja.clear();
  hoja.getRange(1, 1).setValue(nombreHoja + ' — respaldo ' + new Date().toISOString());

  const contenido = JSON.stringify(datos);
  const partes = [];

  for (let i = 0; i < contenido.length; i += LIMITE_CARACTERES_CELDA_) {
    partes.push(contenido.slice(i, i + LIMITE_CARACTERES_CELDA_));
  }

  if (!partes.length) partes.push('');

  const filas = partes.map(function(parte) { return [parte]; });
  hoja.getRange(2, 1, filas.length, 1).setValues(filas);
}

function exportarSistemaCompleto(tokenSesion) {
  verificarSesion_(tokenSesion);
  const resultado = exportDataToGoogleSheet_();
  return {
    ok: true,
    url: resultado.url,
    mensaje: 'Respaldo manual generado correctamente.'
  };
}

/* =========================
   F3: PLANTILLAS CRUD (MPV_PLANTILLAS)
   ========================= */

function obtenerPlantillas_() {
  return obtenerJson_(CONFIG.PLANTILLAS, []);
}

function guardarPlantillas_(plantillas) {
  guardarJson_(CONFIG.PLANTILLAS, plantillas);
}

function listarPlantillas(tokenSesion) {
  verificarSesion_(tokenSesion);
  inicializarSistema();
  return obtenerPlantillas_();
}

function guardarPlantilla(tokenSesion, datos) {
  verificarSesion_(tokenSesion);
  inicializarSistema();

  if (!datos || !String(datos.nombre || '').trim()) {
    throw new Error('El nombre de la plantilla es obligatorio.');
  }

  const plantillas = obtenerPlantillas_();
  const id = String(datos.id || generarId_());
  const indice = plantillas.findIndex(function(p) { return p.id === id; });

  const plantilla = {
    id: id,
    nombre: String(datos.nombre).trim(),
    turnos: datos.turnos || TURNOS_BASE,
    necesidades: datos.necesidades || NECESIDADES_BASE,
    horariosRoles: datos.horariosRoles || null,
    turnosActivosPorDia: normalizarTurnosActivosPorDia_(datos.turnosActivosPorDia),
    createdAt: datos.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (indice >= 0) {
    plantillas[indice] = plantilla;
  } else {
    plantillas.push(plantilla);
  }

  guardarPlantillas_(plantillas);
  return { ok: true, plantilla: plantilla };
}

function eliminarPlantilla(tokenSesion, id) {
  verificarSesion_(tokenSesion);
  const plantillas = obtenerPlantillas_();
  const restantes = plantillas.filter(function(p) { return p.id !== String(id); });

  if (restantes.length === plantillas.length) {
    throw new Error('Plantilla no encontrada.');
  }

  guardarPlantillas_(restantes);
  return { ok: true };
}

/* =========================
   EMPLEADOS
   ========================= */

function normalizeEmpleadoDepts_(emp) {
  if (!emp) return emp;
  const ROLES_VALIDOS = ['SALA', 'COCINA', 'PIZZERIA'];
  let depts = [];

  if (Array.isArray(emp.depts) && emp.depts.length > 0) {
    depts = emp.depts.filter(function(r) { return ROLES_VALIDOS.indexOf(r) >= 0; });
  } else if (emp.dept && typeof emp.dept === 'string') {
    if (ROLES_VALIDOS.indexOf(emp.dept) >= 0) {
      depts = [emp.dept];
    }
  }

  if (!depts.length) {
    depts = ['SALA'];
  }

  emp.depts = depts;
  emp.dept = depts[0]; // Retrocompatibilità per codice o viste legacy
  emp.saldoHorasAnterior = redondear(Number(emp.saldoHorasAnterior || 0));
  return emp;
}

function obtenerEmpleados_() {
  const empleados = obtenerJson_(CONFIG.EMPLEADOS, []);
  return empleados.map(normalizeEmpleadoDepts_);
}

function guardarEmpleados_(empleados) {
  guardarJson_(CONFIG.EMPLEADOS, empleados);
}

function listarEmpleados() {
  inicializarSistema();
  return obtenerEmpleados_();
}

function guardarEmpleado(tokenSesion, datos) {
  verificarSesion_(tokenSesion);
  inicializarSistema();

  if (!datos || !String(datos.name || '').trim()) {
    throw new Error('El nombre y apellidos son obligatorios.');
  }

  if (!String(datos.phone || '').trim()) {
    throw new Error('El teléfono es obligatorio.');
  }

  const empleados = obtenerEmpleados_();
  const id = String(datos.id || generarId_());
  const indice = empleados.findIndex(function(e) { return e.id === id; });

  const maxExtra = (datos.maxHorasExtraSemana !== null && datos.maxHorasExtraSemana !== undefined && datos.maxHorasExtraSemana !== '' && !isNaN(Number(datos.maxHorasExtraSemana)))
    ? Math.max(0, Number(datos.maxHorasExtraSemana))
    : null;

  const ROLES_VALIDOS = ['SALA', 'COCINA', 'PIZZERIA'];
  let depts = [];
  if (Array.isArray(datos.depts) && datos.depts.length > 0) {
    depts = datos.depts.filter(function(r) { return ROLES_VALIDOS.indexOf(r) >= 0; });
  } else if (datos.dept) {
    if (ROLES_VALIDOS.indexOf(datos.dept) >= 0) depts = [datos.dept];
  }
  if (!depts.length) depts = ['SALA'];

  const empleado = {
    id: id,
    name: String(datos.name).trim(),
    phone: String(datos.phone).trim(),
    email: String(datos.email || '').trim(),
    dept: depts[0],
    depts: depts,
    hours: Math.max(0, Number(datos.hours) || 40),
    maxHorasExtraSemana: maxExtra,
    saldoHorasAnterior: redondear(Number(datos.saldoHorasAnterior || 0)),
    active: datos.active !== false,
    prefShift: Array.isArray(datos.prefShift) && datos.prefShift.length ? datos.prefShift : ['Cualquiera'],
    exclShift: Array.isArray(datos.exclShift) ? datos.exclShift : [],
    exclDay: Array.isArray(datos.exclDay) ? datos.exclDay : [],
    exclDayShift: Array.isArray(datos.exclDayShift) ? datos.exclDayShift : []
  };

  const conflictoTurnos = empleado.prefShift.filter(function(turno) {
    return turno !== 'Cualquiera' && empleado.exclShift.indexOf(turno) >= 0;
  });

  if (conflictoTurnos.length) {
    throw new Error(
      'El turno "' + conflictoTurnos.join(', ') + '" no puede estar a la vez en preferencias y en exclusiones.'
    );
  }

  if (indice >= 0) {
    empleados[indice] = empleado;
  } else {
    empleados.push(empleado);
  }

  guardarEmpleados_(empleados);
  return { ok: true, empleado: empleado };
}

function cambiarEstadoEmpleado(tokenSesion, id, activo) {
  verificarSesion_(tokenSesion);
  const empleados = obtenerEmpleados_();
  const empleado = empleados.find(function(e) { return e.id === String(id); });

  if (!empleado) throw new Error('Empleado no encontrado.');

  empleado.active = Boolean(activo);
  guardarEmpleados_(empleados);

  return { ok: true };
}

/* =========================
   F14: AJUSTE MANUAL SALDO DE HORAS EMPLEADO
   ========================= */

function guardarSaldoEmpleado(tokenSesion, employeeId, nuevoSaldo) {
  verificarSesion_(tokenSesion);
  const empleados = obtenerEmpleados_();
  const emp = empleados.find(function(e) { return e.id === String(employeeId); });
  if (!emp) throw new Error('Empleado no encontrado.');

  emp.saldoHorasAnterior = redondear(Number(nuevoSaldo || 0));
  guardarEmpleados_(empleados);
  return { ok: true, saldoHorasAnterior: emp.saldoHorasAnterior };
}

function eliminarEmpleado(tokenSesion, id) {
  verificarSesion_(tokenSesion);
  const empleados = obtenerEmpleados_();
  const restantes = empleados.filter(function(e) { return e.id !== String(id); });

  if (restantes.length === empleados.length) {
    throw new Error('Empleado no encontrado.');
  }

  guardarEmpleados_(restantes);
  return { ok: true };
}

/* =========================
   CALENDARIOS
   ========================= */

function obtenerCalendarios_() {
  return obtenerJson_(CONFIG.CALENDARIOS, []);
}

function guardarCalendarios_(calendarios) {
  guardarJson_(CONFIG.CALENDARIOS, calendarios);
}

function listarCalendarios() {
  inicializarSistema();
  return obtenerCalendarios_().sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function obtenerCalendario(id) {
  const calendario = obtenerCalendarios_().find(function(c) {
    return c.id === String(id);
  });

  if (!calendario) throw new Error('Calendario no encontrado.');
  return calendario;
}

function validarRangoLunesDomingo_(desde, hasta) {
  const fechaInicio = new Date(desde + 'T12:00:00');
  const fechaFin = new Date(hasta + 'T12:00:00');

  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    throw new Error('Las fechas indicadas no son válidas.');
  }

  if (fechaInicio > fechaFin) {
    throw new Error('La fecha de inicio no puede ser posterior a la fecha final.');
  }

  const diaInicio = fechaInicio.getDay();
  const diaFin = fechaFin.getDay();

  if (diaInicio !== 1 || diaFin !== 0) {
    throw new Error('El periodo debe comenzar en lunes y finalizar en domingo.');
  }
}

function obtenerFechasPeriodo_(desde, hasta) {
  const fechas = [];
  let actual = new Date(desde + 'T12:00:00');
  const final = new Date(hasta + 'T12:00:00');

  while (actual <= final) {
    fechas.push(fechaISO_(actual));
    actual = sumarDias_(actual, 1);
  }

  return fechas;
}

function horasEntre_(inicio, fin) {
  if (!inicio || !fin) return 0;

  const a = String(inicio).split(':');
  const b = String(fin).split(':');

  let minutosA = Number(a[0]) * 60 + Number(a[1]);
  let minutosB = Number(b[0]) * 60 + Number(b[1]);

  if (minutosB < minutosA) minutosB += 24 * 60;
  return redondear_((minutosB - minutosA) / 60);
}

function turnoEsCompatible_(empleado, nombreDia, nombreTurno) {
  if (empleado.exclDay && empleado.exclDay.indexOf(nombreDia) >= 0) return false;
  if (empleado.exclShift && empleado.exclShift.indexOf(nombreTurno) >= 0) return false;
  if (empleado.exclDayShift && Array.isArray(empleado.exclDayShift)) {
    const claveA = nombreDia + '_' + nombreTurno;
    const claveB = nombreDia + ' - ' + nombreTurno;
    if (empleado.exclDayShift.indexOf(claveA) >= 0 || empleado.exclDayShift.indexOf(claveB) >= 0) return false;
  }
  return true;
}

function prioridadEmpleado_(empleado, nombreTurno, horasAsignadas) {
  let puntuacion = 0;

  if (empleado.prefShift && empleado.prefShift.indexOf('Cualquiera') >= 0) puntuacion += 5;
  if (empleado.prefShift && empleado.prefShift.indexOf(nombreTurno) >= 0) puntuacion += 20;

  puntuacion -= (horasAsignadas[empleado.id] || 0) * 0.7;
  return puntuacion;
}

/* =========================
   F1: TURNOS ACTIVOS PERSONALIZABLES POR DÍA DE LA SEMANA
   ========================= */

// Completa cualquier configuración parcial recibida del cliente con los 7 días
// de la semana y las 3 franjas base, tratando cualquier valor no explícitamente
// "false" como activo. Así, un calendario antiguo sin esta propiedad (o un cliente
// que no la envíe) sigue comportándose exactamente igual que antes: todo activo.
function normalizarTurnosActivosPorDia_(config) {
  const resultado = {};
  const origen = (config && typeof config === 'object') ? config : {};

  DIAS.forEach(function(dia) {
    const configDia = (origen[dia] && typeof origen[dia] === 'object') ? origen[dia] : {};
    resultado[dia] = {
      manana: configDia.manana !== false,
      tarde: configDia.tarde !== false,
      cena: configDia.cena !== false
    };
  });

  return resultado;
}

// Indica si una franja (mañana/tarde/cena) debe generarse para un día concreto
// de la semana. Cualquier clave de turno personalizada fuera de esas tres se
// considera siempre activa, ya que F1 solo cubre las franjas base del negocio.
function franjaActivaEnDia_(turnosActivosPorDia, nombreDia, claveTurno) {
  if (!turnosActivosPorDia) return true;

  const configDia = turnosActivosPorDia[nombreDia];
  if (!configDia) return true;

  if (claveTurno === 'manana' || claveTurno === 'tarde' || claveTurno === 'cena') {
    return configDia[claveTurno] !== false;
  }

  return true;
}

/* =========================
   F11: ALGORITMO DE COMPENSACIÓN AUTOMÁTICA DE HORAS
   ========================= */
function optimizarCompensacionHoras_(asignaciones, empleados, fechas, festivos) {
  const semanas = Math.max(1, fechas.length / 7);
  const numFestivos = Array.isArray(festivos) ? festivos.length : 0;
  const datosEmps = {};

  function recalcularTotales() {
    empleados.forEach(function(e) {
      const horasSemanales = Number(e.hours) || 0;
      const cBase = horasSemanales * semanas;
      // Deducir festivos: (horas/sem ÷ 7) × numFestivos
      const diasBase = Number((obtenerJson_(CONFIG.AJUSTES, {}).diasLaborablesSemana) || 6);
      const dedFestivos = (horasSemanales / diasBase) * numFestivos;
      const cEfectivo = Math.max(0, cBase - dedFestivos);
      const saldoAnt = Number(e.saldoHorasAnterior || 0);
      const cMeta = Math.max(1, cEfectivo - saldoAnt);
      datosEmps[e.id] = {
        emp: e,
        contrato: redondear_(cMeta),
        contratoBase: redondear_(cBase),
        deduccionFestivos: redondear_(dedFestivos),
        asignadas: 0,
        horasSemanales: {}
      };
    });

    asignaciones.forEach(function(a) {
      if (datosEmps[a.employeeId]) {
        const h = Number(a.hours) || 0;
        datosEmps[a.employeeId].asignadas += h;
        const indexDia = fechas.indexOf(a.date);
        if (indexDia >= 0) {
          const numSemana = Math.floor(indexDia / 7);
          datosEmps[a.employeeId].horasSemanales[numSemana] = (datosEmps[a.employeeId].horasSemanales[numSemana] || 0) + h;
        }
      }
    });

    empleados.forEach(function(e) {
      const d = datosEmps[e.id];
      d.desviacion = redondear_(d.asignadas - d.contrato);
    });
  }

  recalcularTotales();

  let reasignacionesHechas = 0;
  let maxIteraciones = 50;

  while (maxIteraciones > 0) {
    maxIteraciones--;
    recalcularTotales();

    // 1. Encontrar donante con mayor exceso de horas
    let donante = null;
    let maxExceso = 0.5;
    empleados.forEach(function(e) {
      const des = datosEmps[e.id].desviacion;
      if (des > maxExceso) {
        maxExceso = des;
        donante = datosEmps[e.id];
      }
    });

    if (!donante) break;

    // 2. Encontrar receptor con mayor déficit de horas
    let receptor = null;
    let maxDeficit = -0.5;
    empleados.forEach(function(e) {
      const des = datosEmps[e.id].desviacion;
      if (des < maxDeficit) {
        maxDeficit = des;
        receptor = datosEmps[e.id];
      }
    });

    if (!receptor) break;

    // 3. Intentar transferir una asignación del donante al receptor
    let asignacionTransferida = false;
    const turnosDonante = asignaciones.filter(function(a) { return a.employeeId === donante.emp.id; });

    for (let i = 0; i < turnosDonante.length; i++) {
      const a = turnosDonante[i];
      const hTurno = Number(a.hours) || 0;
      const indexDia = fechas.indexOf(a.date);
      const numSemana = indexDia >= 0 ? Math.floor(indexDia / 7) : 0;
      const nombreDia = a.dayName || DIAS[indexDia % 7];

      // Verificación de compatibilidad del rol
      const tieneRol = Array.isArray(receptor.emp.depts)
        ? receptor.emp.depts.indexOf(a.role) >= 0
        : receptor.emp.dept === a.role;

      if (!tieneRol) continue;

      // Verificación de no duplicación de turno en la misma franja
      const yaAsignadoEnTurno = asignaciones.some(function(other) {
        return other.employeeId === receptor.emp.id && other.date === a.date && other.shiftKey === a.shiftKey;
      });

      if (yaAsignadoEnTurno) continue;

      // Verificación de exclusiones/preferencias
      if (!turnoEsCompatible_(receptor.emp, nombreDia, a.shiftName)) continue;

      // Verificación de límite máximo de horas extra semanales del receptor
      if (receptor.emp.maxHorasExtraSemana !== null && receptor.emp.maxHorasExtraSemana !== undefined && !isNaN(Number(receptor.emp.maxHorasExtraSemana))) {
        const cBaseSem = Number(receptor.emp.hours || 0);
        const cEfecSem = Math.max(0, cBaseSem - (Number(receptor.emp.saldoHorasAnterior || 0) / semanas));
        const maxPermitidoSem = cEfecSem + Number(receptor.emp.maxHorasExtraSemana);
        const horasActualesSem = receptor.horasSemanales[numSemana] || 0;
        if (horasActualesSem + hTurno > maxPermitidoSem + 0.01) continue;
      }

      // Verificación de mejora en la equidad global
      const absAntes = Math.abs(donante.desviacion) + Math.abs(receptor.desviacion);
      const absDespues = Math.abs(donante.desviacion - hTurno) + Math.abs(receptor.desviacion + hTurno);

      if (absDespues < absAntes) {
        a.employeeId = receptor.emp.id;
        a.compensadoAuto = true;
        reasignacionesHechas++;
        asignacionTransferida = true;
        break;
      }
    }

    if (!asignacionTransferida) break;
  }

  // FIX-BUG1 (post-optimización): eliminar duplicados residuales por empleado+fecha+shiftKey
  // que pudieran haberse generado por edge-cases del algoritmo de compensación
  const asignacionesVistas = {};
  for (let idx = asignaciones.length - 1; idx >= 0; idx--) {
    const a = asignaciones[idx];
    const clave = a.employeeId + '|' + a.date + '|' + (a.shiftKey || a.shiftName || '');
    if (asignacionesVistas[clave]) {
      asignaciones.splice(idx, 1); // eliminar duplicado
    } else {
      asignacionesVistas[clave] = true;
    }
  }

  return reasignacionesHechas;
}

/* =========================
   FIX-BUG2 + FIXES 3&4: Normalización de horariosRoles y soporte de excepciones
   ========================= */

// Obtiene los horarios de roles efectivos para una franja, fecha y día de semana,
// aplicando las excepciones configuradas (por día de semana o fecha específica).
function resolverHorariosEfectivos_(horariosRolesBase, necesidadesBase, claveTurno, fecha, nombreDia, excepciones) {
  if (!Array.isArray(excepciones) || !excepciones.length) {
    return {
      horarios: (horariosRolesBase && horariosRolesBase[claveTurno]) || {},
      necesidades: (necesidadesBase && necesidadesBase[claveTurno]) || {}
    };
  }

  let excepcionAplicable = null;

  // Prioridad 1: fecha específica exacta
  for (let i = 0; i < excepciones.length; i++) {
    const ex = excepciones[i];
    if (ex.turno !== claveTurno) continue;
    if (ex.tipo === 'fecha' && ex.valor === fecha) {
      excepcionAplicable = ex;
      break;
    }
  }

  // Prioridad 2: día de semana
  if (!excepcionAplicable) {
    for (let i = 0; i < excepciones.length; i++) {
      const ex = excepciones[i];
      if (ex.turno !== claveTurno) continue;
      if (ex.tipo === 'diasemana' && ex.valor === nombreDia) {
        excepcionAplicable = ex;
        break;
      }
    }
  }

  if (!excepcionAplicable) {
    return {
      horarios: (horariosRolesBase && horariosRolesBase[claveTurno]) || {},
      necesidades: (necesidadesBase && necesidadesBase[claveTurno]) || {}
    };
  }

  // Fusionar la excepción con la configuración base
  const horariosBase = (horariosRolesBase && horariosRolesBase[claveTurno]) || {};
  const necesBase = (necesidadesBase && necesidadesBase[claveTurno]) || {};

  const horariosEfectivos = Object.assign({}, horariosBase);
  if (excepcionAplicable.horarios) {
    Object.keys(excepcionAplicable.horarios).forEach(function(rol) {
      if (excepcionAplicable.horarios[rol]) {
        horariosEfectivos[rol] = Object.assign({}, horariosBase[rol] || {}, excepcionAplicable.horarios[rol]);
      }
    });
  }

  const necesEfectivas = Object.assign({}, necesBase);
  if (excepcionAplicable.necesidades) {
    Object.keys(excepcionAplicable.necesidades).forEach(function(rol) {
      if (excepcionAplicable.necesidades[rol] !== undefined && excepcionAplicable.necesidades[rol] !== null) {
        necesEfectivas[rol] = Number(excepcionAplicable.necesidades[rol]);
      }
    });
  }

  return { horarios: horariosEfectivos, necesidades: necesEfectivas };
}

function generarCalendario(tokenSesion, datos) {
  verificarSesion_(tokenSesion);
  inicializarSistema();

  if (!datos) throw new Error('No se han recibido datos de calendario.');

  const desde = String(datos.desde || '');
  const hasta = String(datos.hasta || '');
  validarRangoLunesDomingo_(desde, hasta);

  const empleados = obtenerEmpleados_().filter(function(e) { return e.active; });
  if (!empleados.length) throw new Error('No hay empleados activos disponibles.');

  const turnos = datos.turnos || TURNOS_BASE;
  const necesidades = datos.necesidades || NECESIDADES_BASE;
  const cierres = Array.isArray(datos.cierres) ? datos.cierres : [];
  const festivos = Array.isArray(datos.festivos) ? datos.festivos : [];
  const numFestivos = festivos.length;
  // Excepciones por día de semana o fecha específica (Fixes 3 & 4)
  const excepciones = Array.isArray(datos.excepciones) ? datos.excepciones : [];
  // F1: configuración de franjas activas/inactivas por día de la semana, ya normalizada.
  const turnosActivosPorDia = normalizarTurnosActivosPorDia_(datos.turnosActivosPorDia);
  const fechas = obtenerFechasPeriodo_(desde, hasta);
  const asignaciones = [];
  const incidencias = [];
  const horasAsignadas = {};
  // F2: tracciamento delle ore per settimana di ciascun dipendente
  const horasSemanales = {};
  const numSemanasPeriodo = Math.ceil(fechas.length / 7);

  empleados.forEach(function(e) {
    horasAsignadas[e.id] = 0;
    horasSemanales[e.id] = [];
    for (let s = 0; s < numSemanasPeriodo; s++) {
      horasSemanales[e.id][s] = 0;
    }
  });

  fechas.forEach(function(fecha, indiceDia) {
    if (cierres.indexOf(fecha) >= 0) return;

    const nombreDia = DIAS[indiceDia % 7];
    const numSemana = Math.floor(indiceDia / 7);

    Object.keys(turnos).forEach(function(claveTurno) {
      const turno = turnos[claveTurno];
      if (!turno || !turno.inicio || !turno.fin) return;

      // F1: si la franja está desactivada para este día de la semana concreto,
      // se omite por completo (sin generar asignaciones ni incidencias de
      // "turno sin cubrir", ya que la ausencia es intencionada y no un fallo).
      if (!franjaActivaEnDia_(turnosActivosPorDia, nombreDia, claveTurno)) return;

      const nombreTurno = turno.nombre || claveTurno;
      // FIX-BUG2 + FIXES3&4: Resolver horarios y necesidades efectivos aplicando excepciones
      const efectivos = resolverHorariosEfectivos_(datos.horariosRoles, necesidades, claveTurno, fecha, nombreDia, excepciones);
      const necesidadTurno = efectivos.necesidades;
      const horariosRolesFranja = efectivos.horarios;

      ['COCINA', 'PIZZERIA', 'SALA'].forEach(function(rol) {
        const cantidadNecesaria = Number(necesidadTurno[rol] || 0);
        if (!cantidadNecesaria) return;

        // FIX-BUG2: Usar horario específico del rol (garantizado por resolverHorariosEfectivos_)
        const rolTiempos = horariosRolesFranja[rol] || {};
        const inicioRol = rolTiempos.inicio || turno.inicio;
        const finRol    = rolTiempos.fin    || turno.fin;
        const horasTurno = horasEntre_(inicioRol, finRol);

        const candidatos = empleados
          .filter(function(e) {
            // F8: Un empleado con múltiples roles no puede ser asignado dos veces en el mismo turno/franja
            const yaAsignadoEnTurno = asignaciones.some(function(a) {
              return a.employeeId === e.id && a.date === fecha && a.shiftKey === claveTurno;
            });

            const tieneRol = Array.isArray(e.depts) ? e.depts.indexOf(rol) >= 0 : e.dept === rol;

            if (!tieneRol || yaAsignadoEnTurno || !turnoEsCompatible_(e, nombreDia, nombreTurno)) {
              return false;
            }

            // F2: Límite máximo de horas extra semanales y del período por empleado con deducción de festivos
            const contratoSemanaBase = Number(e.hours || 0);
            const diasBaseGenerar = Number((obtenerJson_(CONFIG.AJUSTES, {}).diasLaborablesSemana) || 6);
            const dedFestivosPeriodo = (contratoSemanaBase / diasBaseGenerar) * numFestivos;
            const contratoPeriodoConFestivos = Math.max(0, (contratoSemanaBase * numSemanasPeriodo) - dedFestivosPeriodo);
            const saldoAnt = Number(e.saldoHorasAnterior || 0);
            const contratoPeriodoEfectivo = Math.max(0, contratoPeriodoConFestivos - saldoAnt);
            const contratoSemanaEfectivo = numSemanasPeriodo > 0 ? (contratoPeriodoEfectivo / numSemanasPeriodo) : contratoSemanaBase;

            if (e.maxHorasExtraSemana !== null && e.maxHorasExtraSemana !== undefined && !isNaN(Number(e.maxHorasExtraSemana))) {
              const maxExtraSemana = Number(e.maxHorasExtraSemana);
              const maxPermitidoSemana = contratoSemanaEfectivo + maxExtraSemana;
              const horasYaAsignadasSemana = (horasSemanales[e.id] && horasSemanales[e.id][numSemana]) || 0;
              if (horasYaAsignadasSemana + horasTurno > maxPermitidoSemana + 0.01) {
                return false; // Superaría el límite de horas extra semanales permitido
              }

              const maxPermitidoPeriodo = contratoPeriodoEfectivo + (maxExtraSemana * numSemanasPeriodo);
              const horasYaAsignadasPeriodo = horasAsignadas[e.id] || 0;
              if (horasYaAsignadasPeriodo + horasTurno > maxPermitidoPeriodo + 0.01) {
                return false; // Superaría el límite máximo acumulado del período
              }
            }

            return true;
          })
          .sort(function(a, b) {
            const numSems = Math.max(1, numSemanasPeriodo);
            const horasSemA = Number(a.hours || 0);
            const horasSemB = Number(b.hours || 0);
            const cBaseA = horasSemA * numSems;
            const cBaseB = horasSemB * numSems;
            const dedA = (horasSemA / 7) * numFestivos;
            const dedB = (horasSemB / 7) * numFestivos;
            const cEfecA = Math.max(1, (cBaseA - dedA) - Number(a.saldoHorasAnterior || 0));
            const cEfecB = Math.max(1, (cBaseB - dedB) - Number(b.saldoHorasAnterior || 0));

            const hA = horasAsignadas[a.id] || 0;
            const hB = horasAsignadas[b.id] || 0;

            const bajoContratoA = hA < cEfecA;
            const bajoContratoB = hB < cEfecB;

            // 1. Un empleado por debajo del contrato tiene prioridad ABSOLUTA sobre quien ya cubrió o superó su contrato
            if (bajoContratoA !== bajoContratoB) {
              return bajoContratoA ? -1 : 1;
            }

            // 2. Ordenar por menor ratio del contrato cubierto
            const ratioA = hA / cEfecA;
            const ratioB = hB / cEfecB;

            if (Math.abs(ratioA - ratioB) > 0.001) {
              return ratioA - ratioB;
            }

            // 3. Priorizar por menor total de horas absolutas asignadas
            if (hA !== hB) {
              return hA - hB;
            }

            // 4. Desempate por preferencias del turno
            return prioridadEmpleado_(b, nombreTurno, horasAsignadas) -
              prioridadEmpleado_(a, nombreTurno, horasAsignadas);
          });

        let faltantes = 0;

        for (let i = 0; i < cantidadNecesaria; i++) {
          const empleado = candidatos[i];

          if (!empleado) {
            faltantes++;
            continue;
          }

          asignaciones.push({
            id: generarId_(),
            employeeId: empleado.id,
            date: fecha,
            dayName: nombreDia,
            shiftKey: claveTurno,
            shiftName: nombreTurno,
            start: inicioRol,
            end: finRol,
            breakMinutes: 0,
            hours: horasTurno,
            role: rol
          });

          horasAsignadas[empleado.id] += horasTurno;
          if (horasSemanales[empleado.id]) {
            horasSemanales[empleado.id][numSemana] = (horasSemanales[empleado.id][numSemana] || 0) + horasTurno;
          }
        }

        if (faltantes > 0) {
          incidencias.push(
            'Turno sin cubrir: ' + fecha + ' · ' + nombreTurno + ' · ' + rol +
            ' (faltan ' + faltantes + (faltantes === 1 ? ' persona' : ' personas') + ')'
          );
        }
      });
    });
  });

  // F11: Optimización automática del equilibrio de horas entre empleados
  const turnosOptimizados = optimizarCompensacionHoras_(asignaciones, empleados, fechas, festivos);
  if (turnosOptimizados > 0) {
    incidencias.push(
      '⚡ Compensación automática: ' + turnosOptimizados +
      ' turno(s) reasignados automáticamente para equilibrar las horas.'
    );
  }

  // Recalcular horas totales tras optimización para incidencias
  empleados.forEach(function(e) { horasAsignadas[e.id] = 0; });
  asignaciones.forEach(function(a) {
    if (horasAsignadas[a.employeeId] !== undefined) {
      horasAsignadas[a.employeeId] += Number(a.hours) || 0;
    }
  });

  const semanas = Math.max(1, fechas.length / 7);

  empleados.forEach(function(empleado) {
    const horasSem = Number(empleado.hours || 0);
    const contratoBase = horasSem * semanas;
    const diasBasePeriodo = Number((obtenerJson_(CONFIG.AJUSTES, {}).diasLaborablesSemana) || 6);
    const dedFestivos = (horasSem / diasBasePeriodo) * numFestivos;
    const contratoPeriodo = redondear(Math.max(0, contratoBase - dedFestivos));
    const trabajadas = redondear(horasAsignadas[empleado.id] || 0);
    const diferencia = redondear(trabajadas - contratoPeriodo);

    if (diferencia > 8) {
      incidencias.push(
        empleado.name + ': exceso severo de ' + diferencia + ' horas respecto al contrato del período.'
      );
    }

    if (diferencia < -12) {
      incidencias.push(
        empleado.name + ': defecto severo de ' + Math.abs(diferencia) +
        ' horas respecto al contrato del período.'
      );
    }
  });

  const calendario = {
    id: generarId_(),
    nombre: String(datos.nombre || ('Calendario ' + fechaLegible_(desde) + ' - ' + fechaLegible_(hasta))),
    desde: desde,
    hasta: hasta,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turnos: turnos,
    necesidades: necesidades,
    horariosRoles: datos.horariosRoles || null,
    excepciones: excepciones,
    cierres: cierres,
    festivos: festivos,
    turnosActivosPorDia: turnosActivosPorDia,
    asignaciones: asignaciones,
    incidencias: incidencias,
    linksGenerados: false,
    enlacesIds: []
  };

  const calendarios = obtenerCalendarios_();
  calendarios.push(calendario);
  guardarCalendarios_(calendarios);

  // FIX-08: la comprobación/limpieza de almacenamiento es mantenimiento en segundo plano.
  // Un fallo aquí (por ejemplo, al generar el respaldo automático en Sheets) no debe
  // impedir nunca que el calendario recién creado se devuelva correctamente al cliente.
  try {
    checkStorageCapacity_();
  } catch (errorAlmacenamiento) {
    console.error('Aviso de almacenamiento no crítico: ' + errorAlmacenamiento.message);
  }

  return calendario;
}

function guardarCalendarioEditado(tokenSesion, calendario) {
  verificarSesion_(tokenSesion);
  if (!calendario || !calendario.id) throw new Error('Calendario no válido.');

  const calendarios = obtenerCalendarios_();
  const indice = calendarios.findIndex(function(c) { return c.id === calendario.id; });

  if (indice < 0) throw new Error('Calendario no encontrado.');

  calendario.updatedAt = new Date().toISOString();
  calendarios[indice] = calendario;
  guardarCalendarios_(calendarios);

  return { ok: true, calendario: calendario };
}

function eliminarCalendario(tokenSesion, id) {
  verificarSesion_(tokenSesion);
  const calendarios = obtenerCalendarios_();
  const resultado = calendarios.filter(function(c) { return c.id !== String(id); });

  if (resultado.length === calendarios.length) throw new Error('Calendario no encontrado.');

  guardarCalendarios_(resultado);

  const enlaces = obtenerEnlaces_().filter(function(enlace) {
    return enlace.calendarId !== String(id);
  });
  guardarEnlaces_(enlaces);

  return { ok: true };
}

/* ==========================================================================
   ALGORITMO MATEMATICO ORE SETTIMANALI HOSTELERIA (LUNEDÌ - DOMENICA)
   Passi 1-5: Rideterminazione H_Nomina, Disaccoppiamento Festivi e Compensi
   ========================================================================== */

function agruparFechasEnSemanasLunesDomingo_(fechas) {
  const semanas = [];
  let semanaActual = null;

  fechas.forEach(function(fechaStr) {
    const d = new Date(fechaStr + 'T12:00:00');
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Lunes, 1=Martes, ..., 6=Domingo

    if (!semanaActual || dayOfWeek === 0) {
      semanaActual = {
        numero: semanas.length + 1,
        fechaInicio: fechaStr,
        fechaFin: fechaStr,
        fechas: []
      };
      semanas.push(semanaActual);
    }
    semanaActual.fechas.push(fechaStr);
    semanaActual.fechaFin = fechaStr;
  });

  return semanas;
}

function calcularSemanaHosteleria(parametri) {
  const Contratto_Ore_Settimana = Number(parametri.contrattoOreSettimana || 0);
  const Giorni_Lavorativi_Base = Number(parametri.giorniLavorativiBase || 6);
  const Tariffa_Ora_Extra_Normale = Number(parametri.tariffaOraExtraNormale !== undefined ? parametri.tariffaOraExtraNormale : 8.50);
  const Tariffa_Ora_Festiva = Number(parametri.tariffaOraFestiva !== undefined ? parametri.tariffaOraFestiva : 11.60);

  // Passo 1: Determinare la Giornata Ordinaria Teorica
  const Ore_Giornaliere_Base = redondear(Contratto_Ore_Settimana / Giorni_Lavorativi_Base);

  // Passo 2: Gestione dei Giorni Festivi Infrasettimanali e Rideterminazione dell'Obiettivo (Ore Nomina)
  const giorni = Array.isArray(parametri.giorni) ? parametri.giorni : [];
  let Giorni_Festivi_Conteggiati = 0;
  let Totale_Ore_Lavorate = 0;
  let Ore_Festive_Lavorate = 0;

  giorni.forEach(function(g) {
    const isFestivo = Boolean(g.isFestivo || g.is_festivo || g.festivo);
    const ore = Number(g.oreLavorate !== undefined ? g.oreLavorate : (g.hours || 0));
    if (isFestivo) {
      Giorni_Festivi_Conteggiati++;
      Ore_Festive_Lavorate += ore;
    }
    Totale_Ore_Lavorate += ore;
  });

  Totale_Ore_Lavorate = redondear(Totale_Ore_Lavorate);
  Ore_Festive_Lavorate = redondear(Ore_Festive_Lavorate);

  const Ore_Dovute_Settimana = redondear(Math.max(0, Contratto_Ore_Settimana - (Giorni_Festivi_Conteggiati * Ore_Giornaliere_Base)));

  // Passo 3: Conteggio delle Ore Effettivamente Lavorate e Individuazione del Saldo Extra Totale
  const Ore_Extra_Totali = redondear(Totale_Ore_Lavorate - Ore_Dovute_Settimana);

  // Passo 4: Disaccoppiamento e Ripartizione delle Ore Extra (Ordinarie vs Festive)
  const Ore_Extra_Ordinarie = redondear(Math.max(0, Ore_Extra_Totali - Ore_Festive_Lavorate));

  // Passo 5: Calcolo del Compenso Economico Finale
  const Compenso_Extra_Ordinario = redondear2Decimales_(Ore_Extra_Ordinarie * Tariffa_Ora_Extra_Normale);
  const Compenso_Festivo = redondear2Decimales_(Ore_Festive_Lavorate * Tariffa_Ora_Festiva);
  const TOTALE_COMPENSO_EXTRA = redondear2Decimales_(Compenso_Extra_Ordinario + Compenso_Festivo);

  return {
    contrattoOreSettimana: Contratto_Ore_Settimana,
    giorniLavorativiBase: Giorni_Lavorativi_Base,
    oreGiornaliereBase: Ore_Giornaliere_Base,
    giorniFestiviConteggiati: Giorni_Festivi_Conteggiati,
    oreDovuteSettimana: Ore_Dovute_Settimana,
    totaleOreLavorate: Totale_Ore_Lavorate,
    oreExtraTotali: Ore_Extra_Totali,
    oreFestiveLavorate: Ore_Festive_Lavorate,
    oreExtraOrdinarie: Ore_Extra_Ordinarie,
    tariffaOraExtraNormale: Tariffa_Ora_Extra_Normale,
    tariffaOraFestiva: Tariffa_Ora_Festiva,
    compensoExtraOrdinario: Compenso_Extra_Ordinario,
    compensoFestivo: Compenso_Festivo,
    totaleCompensoExtra: TOTALE_COMPENSO_EXTRA,
    giorni: giorni
  };
}

function calcularSemanaHosteleria_(parametri) {
  return calcularSemanaHosteleria(parametri);
}

function ejecutarUnitTestCalcoloHosteleria() {
  const testInput = {
    contrattoOreSettimana: 30.0,
    giorniLavorativiBase: 6,
    tariffaOraExtraNormale: 8.50,
    tariffaOraFestiva: 11.60,
    giorni: [
      { giorno: 'Lunedì', isFestivo: true, oreLavorate: 5.0 },
      { giorno: 'Martedì', isFestivo: false, oreLavorate: 5.0 },
      { giorno: 'Mercoledì', isFestivo: false, oreLavorate: 5.0 },
      { giorno: 'Giovedì', isFestivo: false, oreLavorate: 4.5 },
      { giorno: 'Venerdì', isFestivo: false, oreLavorate: 8.0 },
      { giorno: 'Sabato', isFestivo: false, oreLavorate: 5.0 },
      { giorno: 'Domenica', isFestivo: false, oreLavorate: 0.0 }
    ]
  };

  const res = calcularSemanaHosteleria(testInput);
  return {
    ok: (
      res.oreGiornaliereBase === 5.0 &&
      res.giorniFestiviConteggiati === 1 &&
      res.oreDovuteSettimana === 25.0 &&
      res.oreExtraTotali === 7.5 &&
      res.oreFestiveLavorate === 5.0 &&
      res.oreExtraOrdinarie === 2.5 &&
      Math.abs(res.totaleCompensoExtra - 79.25) < 0.001
    ),
    dettagli: res
  };
}

function calcularResumenCalendario(calendarioId) {
  const calendario = obtenerCalendario(calendarioId);
  const empleados = obtenerEmpleados_();
  const fechas = obtenerFechasPeriodo_(calendario.desde, calendario.hasta);
  const festivos = Array.isArray(calendario.festivos) ? calendario.festivos : [];
  const festivosFechasSet = festivos.map(function(f) {
    return typeof f === 'string' ? f : f.fecha;
  });

  const ajustes = obtenerJson_(CONFIG.AJUSTES, {
    precioHoraExtra: 8.50,
    precioHoraFestiva: 11.60,
    diasLaborablesSemana: 6
  });

  const precioHoraExtra = Number(ajustes.precioHoraExtra !== undefined ? ajustes.precioHoraExtra : 8.50);
  const precioHoraFestiva = Number(ajustes.precioHoraFestiva !== undefined ? ajustes.precioHoraFestiva : 11.60);
  const diasBase = Number(ajustes.diasLaborablesSemana || 6);

  const bloquesSemanas = agruparFechasEnSemanasLunesDomingo_(fechas);
  const resumen = [];

  empleados.forEach(function(empleado) {
    const turnosEmpleado = calendario.asignaciones.filter(function(a) {
      return a.employeeId === empleado.id;
    });

    const contratoSem = Number(empleado.hours || 0);
    const desgloseSemanas = [];

    let totContractBase = 0;
    let totDeduccionFestivos = 0;
    let totContractHours = 0;
    let totWorkedHours = 0;
    let totWorkedFestiveHours = 0;
    let totExtraHoursOrd = 0;
    let totExtraHoursTot = 0;
    let totCompensoOrd = 0;
    let totCompensoFest = 0;
    let totFestivosCount = 0;

    bloquesSemanas.forEach(function(sem) {
      const diasSemanaInfo = sem.fechas.map(function(fStr) {
        const dObj = new Date(fStr + 'T12:00:00');
        const dayIdx = (dObj.getDay() + 6) % 7;
        const isFest = festivosFechasSet.indexOf(fStr) >= 0;
        const turnosDia = turnosEmpleado.filter(function(t) { return t.date === fStr; });
        const oreDia = turnosDia.reduce(function(acc, t) { return acc + Number(t.hours || 0); }, 0);

        return {
          fecha: fStr,
          diaNombre: DIAS[dayIdx],
          isFestivo: isFest,
          oreLavorate: redondear(oreDia)
        };
      });

      const resSem = calcularSemanaHosteleria({
        contrattoOreSettimana: contratoSem,
        giorniLavorativiBase: diasBase,
        tariffaOraExtraNormale: precioHoraExtra,
        tariffaOraFestiva: precioHoraFestiva,
        giorni: diasSemanaInfo
      });

      resSem.numeroSemana = sem.numero;
      resSem.fechaInicio = sem.fechaInicio;
      resSem.fechaFin = sem.fechaFin;
      desgloseSemanas.push(resSem);

      totContractBase += contratoSem;
      totFestivosCount += resSem.giorniFestiviConteggiati;
      totDeduccionFestivos += (resSem.giorniFestiviConteggiati * resSem.oreGiornaliereBase);
      totContractHours += resSem.oreDovuteSettimana;
      totWorkedHours += resSem.totaleOreLavorate;
      totWorkedFestiveHours += resSem.oreFestiveLavorate;
      totExtraHoursOrd += resSem.oreExtraOrdinarie;
      totExtraHoursTot += resSem.oreExtraTotali;
      totCompensoOrd += resSem.compensoExtraOrdinario;
      totCompensoFest += resSem.compensoFestivo;
    });

    totContractBase = redondear(totContractBase);
    totDeduccionFestivos = redondear(totDeduccionFestivos);
    totContractHours = redondear(totContractHours);
    totWorkedHours = redondear(totWorkedHours);
    totWorkedFestiveHours = redondear(totWorkedFestiveHours);
    totExtraHoursOrd = redondear(totExtraHoursOrd);
    totExtraHoursTot = redondear(totExtraHoursTot);
    totCompensoOrd = redondear2Decimales_(totCompensoOrd);
    totCompensoFest = redondear2Decimales_(totCompensoFest);
    const totCompensoFinal = redondear2Decimales_(totCompensoOrd + totCompensoFest);

    const saldoAnterior = redondear(Number(empleado.saldoHorasAnterior || 0));
    const saldoPeriodo = totExtraHoursTot;
    const saldoTotalAcumulado = redondear(saldoPeriodo + saldoAnterior);

    const roleList = (Array.isArray(empleado.depts) && empleado.depts.length)
      ? empleado.depts.join(', ')
      : (empleado.dept || '');

    resumen.push({
      employeeId: empleado.id,
      employeeName: empleado.name,
      role: roleList,
      contractHours: totContractHours,
      contractHoursBase: totContractBase,
      giorniLavorativiBase: diasBase,
      oreGiornaliereBase: redondear(contratoSem / diasBase),
      festivosDeduction: totDeduccionFestivos,
      festivosCount: totFestivosCount,
      festivos: festivos,
      workedHours: totWorkedHours,
      workedFestiveHours: totWorkedFestiveHours,
      extraHours: totExtraHoursOrd,
      extraHoursTotales: totExtraHoursTot,
      saldoHorasAnterior: saldoAnterior,
      saldoPeriodo: saldoPeriodo,
      saldoTotalAcumulado: saldoTotalAcumulado,
      precioHoraExtra: precioHoraExtra,
      precioHoraFestiva: precioHoraFestiva,
      compensoExtraOrdinario: totCompensoOrd,
      compensoFestivo: totCompensoFest,
      totalCompenso: totCompensoFinal,
      desgloseSemanas: desgloseSemanas
    });
  });

  return resumen;
}


/* =========================
   ENLACES PRIVADOS
   ========================= */

function obtenerEnlaces_() {
  return obtenerJson_(CONFIG.ENLACES, []);
}

function guardarEnlaces_(enlaces) {
  guardarJson_(CONFIG.ENLACES, enlaces);
}

function listarEnlaces() {
  inicializarSistema();

  return obtenerEnlaces_().sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function crearEnlacesCalendario(tokenSesion, calendarioId, diasValidez) {
  verificarSesion_(tokenSesion);

  const calendario = obtenerCalendario(calendarioId);

  if (calendario.linksGenerados) {
    throw new Error(
      'Los enlaces ya han sido creados. Para regenerarlos, elimine los enlaces anteriores desde la pestaña "Gestión de Links".'
    );
  }

  const empleados = obtenerEmpleados_().filter(function(e) { return e.active; });
  const enlaces = obtenerEnlaces_();
  const dias = Math.max(1, Number(diasValidez) || CONFIG.CADUCIDAD_CALENDARIO);
  const expiracion = sumarDias_(new Date(), dias).toISOString();
  const urlApp = obtenerUrlApp_();

  if (!urlApp) {
    throw new Error('La aplicación debe estar desplegada como aplicación web antes de generar enlaces.');
  }

  const enlaceGeneral = {
    id: generarId_(),
    token: generarToken_(),
    name: 'Calendario general - ' + calendario.nombre,
    type: 'Calendario General',
    page: 'view_schedule',
    calendarId: calendario.id,
    employeeId: '',
    employeeName: 'Administración',
    phone: '',
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: expiracion
  };

  enlaces.push(enlaceGeneral);
  const idsGenerados = [enlaceGeneral.id];

  empleados.forEach(function(empleado) {
    const enlaceIndividual = {
      id: generarId_(),
      token: generarToken_(),
      name: 'Turnos - ' + empleado.name + ' - ' + calendario.nombre,
      type: 'Calendario Individual',
      page: 'view_schedule',
      calendarId: calendario.id,
      employeeId: empleado.id,
      employeeName: empleado.name,
      phone: empleado.phone,
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiracion
    };
    enlaces.push(enlaceIndividual);
    idsGenerados.push(enlaceIndividual.id);
  });

  guardarEnlaces_(enlaces);

  // FIX-03: marcar el calendario para impedir la duplicación de enlaces.
  const calendarios = obtenerCalendarios_();
  const indiceCalendario = calendarios.findIndex(function(c) { return c.id === calendario.id; });
  if (indiceCalendario >= 0) {
    calendarios[indiceCalendario].linksGenerados = true;
    calendarios[indiceCalendario].enlacesIds = idsGenerados;
    guardarCalendarios_(calendarios);
  }

  return {
    ok: true,
    total: empleados.length + 1,
    urlGeneral: construirUrlEnlace_(enlaceGeneral)
  };
}

function construirUrlEnlace_(enlace) {
  return obtenerUrlApp_() +
    '?page=' + encodeURIComponent(enlace.page) +
    '&token=' + encodeURIComponent(enlace.token);
}

function cambiarEstadoEnlace(tokenSesion, id, activo) {
  verificarSesion_(tokenSesion);
  const enlaces = obtenerEnlaces_();
  const enlace = enlaces.find(function(e) { return e.id === String(id); });

  if (!enlace) throw new Error('Enlace no encontrado.');

  enlace.active = Boolean(activo);
  guardarEnlaces_(enlaces);

  return { ok: true };
}

function eliminarEnlace(tokenSesion, id) {
  verificarSesion_(tokenSesion);
  const enlaces = obtenerEnlaces_();
  const enlaceEliminado = enlaces.find(function(e) { return e.id === String(id); });
  const resultado = enlaces.filter(function(e) { return e.id !== String(id); });

  if (resultado.length === enlaces.length) throw new Error('Enlace no encontrado.');

  guardarEnlaces_(resultado);
  if (enlaceEliminado) resetearLinkGuardSiVacio_(enlaceEliminado.calendarId, resultado);

  return { ok: true };
}

function eliminarEnlaces(tokenSesion, ids) {
  verificarSesion_(tokenSesion);
  const listaIds = Array.isArray(ids) ? ids.map(String) : [];
  if (!listaIds.length) throw new Error('No se han indicado enlaces a eliminar.');

  const enlaces = obtenerEnlaces_();
  const calendarIdsAfectados = enlaces
    .filter(function(e) { return listaIds.indexOf(e.id) >= 0; })
    .map(function(e) { return e.calendarId; })
    .filter(Boolean);

  const resultado = enlaces.filter(function(e) {
    return listaIds.indexOf(e.id) < 0;
  });

  const eliminados = enlaces.length - resultado.length;
  guardarEnlaces_(resultado);

  const calendarIdsUnicos = calendarIdsAfectados.filter(function(id, i) {
    return calendarIdsAfectados.indexOf(id) === i;
  });
  calendarIdsUnicos.forEach(function(calendarId) {
    resetearLinkGuardSiVacio_(calendarId, resultado);
  });

  return { ok: true, eliminados: eliminados };
}

// FIX-03: si tras un borrado ya no queda ningún enlace de ese calendario, se reactiva "Generar Links".
function resetearLinkGuardSiVacio_(calendarId, enlacesRestantes) {
  if (!calendarId) return;

  const quedanEnlaces = enlacesRestantes.some(function(e) { return e.calendarId === calendarId; });
  if (quedanEnlaces) return;

  const calendarios = obtenerCalendarios_();
  const indice = calendarios.findIndex(function(c) { return c.id === calendarId; });
  if (indice >= 0 && calendarios[indice].linksGenerados) {
    calendarios[indice].linksGenerados = false;
    calendarios[indice].enlacesIds = [];
    guardarCalendarios_(calendarios);
  }
}

function obtenerEnlacesConUrl() {
  return listarEnlaces().map(function(enlace) {
    enlace.url = construirUrlEnlace_(enlace);
    return enlace;
  });
}

function limpiarEnlacesExpirados() {
  try {
    const ahora = new Date();
    const enlaces = obtenerEnlaces_();
    const vigentes = enlaces.filter(function(e) {
      if (!e.expiresAt) return true;
      return new Date(e.expiresAt) >= ahora;
    });

    if (vigentes.length !== enlaces.length) {
      guardarEnlaces_(vigentes);
    }
  } catch (error) {
    console.error('Error al limpiar enlaces expirados: ' + error.message);
  }
}

/* =========================
   COMPENSACIÓN HORAS EXTRA
   ========================= */

/* =========================
   COMPENSACIÓN HORAS EXTRA - SECTOR HOSTELERIA
   Tarifas Dinámicas (Extra Ordinaria & Festiva) y Ripartizione
   ========================= */

function guardarAjustesTarifas(tokenSesion, nuevosAjustes) {
  verificarSesion_(tokenSesion);
  const ajustes = obtenerJson_(CONFIG.AJUSTES, {});

  if (nuevosAjustes && nuevosAjustes.precioHoraExtra !== undefined) {
    ajustes.precioHoraExtra = Math.max(0, Number(nuevosAjustes.precioHoraExtra) || 0);
  }
  if (nuevosAjustes && nuevosAjustes.precioHoraFestiva !== undefined) {
    ajustes.precioHoraFestiva = Math.max(0, Number(nuevosAjustes.precioHoraFestiva) || 0);
  }
  if (nuevosAjustes && nuevosAjustes.diasLaborablesSemana !== undefined) {
    ajustes.diasLaborablesSemana = Math.max(1, Number(nuevosAjustes.diasLaborablesSemana) || 6);
  }

  guardarJson_(CONFIG.AJUSTES, ajustes);
  return ajustes;
}

function guardarPrecioHoraExtra(tokenSesion, precio) {
  return guardarAjustesTarifas(tokenSesion, { precioHoraExtra: precio });
}

function obtenerResumenCompenso(calendarioId) {
  const calendario = obtenerCalendario(calendarioId);
  const ajustes = obtenerJson_(CONFIG.AJUSTES, {
    precioHoraExtra: 8.50,
    precioHoraFestiva: 11.60,
    diasLaborablesSemana: 6
  });

  return {
    calendario: calendario,
    empleados: calcularResumenCalendario(calendarioId),
    precioHoraExtra: Number(ajustes.precioHoraExtra !== undefined ? ajustes.precioHoraExtra : 8.50),
    precioHoraFestiva: Number(ajustes.precioHoraFestiva !== undefined ? ajustes.precioHoraFestiva : 11.60),
    diasLaborablesSemana: Number(ajustes.diasLaborablesSemana || 6)
  };
}

function generarReciboCompenso(tokenSesion, datos) {
  verificarSesion_(tokenSesion);
  if (!datos || !datos.calendarId || !datos.employeeId) {
    throw new Error('Debes seleccionar un calendario y un empleado.');
  }

  const calendario = obtenerCalendario(datos.calendarId);
  const empleado = obtenerEmpleados_().find(function(e) {
    return e.id === String(datos.employeeId);
  });

  if (!empleado) throw new Error('Empleado no encontrado.');

  const resumen = calcularResumenCalendario(calendario.id).find(function(r) {
    return r.employeeId === empleado.id;
  });

  if (!resumen) throw new Error('No se ha podido calcular el resumen del empleado.');

  const ajustes = obtenerJson_(CONFIG.AJUSTES, { precioHoraExtra: 8.50, precioHoraFestiva: 11.60, diasLaborablesSemana: 6 });
  const precioExtraOrd = Math.max(0, Number(datos.pricePerHour !== undefined ? datos.pricePerHour : (ajustes.precioHoraExtra || 8.50)));
  const precioFestivo = Math.max(0, Number(datos.pricePerFestiveHour !== undefined ? datos.pricePerFestiveHour : (ajustes.precioHoraFestiva || 11.60)));

  const ajusteManual = Number(datos.manualAdjustment || 0);
  const horasFinalesOrdinarie = Math.max(0, redondear(resumen.extraHours + ajusteManual));
  const horasFestive = redondear(resumen.workedFestiveHours || 0);

  const compensoOrd = redondear2Decimales_(horasFinalesOrdinarie * precioExtraOrd);
  const compensoFest = redondear2Decimales_(horasFestive * precioFestivo);
  const importeTotal = redondear2Decimales_(compensoOrd + compensoFest);
  const dias = Math.max(1, Number(datos.validDays) || CONFIG.CADUCIDAD_COMPENSO);

  const compensacion = {
    id: generarId_(),
    calendarId: calendario.id,
    employeeId: empleado.id,
    employeeName: empleado.name,
    employeePhone: empleado.phone,
    periodo: fechaLegible_(calendario.desde) + ' - ' + fechaLegible_(calendario.hasta),
    contractHours: resumen.contractHours,
    contractHoursBase: resumen.contractHoursBase,
    giorniLavorativiBase: resumen.giorniLavorativiBase || 6,
    oreGiornaliereBase: resumen.oreGiornaliereBase,
    festivosDeduction: resumen.festivosDeduction,
    festivosCount: resumen.festivosCount,
    festivos: resumen.festivos,
    workedHours: resumen.workedHours,
    workedFestiveHours: horasFestive,
    saldoHorasAnterior: resumen.saldoHorasAnterior || 0,
    saldoPeriodo: resumen.saldoPeriodo,
    saldoTotalAcumulado: resumen.saldoTotalAcumulado,
    automaticExtraHours: resumen.extraHours,
    manualAdjustment: ajusteManual,
    finalExtraHours: horasFinalesOrdinarie,
    pricePerHour: precioExtraOrd,
    pricePerFestiveHour: precioFestivo,
    compensoExtraOrdinario: compensoOrd,
    compensoFestivo: compensoFest,
    totalAmount: importeTotal,
    desgloseSemanas: resumen.desgloseSemanas || [],
    justification: String(datos.justification || '').trim(),
    createdAt: new Date().toISOString()
  };

  // F14: Trasladar automáticamente el saldo restante no compensado al empleado
  const saldoRestante = redondear((resumen.saldoTotalAcumulado || 0) + ajusteManual - horasFinalesOrdinarie);
  compensacion.saldoRestante = saldoRestante;

  const compensos = obtenerJson_(CONFIG.COMPENSOS, []);
  compensos.push(compensacion);
  guardarJson_(CONFIG.COMPENSOS, compensos);

  const todosEmpleados = obtenerEmpleados_();
  const empTarget = todosEmpleados.find(function(e) { return e.id === empleado.id; });
  if (empTarget) {
    empTarget.saldoHorasAnterior = saldoRestante;
    guardarEmpleados_(todosEmpleados);
  }

  // Registrar en la lista/historial oficial de saldos de horas
  const historial = obtenerJson_(CONFIG.HISTORIAL_SALDOS, []);
  historial.push({
    id: generarId_(),
    employeeId: empleado.id,
    employeeName: empleado.name,
    calendarId: calendario.id,
    calendarName: calendario.nombre,
    compensationId: compensacion.id,
    periodo: compensacion.periodo,
    contractHours: resumen.contractHours,
    workedHours: resumen.workedHours,
    workedFestiveHours: horasFestive,
    saldoAnterior: resumen.saldoHorasAnterior || 0,
    saldoPeriodo: resumen.saldoPeriodo || 0,
    ajusteManual: ajusteManual,
    finalExtraHours: horasFinalesOrdinarie,
    saldoResultante: saldoRestante,
    tipo: saldoRestante < 0 ? 'DEFICIT' : (saldoRestante > 0 ? 'CREDITO' : 'NEUTRO'),
    origen: 'Generación de recibo de compenso Hosteleria',
    createdAt: new Date().toISOString()
  });
  guardarJson_(CONFIG.HISTORIAL_SALDOS, historial);

  const enlace = {
    id: generarId_(),
    token: generarToken_(),
    name: 'Compenso - ' + empleado.name + ' - ' + calendario.nombre,
    type: 'Recibo Compensación',
    page: 'view_compensation',
    calendarId: calendario.id,
    compensationId: compensacion.id,
    employeeId: empleado.id,
    employeeName: empleado.name,
    phone: empleado.phone,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: sumarDias_(new Date(), dias).toISOString()
  };

  const enlaces = obtenerEnlaces_();
  enlaces.push(enlace);
  guardarEnlaces_(enlaces);

  return {
    ok: true,
    compensacion: compensacion,
    enlace: Object.assign(enlace, { url: construirUrlEnlace_(enlace) })
  };
}


function eliminarCompensacion(tokenSesion, compensationId, eliminarSaldoAsociado) {
  verificarSesion_(tokenSesion);
  const compensos = obtenerJson_(CONFIG.COMPENSOS, []);
  const compIndex = compensos.findIndex(function(c) { return c.id === String(compensationId); });

  if (compIndex < 0) {
    throw new Error('Recibo de compensación no encontrado.');
  }

  const comp = compensos[compIndex];

  if (eliminarSaldoAsociado) {
    const historial = obtenerJson_(CONFIG.HISTORIAL_SALDOS, []);
    const regIndex = historial.findIndex(function(h) { return h.compensationId === comp.id; });

    if (regIndex >= 0) {
      const reg = historial[regIndex];
      const todosEmpleados = obtenerEmpleados_();
      const empTarget = todosEmpleados.find(function(e) { return e.id === comp.employeeId; });
      if (empTarget) {
        empTarget.saldoHorasAnterior = redondear(Number(reg.saldoAnterior || 0));
        guardarEmpleados_(todosEmpleados);
      }
      historial.splice(regIndex, 1);
      guardarJson_(CONFIG.HISTORIAL_SALDOS, historial);
    }
  }

  compensos.splice(compIndex, 1);
  guardarJson_(CONFIG.COMPENSOS, compensos);

  return { ok: true };
}

function listarHistorialSaldos(tokenSesion) {
  verificarSesion_(tokenSesion);
  const historial = obtenerJson_(CONFIG.HISTORIAL_SALDOS, []);
  const empleados = obtenerEmpleados_();
  return {
    ok: true,
    historial: historial,
    empleados: empleados
  };
}

function guardarAjusteManualSaldo(tokenSesion, datos) {
  verificarSesion_(tokenSesion);
  if (!datos || !datos.employeeId) throw new Error('Empleado no especificado.');

  const empleados = obtenerEmpleados_();
  const empTarget = empleados.find(function(e) { return e.id === String(datos.employeeId); });
  if (!empTarget) throw new Error('Empleado no encontrado.');

  const nuevoSaldo = redondear(Number(datos.nuevoSaldo || 0));
  const saldoAnterior = Number(empTarget.saldoHorasAnterior || 0);
  empTarget.saldoHorasAnterior = nuevoSaldo;
  guardarEmpleados_(empleados);

  const historial = obtenerJson_(CONFIG.HISTORIAL_SALDOS, []);
  historial.push({
    id: generarId_(),
    employeeId: empTarget.id,
    employeeName: empTarget.name,
    calendarId: null,
    calendarName: 'Ajuste Manual Admin',
    compensationId: null,
    periodo: datos.periodo || 'Ajuste Manual',
    contractHours: Number(empTarget.hours || 0),
    workedHours: 0,
    saldoAnterior: saldoAnterior,
    saldoPeriodo: 0,
    ajusteManual: redondear(nuevoSaldo - saldoAnterior),
    finalExtraHours: 0,
    saldoResultante: nuevoSaldo,
    tipo: nuevoSaldo < 0 ? 'DEFICIT' : (nuevoSaldo > 0 ? 'CREDITO' : 'NEUTRO'),
    origen: String(datos.nota || 'Ajuste manual del administrador').trim(),
    createdAt: new Date().toISOString()
  });
  guardarJson_(CONFIG.HISTORIAL_SALDOS, historial);

  return { ok: true, saldoResultante: nuevoSaldo };
}

function eliminarRegistroSaldo(tokenSesion, registroId) {
  verificarSesion_(tokenSesion);
  const historial = obtenerJson_(CONFIG.HISTORIAL_SALDOS, []);
  const nuevos = historial.filter(function(h) { return h.id !== String(registroId); });
  guardarJson_(CONFIG.HISTORIAL_SALDOS, nuevos);
  return { ok: true };
}

function restablecerTodosSaldos(tokenSesion) {
  verificarSesion_(tokenSesion);
  const empleados = obtenerEmpleados_();
  empleados.forEach(function(e) {
    e.saldoHorasAnterior = 0;
  });
  guardarEmpleados_(empleados);
  return { ok: true };
}

/* =========================
   CONTENIDO PÚBLICO
   ========================= */

function obtenerVistaPublica(pagina, token) {
  const page = String(pagina || '').trim().replace(/^&quot;|&quot;$/g, '').replace(/^"|"$/g, '');
  const tokenSeguro = String(token || '').trim().replace(/^&quot;|&quot;$/g, '').replace(/^"|"$/g, '');

  if (!tokenSeguro || (page !== 'view_schedule' && page !== 'view_compensation')) {
    return { ok: false, motivo: 'Enlace no válido.' };
  }

  const enlace = obtenerEnlaces_().find(function(e) {
    return e.token === tokenSeguro && e.page === page;
  });

  if (!enlace) return { ok: false, motivo: 'El enlace no existe.' };
  if (!enlace.active) return { ok: false, motivo: 'Este enlace ha sido desactivado.' };
  if (new Date(enlace.expiresAt) < new Date()) {
    return { ok: false, motivo: 'Este enlace ha caducado.' };
  }

  if (page === 'view_schedule') {
    const calendario = obtenerCalendario(enlace.calendarId);
    const empleados = obtenerEmpleados_();

    let empleadosVisibles = empleados;
    let asignacionesVisibles = calendario.asignaciones;

    if (enlace.type === 'Calendario Individual') {
      empleadosVisibles = empleados.filter(function(e) {
        return e.id === enlace.employeeId;
      });

      asignacionesVisibles = calendario.asignaciones.filter(function(a) {
        return a.employeeId === enlace.employeeId;
      });
    }

    return {
      ok: true,
      tipo: 'horario',
      enlace: {
        nombre: enlace.name,
        tipo: enlace.type
      },
      calendario: {
        id: calendario.id,
        nombre: calendario.nombre,
        desde: calendario.desde,
        hasta: calendario.hasta,
        turnos: calendario.turnos || TURNOS_BASE,
        turnosActivosPorDia: calendario.turnosActivosPorDia || {},
        cierres: calendario.cierres || [],
        festivos: calendario.festivos || []
      },
      empleados: empleadosVisibles,
      asignaciones: asignacionesVisibles,
      resumen: calcularResumenCalendario(calendario.id)
        .filter(function(r) {
          return enlace.type === 'Calendario General' || r.employeeId === enlace.employeeId;
        })
    };
  }

  const compensacion = obtenerJson_(CONFIG.COMPENSOS, []).find(function(c) {
    return c.id === enlace.compensationId;
  });

  if (!compensacion) return { ok: false, motivo: 'El recibo de compensación no existe.' };

  return {
    ok: true,
    tipo: 'compensacion',
    enlace: {
      nombre: enlace.name
    },
    compensacion: compensacion
  };
}

function pruebaWeb() {
  return {
    ok: true,
    mensaje: 'El servidor responde correctamente.',
    fecha: new Date().toISOString()
  };
}

function pruebaInicializacion() {
  return inicializarSistema();
}

function pruebaDatos() {
  // Función de prueba: solo devuelve datos básicos sin verificar sesión.
  inicializarSistema();
  return {
    empleados: obtenerEmpleados_(),
    calendarios: obtenerCalendarios_(),
    enlaces: obtenerEnlaces_()
  };
}
