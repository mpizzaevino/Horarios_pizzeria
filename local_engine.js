/**
 * LOCAL ENGINE PER GITHUB PAGES & BROWSER STANDALONE
 * Permette all'applicazione di funzionare al 100% su GitHub Pages senza Google Apps Script,
 * salvando dati e stato in localStorage con fallback automatico.
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    EMPLEADOS: 'MPV_EMPLEADOS',
    CALENDARIOS: 'MPV_CALENDARIOS',
    ENLACES: 'MPV_ENLACES',
    COMPENSOS: 'MPV_COMPENSOS',
    HISTORIAL_SALDOS: 'MPV_HISTORIAL_SALDOS',
    AJUSTES: 'MPV_AJUSTES',
    PLANTILLAS: 'MPV_PLANTILLAS',
    ADMIN_PASS: 'MPV_ADMIN_PASSWORD',
    ADMIN_SESSION: 'MPV_ADMIN_SESSION',
    INICIALIZADO: 'MPV_SISTEMA_INICIALIZADO'
  };

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const TURNOS_BASE = {
    manana: { nombre: 'Mañana', inicio: '10:00', fin: '16:00' },
    tarde: { nombre: 'Comida', inicio: '13:00', fin: '16:30' },
    cena: { nombre: 'Cena', inicio: '19:30', fin: '23:30' }
  };

  const EMPLEADOS_DEFAULT = [
    {
      id: '1',
      name: 'Gilberto Nasser',
      phone: '+34 676 44 92 13',
      email: '',
      dept: 'SALA',
      rolPrincipal: 'SALA',
      rolSecundario: 'COCINA',
      depts: ['SALA', 'COCINA'],
      hours: 40,
      active: true,
      diasLibres: 1,
      prefShift: ['Cualquiera'],
      exclShift: [],
      exclDay: [],
      saldoHorasAnterior: 0
    },
    {
      id: '2',
      name: 'Mohammed Husein',
      phone: '+34 632 41 09 21',
      email: '',
      dept: 'PIZZERIA',
      rolPrincipal: 'PIZZERIA',
      rolSecundario: null,
      depts: ['PIZZERIA'],
      hours: 40,
      active: true,
      diasLibres: 1,
      prefShift: ['Cualquiera'],
      exclShift: [],
      exclDay: [],
      saldoHorasAnterior: 0
    },
    {
      id: '3',
      name: 'Angela Nasser',
      phone: '+34 610 19 41 62',
      email: '',
      dept: 'COCINA',
      rolPrincipal: 'COCINA',
      rolSecundario: null,
      depts: ['COCINA'],
      hours: 40,
      active: true,
      diasLibres: 1,
      prefShift: ['Cualquiera'],
      exclShift: [],
      exclDay: [],
      saldoHorasAnterior: 0
    },
    {
      id: '4',
      name: 'Manuel (nuevo)',
      phone: '+34 654 44 25 99',
      email: '',
      dept: 'SALA',
      rolPrincipal: 'SALA',
      rolSecundario: null,
      depts: ['SALA'],
      hours: 40,
      active: true,
      diasLibres: 1,
      prefShift: ['Cualquiera'],
      exclShift: [],
      exclDay: [],
      saldoHorasAnterior: 0
    },
    {
      id: '5',
      name: 'Rosmary Nasser',
      phone: '+34 681 35 75 83',
      email: '',
      dept: 'SALA',
      rolPrincipal: 'SALA',
      rolSecundario: null,
      depts: ['SALA'],
      hours: 40,
      active: false,
      diasLibres: 1,
      prefShift: ['Cualquiera'],
      exclShift: [],
      exclDay: [],
      saldoHorasAnterior: 0
    },
    {
      id: '6',
      name: 'Facundo Cam',
      phone: '+34 654 44 25 99',
      email: '',
      dept: 'SALA',
      rolPrincipal: 'SALA',
      rolSecundario: null,
      depts: ['SALA'],
      hours: 40,
      active: true,
      diasLibres: 1,
      prefShift: ['Cualquiera'],
      exclShift: ['Mañana', 'Tarde'],
      exclDay: ['Lunes', 'Martes', 'Miércoles', 'Jueves'],
      saldoHorasAnterior: 0
    }
  ];

  const PLANTILLAS_DEFAULT = [
    {
      id: 'plantilla_estandar',
      nombre: 'Estándar Marcellino',
      turnos: {
        manana: { nombre: 'Mañana', inicio: '10:00', fin: '16:00' },
        tarde: { nombre: 'Comida', inicio: '13:00', fin: '16:30' },
        cena: { nombre: 'Cena', inicio: '19:30', fin: '23:30' }
      },
      necesidades: {
        manana: { COCINA: 1, PIZZERIA: 0, SALA: 2 },
        tarde: { COCINA: 1, PIZZERIA: 1, SALA: 2 },
        cena: { COCINA: 1, PIZZERIA: 1, SALA: 3 }
      },
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
      turnosActivosPorDia: {
        Lunes:     { manana: true, tarde: true, cena: true },
        Martes:    { manana: true, tarde: true, cena: true },
        Miércoles: { manana: true, tarde: true, cena: true },
        Jueves:    { manana: true, tarde: true, cena: true },
        Viernes:   { manana: true, tarde: true, cena: true },
        Sábado:    { manana: true, tarde: true, cena: true },
        Domingo:   { manana: true, tarde: true, cena: true }
      },
      excepciones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  function normalizeEmpleadoDeptsLocal(emp) {
    if (!emp) return emp;
    const ROLES_VALIDOS = ['SALA', 'COCINA', 'PIZZERIA'];
    let rolPrincipal = emp.rolPrincipal || emp.dept;
    if (!rolPrincipal || ROLES_VALIDOS.indexOf(rolPrincipal) < 0) {
      rolPrincipal = (Array.isArray(emp.depts) && emp.depts.length > 0 && ROLES_VALIDOS.indexOf(emp.depts[0]) >= 0) ? emp.depts[0] : 'SALA';
    }
    let rolSecundario = emp.rolSecundario;
    if (!rolSecundario && Array.isArray(emp.depts) && emp.depts.length > 1 && ROLES_VALIDOS.indexOf(emp.depts[1]) >= 0) {
      rolSecundario = emp.depts[1];
    }
    if (rolSecundario === rolPrincipal || ROLES_VALIDOS.indexOf(rolSecundario) < 0) {
      rolSecundario = null;
    }

    const depts = [rolPrincipal];
    if (rolSecundario) depts.push(rolSecundario);

    emp.rolPrincipal = rolPrincipal;
    emp.rolSecundario = rolSecundario;
    emp.dept = rolPrincipal;
    emp.depts = depts;
    emp.diasLibres = Math.min(6, Math.max(0, Number(emp.diasLibres !== undefined && emp.diasLibres !== null && emp.diasLibres !== '' ? emp.diasLibres : 1)));
    emp.saldoHorasAnterior = redondearLocal(Number(emp.saldoHorasAnterior || 0));
    return emp;
  }

  function getLocalJson(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultVal;
      return JSON.parse(raw);
    } catch (e) {
      return defaultVal;
    }
  }

  function setLocalJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  
  function calcularAlmacenamientoLocal() {
    let bytes = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          bytes += (String(localStorage[key]).length + String(key).length) * 2;
        }
      }
    } catch (e) {}
    const maxBytes = 5 * 1024 * 1024; // 5 MB de cuota estándar localStorage
    const pct = Math.round((bytes / maxBytes) * 1000) / 10;
    return {
      bytesUsados: bytes,
      bytesTotales: maxBytes,
      porcentajeTotal: pct,
      alerta: pct > 80,
      mensaje: (bytes / 1024).toFixed(1) + ' KB de 5 MB'
    };
  }

  function initStorageIfNeeded() {
    const yaInicializado = localStorage.getItem(STORAGE_KEYS.INICIALIZADO);
    if (!yaInicializado) {
      if (localStorage.getItem(STORAGE_KEYS.EMPLEADOS) === null) {
        setLocalJson(STORAGE_KEYS.EMPLEADOS, EMPLEADOS_DEFAULT);
      }
      if (localStorage.getItem(STORAGE_KEYS.PLANTILLAS) === null) {
        setLocalJson(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_DEFAULT);
      }
      localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
    } else {
      // Ya inicializado: SOLO rellenar si la clave nunca existió (null)
      if (localStorage.getItem(STORAGE_KEYS.EMPLEADOS) === null) {
        setLocalJson(STORAGE_KEYS.EMPLEADOS, EMPLEADOS_DEFAULT);
      }
      if (localStorage.getItem(STORAGE_KEYS.PLANTILLAS) === null) {
        setLocalJson(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_DEFAULT);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.AJUSTES)) {
      setLocalJson(STORAGE_KEYS.AJUSTES, {
        precioHoraExtra: 8.50,
        precioHoraFestiva: 11.60,
        diasLaborablesSemana: 6
      });
    }
    if (!localStorage.getItem(STORAGE_KEYS.CALENDARIOS)) {
      setLocalJson(STORAGE_KEYS.CALENDARIOS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENLACES)) {
      setLocalJson(STORAGE_KEYS.ENLACES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPENSOS)) {
      setLocalJson(STORAGE_KEYS.COMPENSOS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORIAL_SALDOS)) {
      setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
    }
  }

  function generarIdLocal() {
    return 'loc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  function redondearLocal(val) {
    return Math.round((Number(val) || 0) * 2) / 2;
  }

  function redondear2DecLocal(val) {
    return Math.round(((Number(val) || 0) + Number.EPSILON) * 100) / 100;
  }

  function obtenerFechasPeriodoLocal(desdeStr, hastaStr) {
    const fechas = [];
    const curr = new Date(desdeStr + 'T12:00:00');
    const fin = new Date(hastaStr + 'T12:00:00');
    while (curr <= fin) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      fechas.push(y + '-' + m + '-' + d);
      curr.setDate(curr.getDate() + 1);
    }
    return fechas;
  }

  function agruparSemanasLocal(fechas) {
    const semanas = [];
    let semanaActual = null;
    fechas.forEach(function (fStr) {
      const d = new Date(fStr + 'T12:00:00');
      const dayOfWeek = (d.getDay() + 6) % 7;
      if (!semanaActual || dayOfWeek === 0) {
        semanaActual = {
          numero: semanas.length + 1,
          fechaInicio: fStr,
          fechaFin: fStr,
          fechas: []
        };
        semanas.push(semanaActual);
      }
      semanaActual.fechas.push(fStr);
      semanaActual.fechaFin = fStr;
    });
    return semanas;
  }

  function calcularSemanaHosteleriaLocal(p) {
    const cOre = Number(p.contrattoOreSettimana || 0);
    const gBase = Number(p.giorniLavorativiBase || 6);
    const tNorm = Number(p.tariffaOraExtraNormale !== undefined ? p.tariffaOraExtraNormale : 8.50);
    const tFest = Number(p.tariffaOraFestiva !== undefined ? p.tariffaOraFestiva : 11.60);

    const oreBase = redondearLocal(cOre / gBase);
    const giorni = Array.isArray(p.giorni) ? p.giorni : [];
    let gFest = 0;
    let totLav = 0;
    let oreFest = 0;

    giorni.forEach(function (g) {
      const isFest = Boolean(g.isFestivo || g.is_festivo || g.festivo);
      const ore = Number(g.oreLavorate !== undefined ? g.oreLavorate : (g.hours || 0));
      if (isFest) {
        gFest++;
        oreFest += ore;
      }
      totLav += ore;
    });

    totLav = redondearLocal(totLav);
    oreFest = redondearLocal(oreFest);
    // NUOVA REGOLA: il contratto settimanale è FISSO, nessuna deduzione per festivi.
    // Le ore festive lavorate vengono sempre retribuite a tariffa festiva.
    // Le ore extra ordinarie = max(0, (lavorato - contratto) - ore_festive)
    const oreDovute = cOre; // FISSO - non ridotto per i festivi
    const extraTot = redondearLocal(Math.max(0, totLav - oreDovute));
    const extraOrd = redondearLocal(Math.max(0, extraTot - oreFest));
    const compOrd = redondear2DecLocal(extraOrd * tNorm);
    const compFest = redondear2DecLocal(oreFest * tFest);
    const totComp = redondear2DecLocal(compOrd + compFest);

    return {
      contrattoOreSettimana: cOre,
      giorniLavorativiBase: gBase,
      oreGiornaliereBase: oreBase,
      giorniFestiviConteggiati: gFest,
      oreDovuteSettimana: oreDovute,
      totaleOreLavorate: totLav,
      oreExtraTotali: extraTot,
      oreFestiveLavorate: oreFest,
      oreExtraOrdinarie: extraOrd,
      tariffaOraExtraNormale: tNorm,
      tariffaOraFestiva: tFest,
      compensoExtraOrdinario: compOrd,
      compensoFestivo: compFest,
      totaleCompensoExtra: totComp,
      giorni: giorni
    };
  }

  function resolverHorariosEfectivosLocal(horariosRolesBase, necesidadesBase, claveTurno, fecha, nombreDia, excepciones) {
    if (!Array.isArray(excepciones) || !excepciones.length) {
      return {
        horarios: (horariosRolesBase && horariosRolesBase[claveTurno]) || {},
        necesidades: (necesidadesBase && necesidadesBase[claveTurno]) || {}
      };
    }

    let excepcionAplicable = null;
    // Prioridad 1: fecha exacta
    for (let i = 0; i < excepciones.length; i++) {
      const ex = excepciones[i];
      if (ex.turno !== claveTurno) continue;
      if (ex.tipo === 'fecha' && ex.valor === fecha) {
        excepcionAplicable = ex;
        break;
      }
    }

    // Prioridad 2: día de la semana
    if (!excepcionAplicable) {
      for (let i = 0; i < excepciones.length; i++) {
        const ex = excepciones[i];
        if (ex.turno !== claveTurno) continue;
        if (ex.tipo === 'diasemana' && (ex.valor === nombreDia || String(ex.valor).toLowerCase() === String(nombreDia).toLowerCase())) {
          excepcionAplicable = ex;
          break;
        }
      }
    }

    const horariosBase = (horariosRolesBase && horariosRolesBase[claveTurno]) || {};
    const necesBase = (necesidadesBase && necesidadesBase[claveTurno]) || {};

    if (!excepcionAplicable) {
      return {
        horarios: horariosBase,
        necesidades: necesBase
      };
    }

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

  function calcularResumenCalendarioLocal(calId) {
    const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
    const cal = cals.find(function (c) { return c.id === calId; });
    if (!cal) throw new Error('Calendario no encontrado.');

    const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
    const fechas = obtenerFechasPeriodoLocal(cal.desde, cal.hasta);
    const festivos = Array.isArray(cal.festivos) ? cal.festivos : [];
    const festivosSet = festivos.map(function (f) { return typeof f === 'string' ? f : f.fecha; });
    const ajustes = getLocalJson(STORAGE_KEYS.AJUSTES, { precioHoraExtra: 8.50, precioHoraFestiva: 11.60, diasLaborablesSemana: 6 });

    const pNorm = Number(ajustes.precioHoraExtra !== undefined ? ajustes.precioHoraExtra : 8.50);
    const pFest = Number(ajustes.precioHoraFestiva !== undefined ? ajustes.precioHoraFestiva : 11.60);
    const dBase = Number(ajustes.diasLaborablesSemana || 6);

    const semanas = agruparSemanasLocal(fechas);
    const resumen = [];

    emps.forEach(function (emp) {
      const turnosEmp = (cal.asignaciones || []).filter(function (a) { return a.employeeId === emp.id; });
      const contratoSem = Number(emp.hours || 0);
      const desgloseSemanas = [];

      let totContractBase = 0;
      let totDeduccionFest = 0;
      let totContractHours = 0;
      let totWorked = 0;
      let totFestWorked = 0;
      let totExtraOrd = 0;
      let totExtraTot = 0;
      let totCompOrd = 0;
      let totCompFest = 0;
      let totFestCount = 0;

      semanas.forEach(function (sem) {
        const diasSemInfo = sem.fechas.map(function (fStr) {
          const dObj = new Date(fStr + 'T12:00:00');
          const dayIdx = (dObj.getDay() + 6) % 7;
          const isFest = festivosSet.indexOf(fStr) >= 0;
          const turnosDia = turnosEmp.filter(function (t) { return t.date === fStr; });
          const oreDia = turnosDia.reduce(function (acc, t) { return acc + Number(t.hours || 0); }, 0);
          return {
            fecha: fStr,
            diaNombre: DIAS[dayIdx],
            isFestivo: isFest,
            oreLavorate: redondearLocal(oreDia)
          };
        });

        const resSem = calcularSemanaHosteleriaLocal({
          contrattoOreSettimana: contratoSem,
          giorniLavorativiBase: dBase,
          tariffaOraExtraNormale: pNorm,
          tariffaOraFestiva: pFest,
          giorni: diasSemInfo
        });

        resSem.numeroSemana = sem.numero;
        resSem.fechaInicio = sem.fechaInicio;
        resSem.fechaFin = sem.fechaFin;
        desgloseSemanas.push(resSem);

        totContractBase += contratoSem;
        totFestCount += resSem.giorniFestiviConteggiati;
        totDeduccionFest += 0; // Non più applicata: il contratto è FISSO
        totContractHours += contratoSem; // Sempre il contratto base, non ridotto per festivi
        totWorked += resSem.totaleOreLavorate;
        totFestWorked += resSem.oreFestiveLavorate;
        totExtraOrd += resSem.oreExtraOrdinarie;
        totExtraTot += resSem.oreExtraTotali;
        totCompOrd += resSem.compensoExtraOrdinario;
        totCompFest += resSem.compensoFestivo;
      });

      totContractBase = redondearLocal(totContractBase);
      totDeduccionFest = redondearLocal(totDeduccionFest);
      totContractHours = redondearLocal(totContractHours);
      totWorked = redondearLocal(totWorked);
      totFestWorked = redondearLocal(totFestWorked);
      totExtraOrd = redondearLocal(totExtraOrd);
      totExtraTot = redondearLocal(totExtraTot);
      totCompOrd = redondear2DecLocal(totCompOrd);
      totCompFest = redondear2DecLocal(totCompFest);

      const saldoAnt = redondearLocal(Number(emp.saldoHorasAnterior || 0));

      // REGLA CRÍTICA DE COMPENSACIÓN:
      // Si el trabajador tiene saldo positivo (deuda por haber trabajado menos horas en períodos anteriores),
      // este saldo se SUMA a las horas de la nómina requeridas en este período (contractHoursEfectivas).
      // Las horas extra se computan ÚNICAMENTE sobre las horas trabajadas que superen la nómina efectiva.
      const contractHoursEfectivas = redondearLocal(Math.max(0, totContractHours + saldoAnt));
      
      const difPeriodo = redondearLocal(totWorked - contractHoursEfectivas);
      // Horas extra totales del período: solo el excedente sobre la nómina efectiva
      totExtraTot = Math.max(0, difPeriodo);
      // Las horas extra ordinarias descuentan las horas festivas trabajadas (que se pagan a tarifa festiva)
      totExtraOrd = Math.max(0, redondearLocal(totExtraTot - totFestWorked));

      // Saldo restante: si no alcanzó las horas requeridas (difPeriodo < 0), la diferencia pasa como saldo a recuperar
      const saldoRestante = difPeriodo < 0 ? Math.abs(difPeriodo) : 0;
      const saldoTotAcum = saldoRestante;
      const saldoPer = difPeriodo;

      totCompOrd = redondear2DecLocal(totExtraOrd * pNorm);
      totCompFest = redondear2DecLocal(totFestWorked * pFest);
      const totFinalComp = redondear2DecLocal(totCompOrd + totCompFest);

      const roleList = (Array.isArray(emp.depts) && emp.depts.length) ? emp.depts.join(', ') : (emp.dept || '');

      resumen.push({
        employeeId: emp.id,
        employeeName: emp.name,
        role: roleList,
        contractHours: totContractHours,
        contractHoursBase: totContractBase,
        contractHoursEfectivas: contractHoursEfectivas,
        giorniLavorativiBase: dBase,
        oreGiornaliereBase: redondearLocal(contratoSem / dBase),
        festivosDeduction: totDeduccionFest,
        festivosCount: totFestCount,
        festivos: festivos,
        workedHours: totWorked,
        workedFestiveHours: totFestWorked,
        extraHours: totExtraOrd,
        extraHoursTotales: totExtraTot,
        saldoHorasAnterior: saldoAnt,
        saldoPeriodo: saldoPer,
        saldoTotalAcumulado: saldoTotAcum,
        precioHoraExtra: pNorm,
        precioHoraFestiva: pFest,
        compensoExtraOrdinario: totCompOrd,
        compensoFestivo: totCompFest,
        totalCompenso: totFinalComp,
        desgloseSemanas: desgloseSemanas
      });
    });

    return resumen;
  }

  function recalcularIncidenciasCalendarioLocal(cal, emps, ajustes) {
    if (!cal) return [];
    const desde = cal.desde;
    const hasta = cal.hasta;
    if (!desde || !hasta) return cal.incidencias || [];

    const fechas = obtenerFechasPeriodoLocal(desde, hasta);
    const cierres = Array.isArray(cal.cierres) ? cal.cierres : [];
    const festivos = Array.isArray(cal.festivos) ? cal.festivos : [];
    const numFestivos = festivos.length;
    const excepciones = Array.isArray(cal.excepciones) ? cal.excepciones : [];
    const turnos = cal.turnos || TURNOS_BASE;
    const necesidades = cal.necesidades || { manana: { COCINA: 1, PIZZERIA: 0, SALA: 2 }, tarde: { COCINA: 1, PIZZERIA: 1, SALA: 2 }, cena: { COCINA: 1, PIZZERIA: 1, SALA: 3 } };
    const asignaciones = Array.isArray(cal.asignaciones) ? cal.asignaciones : [];
    const empleados = Array.isArray(emps) ? emps : getLocalJson(STORAGE_KEYS.EMPLEADOS, EMPLEADOS_DEFAULT);
    const confAjustes = ajustes || getLocalJson(STORAGE_KEYS.AJUSTES, { diasLaborablesSemana: 6 });

    const nuevasIncidencias = [];

    if (Array.isArray(cal.incidencias)) {
      cal.incidencias.forEach(function (inc) {
        if (typeof inc === 'string' && (inc.indexOf('⚡') >= 0 || inc.indexOf('Compensación automática') >= 0)) {
          nuevasIncidencias.push(inc);
        }
      });
    }

    fechas.forEach(function (fStr, idx) {
      if (cierres.indexOf(fStr) >= 0) return;
      const dObj = new Date(fStr + 'T12:00:00');
      const dayIdx = (dObj.getDay() + 6) % 7;
      const diaNom = DIAS[dayIdx];

      Object.keys(turnos).forEach(function (cTurno) {
        if (cal.turnosActivosPorDia && cal.turnosActivosPorDia[diaNom] && cal.turnosActivosPorDia[diaNom][cTurno] === false) {
          return;
        }

        const turnoObj = turnos[cTurno];
        if (!turnoObj || !turnoObj.inicio || !turnoObj.fin) return;
        const nombreTurno = turnoObj.nombre || cTurno;

        const efectivos = resolverHorariosEfectivosLocal(cal.horariosRoles, necesidades, cTurno, fStr, diaNom, excepciones);
        const nec = efectivos.necesidades || {};

        ['COCINA', 'PIZZERIA', 'SALA'].forEach(function (rol) {
          const cant = Number(nec[rol] || 0);
          if (!cant) return;

          const asignados = asignaciones.filter(function (a) {
            if (a.date !== fStr) return false;
            if (a.role) {
              if (a.role !== rol) return false;
            } else {
              const emp = empleados.find(function (e) { return e.id === a.employeeId; });
              if (!emp || (emp.dept || '').toUpperCase() !== rol) return false;
            }
            if (a.shiftKey && a.shiftKey === cTurno) return true;
            if (!a.shiftKey && a.shiftName === nombreTurno) return true;
            return false;
          });

          if (asignados.length < cant) {
            const faltantes = cant - asignados.length;
            nuevasIncidencias.push(
              '⚠️ Turno sin cubrir: ' + fStr + ' (' + diaNom + ') · ' + nombreTurno + ' · ' + rol +
              ' (faltan ' + faltantes + (faltantes === 1 ? ' persona' : ' personas') + ')'
            );
          }
        });
      });
    });

    const horasAsignadas = {};
    empleados.forEach(function (e) { horasAsignadas[e.id] = 0; });
    asignaciones.forEach(function (a) {
      if (horasAsignadas[a.employeeId] !== undefined) {
        horasAsignadas[a.employeeId] += Number(a.hours) || 0;
      }
    });

    const numSemanas = Math.max(1, fechas.length / 7);
    const diasBasePeriodo = Number(confAjustes.diasLaborablesSemana || 6);

    empleados.forEach(function (emp) {
      if (!emp.active && !horasAsignadas[emp.id]) return;
      const horasSem = Number(emp.hours || 0);
      const contratoBase = horasSem * numSemanas;
      const dedFestivos = (horasSem / diasBasePeriodo) * numFestivos;
      const contratoPeriodo = redondearLocal(Math.max(0, contratoBase - dedFestivos));
      const trabajadas = redondearLocal(horasAsignadas[emp.id] || 0);
      const diferencia = redondearLocal(trabajadas - contratoPeriodo);

      if (diferencia > 4) {
        nuevasIncidencias.push(
          '⚠️ ' + emp.name + ': exceso de ' + diferencia + ' horas extra (' + trabajadas + 'h trabajadas vs ' + contratoPeriodo + 'h contrato).'
        );
      } else if (diferencia < -4) {
        nuevasIncidencias.push(
          '📉 ' + emp.name + ': déficit de ' + Math.abs(diferencia) + ' horas respecto al contrato (' + trabajadas + 'h trabajadas vs ' + contratoPeriodo + 'h contrato).'
        );
      }
    });

    return nuevasIncidencias;
  }

  function getBaseUrlLocal() {
    return window.location.href.split('?')[0].replace(/index\.html$/i, '');
  }

  // Motore di esecuzione locale per GitHub Pages
  window.ejecutarEnClienteLocal = function (nombreFuncion, args) {
    initStorageIfNeeded();

    switch (nombreFuncion) {
      case 'exportarSistemaCompleto': {
        const backup = {
          version: '1.0',
          fecha: new Date().toISOString(),
          empleados: getLocalJson(STORAGE_KEYS.EMPLEADOS, []),
          calendarios: getLocalJson(STORAGE_KEYS.CALENDARIOS, []),
          plantillas: getLocalJson(STORAGE_KEYS.PLANTILLAS, []),
          enlaces: getLocalJson(STORAGE_KEYS.ENLACES, []),
          ajustes: getLocalJson(STORAGE_KEYS.AJUSTES, {}),
          historialSaldos: getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, [])
        };
        return { ok: true, backup: backup };
      }

      case 'importarSistemaCompleto': {
        const datos = args[0] || {};
        if (datos.empleados) setLocalJson(STORAGE_KEYS.EMPLEADOS, datos.empleados);
        if (datos.calendarios) setLocalJson(STORAGE_KEYS.CALENDARIOS, datos.calendarios);
        if (datos.plantillas) setLocalJson(STORAGE_KEYS.PLANTILLAS, datos.plantillas);
        if (datos.enlaces) setLocalJson(STORAGE_KEYS.ENLACES, datos.enlaces);
        if (datos.ajustes) setLocalJson(STORAGE_KEYS.AJUSTES, datos.ajustes);
        if (datos.historialSaldos) setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, datos.historialSaldos);
        return { ok: true };
      }

      case 'obtenerDatosIniciales': {
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const enlaces = getLocalJson(STORAGE_KEYS.ENLACES, []);
        const ajustes = getLocalJson(STORAGE_KEYS.AJUSTES, { precioHoraExtra: 8.50, precioHoraFestiva: 11.60, diasLaborablesSemana: 6 });
        const plantillas = getLocalJson(STORAGE_KEYS.PLANTILLAS, []);

        const baseUrl = getBaseUrlLocal();
        enlaces.forEach(function (e) {
          e.url = baseUrl + (e.page === 'view_compensation' ? 'view.html?page=view_compensation&token=' : 'view.html?page=view_schedule&token=') + encodeURIComponent(e.token);
        });

        return {
          empleados: emps,
          calendarios: cals,
          enlaces: enlaces,
          plantillas: plantillas,
          ajustes: ajustes,
          urlApp: baseUrl,
          almacenamiento: calcularAlmacenamientoLocal()
        };
      }

      case 'obtenerCalendario': {
        const id = String(args[0]);
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const cal = cals.find(function (c) { return c.id === id; });
        if (!cal) throw new Error('Calendario no encontrado.');
        return cal;
      }

      case 'guardarAjustesTarifas': {
        const nuevos = args[1] || {};
        const ajustes = getLocalJson(STORAGE_KEYS.AJUSTES, {});
        if (nuevos.precioHoraExtra !== undefined) ajustes.precioHoraExtra = Math.max(0, Number(nuevos.precioHoraExtra) || 0);
        if (nuevos.precioHoraFestiva !== undefined) ajustes.precioHoraFestiva = Math.max(0, Number(nuevos.precioHoraFestiva) || 0);
        if (nuevos.diasLaborablesSemana !== undefined) ajustes.diasLaborablesSemana = Math.max(1, Number(nuevos.diasLaborablesSemana) || 6);
        setLocalJson(STORAGE_KEYS.AJUSTES, ajustes);
        return ajustes;
      }

      case 'guardarPrecioHoraExtra': {
        const p = args[1];
        return window.ejecutarEnClienteLocal('guardarAjustesTarifas', [null, { precioHoraExtra: p }]);
      }

      case 'obtenerResumenCompenso': {
        const calId = args[0];
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const cal = cals.find(function (c) { return c.id === calId; });
        if (!cal) throw new Error('Calendario no encontrado.');
        const aj = getLocalJson(STORAGE_KEYS.AJUSTES, { precioHoraExtra: 8.50, precioHoraFestiva: 11.60, diasLaborablesSemana: 6 });
        return {
          calendario: cal,
          empleados: calcularResumenCalendarioLocal(calId),
          precioHoraExtra: Number(aj.precioHoraExtra || 8.50),
          precioHoraFestiva: Number(aj.precioHoraFestiva || 11.60),
          diasLaborablesSemana: Number(aj.diasLaborablesSemana || 6)
        };
      }

      case 'calcularResumenCalendario': {
        return calcularResumenCalendarioLocal(args[0]);
      }

      case 'generarCalendario': {
        const datos = (args && args[1] && typeof args[1] === 'object') ? args[1] : (args && args[0] && typeof args[0] === 'object' ? args[0] : {});
        const fechas = obtenerFechasPeriodoLocal(datos.desde, datos.hasta);
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []).map(normalizeEmpleadoDeptsLocal).filter(function (e) { return e.active; });
        const asignaciones = [];
        const incidencias = [];
        const horasAsignadas = {};
        const numSemanasPeriodo = Math.ceil(fechas.length / 7);
        const cierres = Array.isArray(datos.cierres) ? datos.cierres : [];
        const diasOperativosSemana = [];
        for (let s = 0; s < numSemanasPeriodo; s++) {
          const iniS = s * 7;
          const finS = Math.min(fechas.length, iniS + 7);
          let op = 0;
          for (let f = iniS; f < finS; f++) {
            if (cierres.indexOf(fechas[f]) < 0) op++;
          }
          diasOperativosSemana[s] = op;
        }

        const diasTrabajadosSemana = {};
        emps.forEach(function (e) {
          horasAsignadas[e.id] = 0;
          diasTrabajadosSemana[e.id] = [];
          for (let s = 0; s < numSemanasPeriodo; s++) {
            diasTrabajadosSemana[e.id][s] = [];
          }
        });

        const turnos = datos.turnos || TURNOS_BASE;
        const clavesTurnos = Object.keys(turnos);

        fechas.forEach(function (fStr, idx) {
          const dObj = new Date(fStr + 'T12:00:00');
          const dayIdx = (dObj.getDay() + 6) % 7;
          const diaNom = DIAS[dayIdx];
          const numSemana = Math.floor(idx / 7);

          if (cierres.indexOf(fStr) >= 0) return;

          clavesTurnos.forEach(function (cTurno) {
            if (datos.turnosActivosPorDia && datos.turnosActivosPorDia[diaNom] && datos.turnosActivosPorDia[diaNom][cTurno] === false) {
              return;
            }

            const turnoObj = turnos[cTurno];
            // FIX-BUG2 + FIXES 3&4: Resolver horarios y necesidades efectivos (roles + excepciones)
            const efectivos = resolverHorariosEfectivosLocal(datos.horariosRoles, datos.necesidades, cTurno, fStr, diaNom, datos.excepciones);
            const nec = efectivos.necesidades || { COCINA: 1, PIZZERIA: 1, SALA: 2 };
            const horariosRolesFranja = efectivos.horarios || {};

            ['COCINA', 'PIZZERIA', 'SALA'].forEach(function (rol) {
              const cant = Number(nec[rol] || 0);
              if (!cant) return;

              // FIX-BUG2: Obtener inicio y fin específicos del rol
              const rolTiempos = horariosRolesFranja[rol] || {};
              const inicioRol = rolTiempos.inicio || turnoObj.inicio;
              const finRol    = rolTiempos.fin    || turnoObj.fin;
              const hIni = Number(inicioRol.split(':')[0]) + Number(inicioRol.split(':')[1]) / 60;
              let hFin = Number(finRol.split(':')[0]) + Number(finRol.split(':')[1]) / 60;
              if (hFin < hIni) hFin += 24;
              const duracion = redondearLocal(hFin - hIni);

              // FIX-BUG1: El empleado no puede haber sido asignado ya a esta misma fecha y franja (sea cual sea el rol)
              const eleggibili = emps.filter(function (e) {
                const depts = Array.isArray(e.depts) ? e.depts : [e.dept];
                const matchesRole = depts.indexOf(rol) >= 0;
                const matchesDay = !(e.exclDay && e.exclDay.indexOf(diaNom) >= 0);
                const matchesShift = !(e.exclShift && (e.exclShift.indexOf(turnoObj.nombre) >= 0 || e.exclShift.indexOf(cTurno) >= 0));
                const yaAsignadoEnTurno = asignaciones.some(function (a) {
                  return a.employeeId === e.id && a.date === fStr && a.shiftKey === cTurno;
                });
                if (!matchesRole || !matchesDay || !matchesShift || yaAsignadoEnTurno) return false;

                // F19: Controllo dei giorni liberi garantiti per settimana
                const diasTrabajados = (diasTrabajadosSemana[e.id] && diasTrabajadosSemana[e.id][numSemana]) || [];
                const yaTrabajaHoy = diasTrabajados.indexOf(fStr) >= 0;
                const diasLibresGarantizados = Math.min(6, Math.max(0, Number(e.diasLibres !== undefined && e.diasLibres !== null && e.diasLibres !== '' ? e.diasLibres : 1)));
                const diasOperativos = diasOperativosSemana[numSemana] !== undefined ? diasOperativosSemana[numSemana] : 6;
                const maxDiasPermitidos = Math.max(0, Math.min(diasOperativos, 7 - diasLibresGarantizados));

                if (!yaTrabajaHoy && diasTrabajados.length >= maxDiasPermitidos) {
                  return false;
                }
                return true;
              }).sort(function (a, b) {
                // 0. PRECEDENCIA RUOLO PRINCIPALE:
                const esPrincipalA = (a.rolPrincipal || a.dept) === rol;
                const esPrincipalB = (b.rolPrincipal || b.dept) === rol;
                if (esPrincipalA !== esPrincipalB) {
                  return esPrincipalA ? -1 : 1;
                }
                const hA = horasAsignadas[a.id] || 0;
                const hB = horasAsignadas[b.id] || 0;
                return hA - hB;
              });

              let asignados = 0;
              for (let i = 0; i < cant; i++) {
                if (!eleggibili.length) break;
                // Seleccionar un empleado elegible no asignado aún a este turno
                const emp = eleggibili.find(function(candidato) {
                  return !asignaciones.some(function(a) {
                    return a.employeeId === candidato.id && a.date === fStr && a.shiftKey === cTurno;
                  });
                });

                if (emp) {
                  asignaciones.push({
                    id: generarIdLocal(),
                    employeeId: emp.id,
                    date: fStr,
                    dayName: diaNom,
                    shiftKey: cTurno,
                    shiftName: turnoObj.nombre,
                    start: inicioRol,
                    end: finRol,
                    hours: duracion,
                    role: rol
                  });
                  horasAsignadas[emp.id] = (horasAsignadas[emp.id] || 0) + duracion;
                  if (diasTrabajadosSemana[emp.id] && diasTrabajadosSemana[emp.id][numSemana]) {
                    if (diasTrabajadosSemana[emp.id][numSemana].indexOf(fStr) < 0) {
                      diasTrabajadosSemana[emp.id][numSemana].push(fStr);
                    }
                  }
                  asignados++;
                }
              }

              if (asignados < cant) {
                const faltantes = cant - asignados;
                incidencias.push(
                  '⚠️ Turno sin cubrir: ' + fStr + ' (' + diaNom + ') · ' + turnoObj.nombre + ' · ' + rol +
                  ' (faltan ' + faltantes + (faltantes === 1 ? ' persona' : ' personas') + ')'
                );
              }
            });
          });
        });

        // FIX-BUG1: Deduplicación estricta de seguridad
        const vistas = {};
        for (let idx = asignaciones.length - 1; idx >= 0; idx--) {
          const a = asignaciones[idx];
          const clave = a.employeeId + '|' + a.date + '|' + (a.shiftKey || a.shiftName || '');
          if (vistas[clave]) {
            asignaciones.splice(idx, 1);
          } else {
            vistas[clave] = true;
          }
        }

        // F2 / Incidencias de horas extra y déficit por trabajador
        const numSemanas = Math.max(1, fechas.length / 7);
        const festivos = datos.festivos || [];
        const numFestivos = festivos.length;
        const diasBasePeriodo = Number((getLocalJson(STORAGE_KEYS.AJUSTES, {}).diasLaborablesSemana) || 6);

        emps.forEach(function (emp) {
          const horasSem = Number(emp.hours || 0);
          const contratoBase = horasSem * numSemanas;
          const dedFestivos = (horasSem / diasBasePeriodo) * numFestivos;
          const contratoPeriodo = redondearLocal(Math.max(0, contratoBase - dedFestivos));
          const trabajadas = redondearLocal(horasAsignadas[emp.id] || 0);
          const diferencia = redondearLocal(trabajadas - contratoPeriodo);

          if (diferencia > 4) {
            incidencias.push(
              '⚠️ ' + emp.name + ': exceso de ' + diferencia + ' horas extra (' + trabajadas + 'h trabajadas vs ' + contratoPeriodo + 'h contrato).'
            );
          } else if (diferencia < -4) {
            incidencias.push(
              '📉 ' + emp.name + ': déficit de ' + Math.abs(diferencia) + ' horas respecto al contrato (' + trabajadas + 'h trabajadas vs ' + contratoPeriodo + 'h contrato).'
            );
          }
        });

        const nuevoCal = {
          id: generarIdLocal(),
          nombre: datos.nombre || ('Calendario ' + datos.desde + ' a ' + datos.hasta),
          desde: datos.desde,
          hasta: datos.hasta,
          turnos: turnos,
          necesidades: datos.necesidades || {},
          horariosRoles: datos.horariosRoles || null,
          cierres: datos.cierres || [],
          festivos: datos.festivos || [],
          excepciones: datos.excepciones || [],
          turnosActivosPorDia: datos.turnosActivosPorDia || {},
          asignaciones: asignaciones,
          incidencias: incidencias,
          linksGenerados: false,
          enlacesIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        cals.unshift(nuevoCal);
        setLocalJson(STORAGE_KEYS.CALENDARIOS, cals);
        return nuevoCal;
      }

      case 'guardarCalendarioEditado': {
        const cal = args[1];
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const idx = cals.findIndex(function (c) { return c.id === cal.id; });
        if (idx < 0) throw new Error('Calendario no encontrado.');
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, EMPLEADOS_DEFAULT);
        const ajustes = getLocalJson(STORAGE_KEYS.AJUSTES, {});
        cal.incidencias = recalcularIncidenciasCalendarioLocal(cal, emps, ajustes);
        cal.updatedAt = new Date().toISOString();
        cals[idx] = cal;
        setLocalJson(STORAGE_KEYS.CALENDARIOS, cals);
        return { ok: true, calendario: cal };
      }

      case 'eliminarCalendario': {
        const id = args[1];
        let cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        cals = cals.filter(function (c) { return c.id !== id; });
        setLocalJson(STORAGE_KEYS.CALENDARIOS, cals);
        return { ok: true };
      }

      
      case 'guardarPlantilla': {
        const datos = (args && args[1] && typeof args[1] === 'object') ? args[1] : (args && args[0] && typeof args[0] === 'object' ? args[0] : {});
        if (!datos || !String(datos.nombre || '').trim()) {
          throw new Error('El nombre de la plantilla es obligatorio.');
        }
        const plantillas = getLocalJson(STORAGE_KEYS.PLANTILLAS, []);
        const id = String(datos.id || generarIdLocal());
        const idx = plantillas.findIndex(function (p) { return p.id === id; });
        const plantilla = {
          id: id,
          nombre: String(datos.nombre).trim(),
          turnos: datos.turnos || TURNOS_BASE,
          necesidades: datos.necesidades || { manana: { COCINA: 1, PIZZERIA: 0, SALA: 2 }, tarde: { COCINA: 1, PIZZERIA: 1, SALA: 2 }, cena: { COCINA: 1, PIZZERIA: 1, SALA: 3 } },
          horariosRoles: datos.horariosRoles || null,
          turnosActivosPorDia: datos.turnosActivosPorDia || {
            Lunes: { manana: true, tarde: true, cena: true },
            Martes: { manana: true, tarde: true, cena: true },
            Miércoles: { manana: true, tarde: true, cena: true },
            Jueves: { manana: true, tarde: true, cena: true },
            Viernes: { manana: true, tarde: true, cena: true },
            Sábado: { manana: true, tarde: true, cena: true },
            Domingo: { manana: true, tarde: true, cena: true }
          },
          excepciones: Array.isArray(datos.excepciones) ? datos.excepciones : [],
          createdAt: datos.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (idx >= 0) {
          plantillas[idx] = plantilla;
        } else {
          plantillas.push(plantilla);
        }
        setLocalJson(STORAGE_KEYS.PLANTILLAS, plantillas);
        return { ok: true, plantilla: plantilla };
      }

      case 'eliminarPlantilla': {
        const id = String((args && args[1]) || (args && args[0]) || '');
        const plantillas = getLocalJson(STORAGE_KEYS.PLANTILLAS, []);
        const restantes = plantillas.filter(function (p) { return p.id !== id; });
        if (restantes.length === plantillas.length) {
          throw new Error('Plantilla no encontrada.');
        }
        setLocalJson(STORAGE_KEYS.PLANTILLAS, restantes);
        return { ok: true };
      }

      case 'listarEmpleados': {
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        return emps.map(normalizeEmpleadoDeptsLocal);
      }

      case 'guardarEmpleado': {
        const datos = (args && typeof args[1] === 'object' && args[1] !== null) ? args[1] : (args && typeof args[0] === 'object' ? args[0] : {});
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const id = datos.id || generarIdLocal();

        const ROLES_VALIDOS = ['SALA', 'COCINA', 'PIZZERIA'];
        let depts = [];
        if (Array.isArray(datos.depts) && datos.depts.length > 0) {
          depts = datos.depts.filter(function(r) { return ROLES_VALIDOS.indexOf(r) >= 0; });
        } else if (datos.dept) {
          if (ROLES_VALIDOS.indexOf(datos.dept) >= 0) depts = [datos.dept];
        }
        if (!depts.length) depts = ['SALA'];

        const rolPrincipal = (datos.rolPrincipal && ROLES_VALIDOS.indexOf(datos.rolPrincipal) >= 0)
          ? datos.rolPrincipal
          : (depts[0] || 'SALA');
        const rolSecundario = (datos.rolSecundario && ROLES_VALIDOS.indexOf(datos.rolSecundario) >= 0 && datos.rolSecundario !== rolPrincipal)
          ? datos.rolSecundario
          : ((depts.length > 1 && depts[1] !== rolPrincipal) ? depts[1] : null);
        const diasLibres = Math.min(6, Math.max(0, Number(datos.diasLibres !== undefined && datos.diasLibres !== null && datos.diasLibres !== '' ? datos.diasLibres : 1)));

        const finalDepts = [rolPrincipal];
        if (rolSecundario) finalDepts.push(rolSecundario);

        const empObj = {
          id: id,
          name: String(datos.name || '').trim(),
          phone: String(datos.phone || '').trim(),
          email: String(datos.email || '').trim(),
          dept: rolPrincipal,
          rolPrincipal: rolPrincipal,
          rolSecundario: rolSecundario,
          depts: finalDepts,
          hours: Math.max(0, Number(datos.hours) || 40),
          maxHorasExtraSemana: (datos.maxHorasExtraSemana !== null && datos.maxHorasExtraSemana !== undefined && datos.maxHorasExtraSemana !== '' && !isNaN(Number(datos.maxHorasExtraSemana))) ? Math.max(0, Number(datos.maxHorasExtraSemana)) : null,
          saldoHorasAnterior: redondearLocal(Number(datos.saldoHorasAnterior || 0)),
          diasLibres: diasLibres,
          active: datos.active !== false,
          prefShift: Array.isArray(datos.prefShift) && datos.prefShift.length ? datos.prefShift : ['Cualquiera'],
          exclShift: Array.isArray(datos.exclShift) ? datos.exclShift : [],
          exclDay: Array.isArray(datos.exclDay) ? datos.exclDay : [],
          exclDayShift: Array.isArray(datos.exclDayShift) ? datos.exclDayShift : []
        };

        const idx = emps.findIndex(function (e) { return e.id === id; });
        if (idx >= 0) emps[idx] = empObj; else emps.push(empObj);
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
        return empObj;
      }

      case 'cambiarEstadoEmpleado': {
        const id = (args.length >= 2 && typeof args[0] === 'string' && (args[0].indexOf('tok_') === 0 || args[0].indexOf('session') === 0)) ? args[1] : (args[0] || args[1]);
        const activo = (args.length >= 3) ? args[2] : (args[1] !== undefined ? args[1] : true);
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const emp = emps.find(function(e) { return e.id === String(id); });
        if (!emp) throw new Error('Empleado no encontrado.');
        emp.active = Boolean(activo);
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
        return { ok: true, empleado: emp };
      }

      case 'eliminarEmpleado': {
        const id = args[1];
        let emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        emps = emps.filter(function (e) { return e.id !== id; });
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
        return { ok: true };
      }

      case 'guardarSaldoEmpleado': {
        const id = args[1];
        const saldo = Number(args[2]);
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const emp = emps.find(function (e) { return e.id === id; });
        if (emp) {
          const saldoAnterior = Number(emp.saldoHorasAnterior || 0);
          emp.saldoHorasAnterior = redondearLocal(saldo);
          setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);

          const historial = getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
          historial.push({
            id: generarIdLocal(),
            employeeId: emp.id,
            employeeName: emp.name,
            calendarId: null,
            calendarName: 'Ajuste manual admin',
            compensationId: null,
            periodo: 'Ajuste directo',
            contractHours: Number(emp.hours || 0),
            workedHours: 0,
            saldoAnterior: saldoAnterior,
            saldoPeriodo: 0,
            ajusteManual: redondearLocal(saldo - saldoAnterior),
            finalExtraHours: 0,
            saldoResultante: redondearLocal(saldo),
            tipo: saldo > 0 ? 'DEFICIT' : (saldo < 0 ? 'CREDITO' : 'AL_DIA'),
            origen: 'Ajuste rápido de saldo (✏️)',
            createdAt: new Date().toISOString()
          });
          setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, historial);
        }
        return { ok: true, saldoResultante: redondearLocal(saldo) };
      }

      case 'consolidarSaldosCalendario': {
        const calId = (args.length >= 2 && typeof args[0] === 'string' && (args[0].indexOf('tok_') === 0 || args[0].indexOf('session') === 0)) ? args[1] : (args[0] || args[1]);
        const empIdTarget = (args.length >= 2 && typeof args[0] === 'string' && (args[0].indexOf('tok_') === 0 || args[0].indexOf('session') === 0)) ? (args[2] || null) : (args[1] || null);
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const cal = cals.find(function (c) { return c.id === calId; });
        if (!cal) throw new Error('Calendario no encontrado.');

        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const resumenes = calcularResumenCalendarioLocal(cal.id);
        const historial = getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
        let actualizados = 0;

        resumenes.forEach(function (res) {
          if (empIdTarget && res.employeeId !== empIdTarget) return;

          const emp = emps.find(function (e) { return e.id === res.employeeId; });
          if (!emp) return;

          const saldoAnt = redondearLocal(Number(emp.saldoHorasAnterior || 0));
          const contractHoursEfectivas = redondearLocal(Number(res.contractHoursEfectivas || Math.max(0, res.contractHours + saldoAnt)));
          const difPeriodo = redondearLocal(Number(res.workedHours) - contractHoursEfectivas);
          
          // Si difPeriodo < 0, trabajó menos horas de las requeridas: queda debiendo la diferencia.
          // Si difPeriodo >= 0, completó sus horas y cubrió cualquier saldo pendiente: saldo 0.
          const nuevoSaldo = redondearLocal(difPeriodo < 0 ? Math.abs(difPeriodo) : 0);

          emp.saldoHorasAnterior = nuevoSaldo;

          // Si ya existe un registro consolidado para este empleado y calendario, lo actualizamos
          const idxHist = historial.findIndex(function (h) {
            return h.calendarId === cal.id && h.employeeId === emp.id && h.origen && h.origen.indexOf('Consolidación') >= 0;
          });

          const reg = {
            id: idxHist >= 0 ? historial[idxHist].id : generarIdLocal(),
            employeeId: emp.id,
            employeeName: emp.name,
            calendarId: cal.id,
            calendarName: cal.nombre,
            compensationId: null,
            periodo: cal.desde + ' - ' + cal.hasta,
            contractHours: res.contractHours,
            contractHoursEfectivas: contractHoursEfectivas,
            workedHours: res.workedHours,
            workedFestiveHours: res.workedFestiveHours || 0,
            saldoAnterior: saldoAnt,
            saldoPeriodo: res.saldoPeriodo || 0,
            ajusteManual: 0,
            finalExtraHours: res.extraHours || 0,
            saldoResultante: nuevoSaldo,
            tipo: nuevoSaldo > 0 ? 'DEFICIT' : (nuevoSaldo < 0 ? 'CREDITO' : 'AL_DIA'),
            origen: 'Consolidación de saldos del calendario ' + cal.nombre,
            createdAt: new Date().toISOString()
          };

          if (idxHist >= 0) {
            historial[idxHist] = reg;
          } else {
            historial.push(reg);
          }
          actualizados++;
        });

        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, historial);
        return { ok: true, actualizados: actualizados };
      }

      case 'generarReciboCompenso': {
        const datos = (args && args[1] && typeof args[1] === 'object') ? args[1] : (args && args[0] && typeof args[0] === 'object' ? args[0] : {});
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const cal = cals.find(function (c) { return c.id === datos.calendarId; });
        if (!cal) throw new Error('Por favor selecciona un calendario válido.');

        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const emp = emps.find(function (e) { return e.id === datos.employeeId; });
        if (!emp) throw new Error('Empleado no encontrado.');

        const resumenes = calcularResumenCalendarioLocal(cal.id);
        const resumen = resumenes.find(function (r) { return r.employeeId === emp.id; }) || {
          contractHours: emp.hours || 40,
          contractHoursBase: emp.hours || 40,
          giorniLavorativiBase: 6,
          oreGiornaliereBase: (emp.hours || 40) / 6,
          festivosDeduction: 0,
          festivosCount: 0,
          festivos: [],
          workedHours: 0,
          workedFestiveHours: 0,
          extraHours: 0,
          saldoHorasAnterior: emp.saldoHorasAnterior || 0,
          saldoPeriodo: 0,
          saldoTotalAcumulado: emp.saldoHorasAnterior || 0,
          desgloseSemanas: []
        };

        const ajustes = getLocalJson(STORAGE_KEYS.AJUSTES, {});
        const pNorm = Number(datos.pricePerHour !== undefined ? datos.pricePerHour : (ajustes.precioHoraExtra || 8.50));
        const pFest = Number(datos.pricePerFestiveHour !== undefined ? datos.pricePerFestiveHour : (ajustes.precioHoraFestiva || 11.60));

        const adj = Number(datos.manualAdjustment || 0);
        const finalOrd = Math.max(0, redondearLocal((resumen.extraHours || 0) + adj));
        const finalFest = redondearLocal(resumen.workedFestiveHours || 0);
        const compOrd = redondear2DecLocal(finalOrd * pNorm);
        const compFest = redondear2DecLocal(finalFest * pFest);
        const tot = redondear2DecLocal(compOrd + compFest);

        const compId = generarIdLocal();
        const token = 'tok_' + Math.random().toString(36).substring(2, 12);

        const compObj = {
          id: compId,
          calendarId: cal.id,
          employeeId: emp.id,
          employeeName: emp.name,
          employeePhone: emp.phone,
          periodo: cal.desde + ' - ' + cal.hasta,
          contractHours: resumen.contractHours,
          contractHoursBase: resumen.contractHoursBase,
          giorniLavorativiBase: resumen.giorniLavorativiBase || 6,
          oreGiornaliereBase: resumen.oreGiornaliereBase,
          festivosDeduction: resumen.festivosDeduction || 0,
          festivosCount: resumen.festivosCount || 0,
          festivos: resumen.festivos || [],
          workedHours: resumen.workedHours || 0,
          workedFestiveHours: finalFest,
          saldoHorasAnterior: resumen.saldoHorasAnterior || 0,
          saldoPeriodo: resumen.saldoPeriodo || 0,
          saldoTotalAcumulado: resumen.saldoTotalAcumulado || 0,
          automaticExtraHours: resumen.extraHours || 0,
          manualAdjustment: adj,
          finalExtraHours: finalOrd,
          pricePerHour: pNorm,
          pricePerFestiveHour: pFest,
          compensoExtraOrdinario: compOrd,
          compensoFestivo: compFest,
          totalAmount: tot,
          desgloseSemanas: resumen.desgloseSemanas || [],
          justification: datos.justification || '',
          createdAt: new Date().toISOString()
        };

        const saldoAnt = redondearLocal(Number(emp.saldoHorasAnterior || 0));
        const contractHoursEfectivas = Number(resumen.contractHoursEfectivas || (resumen.contractHours + saldoAnt));
        const difPeriodo = redondearLocal(resumen.workedHours - contractHoursEfectivas);
        const saldoRestante = redondearLocal(difPeriodo < 0 ? Math.abs(difPeriodo) : (adj < 0 ? Math.abs(adj) : 0));
        compObj.saldoRestante = saldoRestante;
        compObj.contractHoursEfectivas = contractHoursEfectivas;

        const compensos = getLocalJson(STORAGE_KEYS.COMPENSOS, []);
        compensos.push(compObj);
        setLocalJson(STORAGE_KEYS.COMPENSOS, compensos);

        emp.saldoHorasAnterior = saldoRestante;
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);

        const baseUrl = getBaseUrlLocal();
        const diasVal = Number(datos.validDays || 15);
        const enlaceObj = {
          id: generarIdLocal(),
          token: token,
          name: 'Compenso - ' + emp.name + ' - ' + cal.nombre,
          type: 'Recibo Compensación',
          page: 'view_compensation',
          calendarId: cal.id,
          compensationId: compId,
          employeeId: emp.id,
          employeeName: emp.name,
          phone: emp.phone,
          active: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + diasVal * 86400000).toISOString(),
          url: baseUrl + 'view.html?page=view_compensation&token=' + encodeURIComponent(token)
        };

        const enlaces = getLocalJson(STORAGE_KEYS.ENLACES, []);
        enlaces.push(enlaceObj);
        setLocalJson(STORAGE_KEYS.ENLACES, enlaces);
        const historial = getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
        historial.push({
          id: generarIdLocal(),
          employeeId: emp.id,
          employeeName: emp.name,
          calendarId: cal.id,
          calendarName: cal.nombre,
          compensationId: compId,
          periodo: cal.desde + ' - ' + cal.hasta,
          contractHours: resumen.contractHours,
          contractHoursEfectivas: contractHoursEfectivas,
          workedHours: resumen.workedHours,
          workedFestiveHours: finalFest,
          saldoAnterior: saldoAnt,
          saldoPeriodo: resumen.saldoPeriodo || 0,
          ajusteManual: adj,
          finalExtraHours: finalOrd,
          saldoResultante: saldoRestante,
          tipo: saldoRestante > 0 ? 'DEFICIT' : 'AL_DIA',
          origen: 'Generación de recibo de compenso Hosteleria',
          createdAt: new Date().toISOString()
        });
        setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, historial);


        return { ok: true, compensacion: compObj, enlace: enlaceObj };
      }

      case 'crearEnlacesCalendario': {
        const calId = args[1];
        const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
        const cal = cals.find(function (c) { return c.id === calId; });
        if (!cal) throw new Error('Calendario no encontrado.');

        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []).filter(function (e) { return e.active; });
        const enlaces = getLocalJson(STORAGE_KEYS.ENLACES, []);
        const baseUrl = getBaseUrlLocal();

        const tokenGen = 'tok_' + Math.random().toString(36).substring(2, 12);
        const enGen = {
          id: generarIdLocal(),
          token: tokenGen,
          name: 'Calendario general - ' + cal.nombre,
          type: 'Calendario General',
          page: 'view_schedule',
          calendarId: cal.id,
          employeeId: '',
          employeeName: 'Administración',
          active: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 45 * 86400000).toISOString()
        };
        enlaces.push(enGen);

        emps.forEach(function (emp) {
          const tInd = 'tok_' + Math.random().toString(36).substring(2, 12);
          enlaces.push({
            id: generarIdLocal(),
            token: tInd,
            name: 'Turnos - ' + emp.name + ' - ' + cal.nombre,
            type: 'Calendario Individual',
            page: 'view_schedule',
            calendarId: cal.id,
            employeeId: emp.id,
            employeeName: emp.name,
            phone: emp.phone,
            active: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 45 * 86400000).toISOString()
          });
        });

        cal.linksGenerados = true;
        setLocalJson(STORAGE_KEYS.CALENDARIOS, cals);
        setLocalJson(STORAGE_KEYS.ENLACES, enlaces);

        return {
          ok: true,
          total: emps.length + 1,
          urlGeneral: baseUrl + 'view.html?page=view_schedule&token=' + encodeURIComponent(tokenGen)
        };
      }

      case 'eliminarEnlace': {
        const id = args[1];
        let enlaces = getLocalJson(STORAGE_KEYS.ENLACES, []);
        enlaces = enlaces.filter(function (e) { return e.id !== id; });
        setLocalJson(STORAGE_KEYS.ENLACES, enlaces);
        return { ok: true };
      }

      case 'eliminarEnlaces': {
        const ids = args[1] || [];
        let enlaces = getLocalJson(STORAGE_KEYS.ENLACES, []);
        enlaces = enlaces.filter(function (e) { return ids.indexOf(e.id) < 0; });
        setLocalJson(STORAGE_KEYS.ENLACES, enlaces);
        return { ok: true };
      }

      case 'eliminarCompensacion': {
        const compId = args[1];
        let compensos = getLocalJson(STORAGE_KEYS.COMPENSOS, []);
        compensos = compensos.filter(function (c) { return c.id !== compId; });
        setLocalJson(STORAGE_KEYS.COMPENSOS, compensos);
        return { ok: true };
      }

      case 'obtenerVistaPublica': {
        const pagina = args[0];
        const token = args[1];
        const enlaces = getLocalJson(STORAGE_KEYS.ENLACES, []);
        const enlace = enlaces.find(function (e) { return e.token === token; });
        if (!enlace) return { ok: false, motivo: 'El enlace no existe o es inválido.' };

        if (pagina === 'view_schedule') {
          const cals = getLocalJson(STORAGE_KEYS.CALENDARIOS, []);
          const cal = cals.find(function (c) { return c.id === enlace.calendarId; });
          if (!cal) return { ok: false, motivo: 'Calendario no encontrado.' };

          const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
          let empsVis = emps;
          let asigsVis = cal.asignaciones || [];

          if (enlace.type === 'Calendario Individual') {
            empsVis = emps.filter(function (e) { return e.id === enlace.employeeId; });
            asigsVis = asigsVis.filter(function (a) { return a.employeeId === enlace.employeeId; });
          }

          return {
            ok: true,
            tipo: 'horario',
            enlace: { nombre: enlace.name, tipo: enlace.type },
            calendario: {
              id: cal.id,
              nombre: cal.nombre,
              desde: cal.desde,
              hasta: cal.hasta,
              turnos: cal.turnos || TURNOS_BASE,
              cierres: cal.cierres || [],
              festivos: cal.festivos || []
            },
            empleados: empsVis,
            asignaciones: asigsVis,
            resumen: calcularResumenCalendarioLocal(cal.id).filter(function (r) {
              return enlace.type === 'Calendario General' || r.employeeId === enlace.employeeId;
            })
          };
        }

        const compensos = getLocalJson(STORAGE_KEYS.COMPENSOS, []);
        const comp = compensos.find(function (c) { return c.id === enlace.compensationId; });
        if (!comp) return { ok: false, motivo: 'Recibo no encontrado.' };

        return {
          ok: true,
          tipo: 'compensacion',
          enlace: { nombre: enlace.name },
          compensacion: comp
        };
      }

      case 'existeContrasenaAdmin':
        return Boolean(localStorage.getItem(STORAGE_KEYS.ADMIN_PASS));

      case 'iniciarSesionAdmin': {
        const passIntroducida = String((args && args[0]) || '').trim();
        const passGuardada = localStorage.getItem(STORAGE_KEYS.ADMIN_PASS);
        if (!passGuardada) {
          if (passIntroducida.length < 6) {
            throw new Error('Configura una contraseña de al menos 6 caracteres.');
          }
          localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, passIntroducida);
          return { token: 'session_local_gh_pages', primerUso: true };
        }
        if (passIntroducida !== passGuardada) {
          throw new Error('Contraseña de administrador incorrecta.');
        }
        return { token: 'session_local_gh_pages' };
      }

      case 'configurarContrasenaAdmin': {
        const passNueva = String((args && (args[1] || args[0])) || '').trim();
        if (passNueva.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, passNueva);
        return { token: 'session_local_gh_pages', ok: true };
      }

      case 'cerrarSesionAdmin':
        return { ok: true };

      case 'listarHistorialSaldos': {
        return {
          ok: true,
          historial: getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []),
          empleados: getLocalJson(STORAGE_KEYS.EMPLEADOS, [])
        };
      }

      case 'guardarAjusteManualSaldo': {
        const datos = (args && args[1] && typeof args[1] === 'object') ? args[1] : (args && args[0] && typeof args[0] === 'object' ? args[0] : {});
        if (!datos || !datos.employeeId) throw new Error('Empleado no especificado.');
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const emp = emps.find(function (e) { return e.id === String(datos.employeeId); });
        if (!emp) throw new Error('Empleado no encontrado.');

        const nuevoSaldo = redondearLocal(Number(datos.nuevoSaldo || 0));
        const saldoAnterior = Number(emp.saldoHorasAnterior || 0);
        emp.saldoHorasAnterior = nuevoSaldo;
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);

        const historial = getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
        historial.push({
          id: generarIdLocal(),
          employeeId: emp.id,
          employeeName: emp.name,
          calendarId: null,
          calendarName: 'Ajuste Manual Admin',
          compensationId: null,
          periodo: datos.periodo || 'Ajuste Manual',
          contractHours: Number(emp.hours || 0),
          workedHours: 0,
          saldoAnterior: saldoAnterior,
          saldoPeriodo: 0,
          ajusteManual: redondearLocal(nuevoSaldo - saldoAnterior),
          finalExtraHours: 0,
          saldoResultante: nuevoSaldo,
          tipo: nuevoSaldo > 0 ? 'DEFICIT' : (nuevoSaldo < 0 ? 'CREDITO' : 'AL_DIA'),
          origen: String(datos.nota || 'Ajuste manual del administrador').trim(),
          createdAt: new Date().toISOString()
        });
        setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, historial);

        return { ok: true, saldoResultante: nuevoSaldo };
      }

      case 'eliminarRegistroSaldo': {
        const registroId = String((args && args[1]) || (args && args[0]) || '');
        const historial = getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
        const restantes = historial.filter(function (h) { return h.id !== registroId; });
        setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, restantes);
        return { ok: true };
      }

      case 'restablecerTodosSaldos': {
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        emps.forEach(function (e) { e.saldoHorasAnterior = 0; });
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);

        const historial = getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);
        historial.push({
          id: generarIdLocal(),
          employeeId: '',
          employeeName: 'TODOS',
          calendarId: null,
          calendarName: 'Restablecimiento general',
          compensationId: null,
          periodo: 'Todos los períodos',
          contractHours: 0,
          workedHours: 0,
          saldoAnterior: 0,
          saldoPeriodo: 0,
          ajusteManual: 0,
          finalExtraHours: 0,
          saldoResultante: 0,
          tipo: 'NEUTRO',
          origen: 'Restablecimiento general a 0h por admin',
          createdAt: new Date().toISOString()
        });
        setLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, historial);
        return { ok: true };
      }

      default:
        console.warn('Función no mapeata localmente:', nombreFuncion);
        return { ok: true };
    }
  };

  initStorageIfNeeded();
})(window);
