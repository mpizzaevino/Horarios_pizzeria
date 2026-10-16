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
    ADMIN_SESSION: 'MPV_ADMIN_SESSION'
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
      depts: ['SALA'],
      hours: 40,
      active: true,
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
      depts: ['PIZZERIA'],
      hours: 40,
      active: true,
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
      depts: ['COCINA'],
      hours: 40,
      active: true,
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
      depts: ['SALA'],
      hours: 40,
      active: true,
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
      depts: ['SALA'],
      hours: 40,
      active: false,
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
      depts: ['SALA'],
      hours: 40,
      active: true,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

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
    const empsGuardados = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
    // Si no hay empleados o solo estaban los 3 empleados de prueba iniciales, cargar la lista oficial
    if (!empsGuardados || empsGuardados.length === 0 || empsGuardados.some(e => e.name === 'Marcellino')) {
      setLocalJson(STORAGE_KEYS.EMPLEADOS, EMPLEADOS_DEFAULT);
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
    const plantillasGuardadas = getLocalJson(STORAGE_KEYS.PLANTILLAS, []);
    if (!plantillasGuardadas || plantillasGuardadas.length === 0) {
      setLocalJson(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_DEFAULT);
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
    const oreDovute = redondearLocal(Math.max(0, cOre - (gFest * oreBase)));
    const extraTot = redondearLocal(totLav - oreDovute);
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
        totDeduccionFest += (resSem.giorniFestiviConteggiati * resSem.oreGiornaliereBase);
        totContractHours += resSem.oreDovuteSettimana;
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
      const totFinalComp = redondear2DecLocal(totCompOrd + totCompFest);

      const saldoAnt = redondearLocal(Number(emp.saldoHorasAnterior || 0));
      const saldoPer = totExtraTot;
      const saldoTotAcum = redondearLocal(saldoPer + saldoAnt);

      const roleList = (Array.isArray(emp.depts) && emp.depts.length) ? emp.depts.join(', ') : (emp.dept || '');

      resumen.push({
        employeeId: emp.id,
        employeeName: emp.name,
        role: roleList,
        contractHours: totContractHours,
        contractHoursBase: totContractBase,
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
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []).filter(function (e) { return e.active; });
        const asignaciones = [];
        const incidencias = [];
        const horasAsignadas = {};
        emps.forEach(function (e) { horasAsignadas[e.id] = 0; });

        const turnos = datos.turnos || TURNOS_BASE;
        const clavesTurnos = Object.keys(turnos);

        fechas.forEach(function (fStr, idx) {
          const dObj = new Date(fStr + 'T12:00:00');
          const dayIdx = (dObj.getDay() + 6) % 7;
          const diaNom = DIAS[dayIdx];

          if (datos.cierres && datos.cierres.indexOf(fStr) >= 0) return;

          clavesTurnos.forEach(function (cTurno) {
            if (datos.turnosActivosPorDia && datos.turnosActivosPorDia[diaNom] && datos.turnosActivosPorDia[diaNom][cTurno] === false) {
              return;
            }

            const turnoObj = turnos[cTurno];
            const nec = (datos.necesidades && datos.necesidades[cTurno]) || { COCINA: 1, PIZZERIA: 1, SALA: 2 };

            const hIni = Number(turnoObj.inicio.split(':')[0]) + Number(turnoObj.inicio.split(':')[1]) / 60;
            let hFin = Number(turnoObj.fin.split(':')[0]) + Number(turnoObj.fin.split(':')[1]) / 60;
            if (hFin < hIni) hFin += 24;
            const duracion = redondearLocal(hFin - hIni);

            Object.keys(nec).forEach(function (rol) {
              const cant = nec[rol] || 0;
              const eleggibili = emps.filter(function (e) {
                const depts = Array.isArray(e.depts) ? e.depts : [e.dept];
                const matchesRole = depts.indexOf(rol) >= 0;
                const matchesDay = !(e.exclDay && e.exclDay.indexOf(diaNom) >= 0);
                const matchesShift = !(e.exclShift && (e.exclShift.indexOf(turnoObj.nombre) >= 0 || e.exclShift.indexOf(cTurno) >= 0));
                return matchesRole && matchesDay && matchesShift;
              });

              let asignados = 0;
              for (let i = 0; i < cant; i++) {
                const emp = eleggibili[(idx + i) % Math.max(1, eleggibili.length)];
                if (emp) {
                  asignaciones.push({
                    id: generarIdLocal(),
                    employeeId: emp.id,
                    date: fStr,
                    dayName: diaNom,
                    shiftKey: cTurno,
                    shiftName: turnoObj.nombre,
                    start: turnoObj.inicio,
                    end: turnoObj.fin,
                    hours: duracion,
                    role: rol
                  });
                  horasAsignadas[emp.id] = (horasAsignadas[emp.id] || 0) + duracion;
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
          cierres: datos.cierres || [],
          festivos: datos.festivos || [],
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

      case 'guardarEmpleado': {
        const datos = args[1];
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const id = datos.id || generarIdLocal();
        const depts = Array.isArray(datos.depts) ? datos.depts : [datos.dept || 'SALA'];

        const empObj = {
          id: id,
          name: datos.name,
          phone: datos.phone || '',
          email: datos.email || '',
          dept: depts[0] || 'SALA',
          depts: depts,
          hours: Math.max(0, Number(datos.hours) || 40),
          maxHorasExtraSemana: datos.maxHorasExtraSemana ? Number(datos.maxHorasExtraSemana) : null,
          saldoHorasAnterior: redondearLocal(Number(datos.saldoHorasAnterior || 0)),
          active: datos.active !== false,
          prefShift: datos.prefShift || ['Cualquiera'],
          exclShift: datos.exclShift || [],
          exclDay: datos.exclDay || []
        };

        const idx = emps.findIndex(function (e) { return e.id === id; });
        if (idx >= 0) emps[idx] = empObj; else emps.push(empObj);
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        return empObj;
      }

      case 'eliminarEmpleado': {
        const id = args[1];
        let emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        emps = emps.filter(function (e) { return e.id !== id; });
        setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        return { ok: true };
      }

      case 'guardarSaldoEmpleado': {
        const id = args[1];
        const saldo = Number(args[2]);
        const emps = getLocalJson(STORAGE_KEYS.EMPLEADOS, []);
        const emp = emps.find(function (e) { return e.id === id; });
        if (emp) {
          emp.saldoHorasAnterior = redondearLocal(saldo);
          setLocalJson(STORAGE_KEYS.EMPLEADOS, emps);
        }
        return { ok: true };
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

        const saldoRestante = redondearLocal(((resumen.saldoTotalAcumulado || 0) + adj) - finalOrd);
        compObj.saldoRestante = saldoRestante;

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

      case 'listarHistorialSaldos':
        return getLocalJson(STORAGE_KEYS.HISTORIAL_SALDOS, []);

      default:
        console.warn('Función no mapeata localmente:', nombreFuncion);
        return { ok: true };
    }
  };

  initStorageIfNeeded();
})(window);
