/**
 * Test unitario ufficiale dell\'algoritmo matematico per orari nel settore Hosteleria.
 * Valida rigorosamente la ripartizione settimanale (Lun-Dom) e i 5 passi matematici.
 */

function redondearMezzora(h) {
  return Math.round((Number(h) || 0) * 2) / 2;
}

function redondear2Decimali(val) {
  return Math.round(((Number(val) || 0) + Number.EPSILON) * 100) / 100;
}

function calcolaSettimanaHosteleria(parametri) {
  // Parametri Dinamici (MAI VALORI FISSI)
  const Contratto_Ore_Settimana = Number(parametri.contrattoOreSettimana || 0);
  const Giorni_Lavorativi_Base = Number(parametri.giorniLavorativiBase || 6);
  const Tariffa_Ora_Extra_Normale = Number(parametri.tariffaOraExtraNormale !== undefined ? parametri.tariffaOraExtraNormale : 8.50);
  const Tariffa_Ora_Festiva = Number(parametri.tariffaOraFestiva !== undefined ? parametri.tariffaOraFestiva : 11.60);

  // Passo 1: Determinare la Giornata Ordinaria Teorica
  const Ore_Giornaliere_Base = redondearMezzora(Contratto_Ore_Settimana / Giorni_Lavorativi_Base);

  // Passo 2: Gestione dei Giorni Festivi Infrasettimanali e Rideterminazione dell\'Obiettivo (Ore Nomina)
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

  Totale_Ore_Lavorate = redondearMezzora(Totale_Ore_Lavorate);
  Ore_Festive_Lavorate = redondearMezzora(Ore_Festive_Lavorate);

  const Ore_Dovute_Settimana = redondearMezzora(Math.max(0, Contratto_Ore_Settimana - (Giorni_Festivi_Conteggiati * Ore_Giornaliere_Base)));

  // Passo 3: Conteggio delle Ore Effettivamente Lavorate e Individuazione del Saldo Extra Totale
  const Ore_Extra_Totali = redondearMezzora(Totale_Ore_Lavorate - Ore_Dovute_Settimana);

  // Passo 4: Disaccoppiamento e Ripartizione delle Ore Extra (Ordinarie vs Festive)
  const Ore_Extra_Ordinarie = redondearMezzora(Math.max(0, Ore_Extra_Totali - Ore_Festive_Lavorate));

  // Passo 5: Calcolo del Compenso Economico Finale
  const Compenso_Extra_Ordinario = redondear2Decimali(Ore_Extra_Ordinarie * Tariffa_Ora_Extra_Normale);
  const Compenso_Festivo = redondear2Decimali(Ore_Festive_Lavorate * Tariffa_Ora_Festiva);
  const TOTALE_COMPENSO_EXTRA = redondear2Decimali(Compenso_Extra_Ordinario + Compenso_Festivo);

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

// CASO DI TEST SPECIFICATO NEL PROMPT:
console.log('=====================================================');
console.log('ESECUZIONE UNIT TEST: ALGORITMO ORE EXTRA & FESTIVI');
console.log('=====================================================');

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

const risultato = calcolaSettimanaHosteleria(testInput);

const verifiche = [
  { desc: '1. Ore_Giornaliere_Base = 30 / 6 = 5.0 ore', ottenuto: risultato.oreGiornaliereBase, atteso: 5.0 },
  { desc: '2. Giorni_Festivi_Conteggiati = 1', ottenuto: risultato.giorniFestiviConteggiati, atteso: 1 },
  { desc: '3. Ore_Dovute_Settimana (H_NOMINA) = 30 - (1 * 5.0) = 25.0 ore', ottenuto: risultato.oreDovuteSettimana, atteso: 25.0 },
  { desc: '4. Ore_Extra_Totali = 32.5 - 25.0 = 7.5 ore', ottenuto: risultato.oreExtraTotali, atteso: 7.5 },
  { desc: '5. Ore_Festive_Lavorate = 5.0 ore (fatte di Lunedì)', ottenuto: risultato.oreFestiveLavorate, atteso: 5.0 },
  { desc: '6. Ore_Extra_Ordinarie = 7.5 - 5.0 = 2.5 ore', ottenuto: risultato.oreExtraOrdinarie, atteso: 2.5 },
  { desc: '7. TOTALE_COMPENSO_EXTRA = (2.5 * 8.50) + (5.0 * 11.60) = 79.25 €', ottenuto: risultato.totaleCompensoExtra, atteso: 79.25 }
];

let superati = 0;
verifiche.forEach(v => {
  const ok = Math.abs(v.ottenuto - v.atteso) < 0.001;
  if (ok) superati++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + v.desc + ' -> Ottenuto: ' + v.ottenuto);
});

console.log('-----------------------------------------------------');
console.log('Totale test superati: ' + superati + ' / ' + verifiche.length);
if (superati === verifiche.length) {
  console.log('TUTTI I TEST SONO STATI SUPERATI CON SUCCESSO!');
} else {
  console.error('ALCUNI TEST HANNO FALLITO!');
  process.exit(1);
}



// =====================================================
// UNIT TEST AGGIUNTIVI: PUNTO 4 CORREZIONI COMPENSO (AJUSTE & DÉBITO)
// =====================================================
console.log('\n=====================================================');
console.log('UNIT TEST: PUNTO 4 - AJUSTE ORE EXTRA & DEDUZIONE DEBITO');
console.log('=====================================================');

function calcolaAjusteCompenso(debitoActual, extraActual, ajusteManual) {
  const debito = Math.max(0, Number(debitoActual || 0));
  const extra = Math.max(0, Number(extraActual || 0));
  const ajuste = Number(ajusteManual || 0);

  let horasDeducidasDebito = 0;
  let saldoRestanteDebito = debito;
  let horasFinalesOrdinarie = extra;

  if (ajuste > 0) {
    if (debito > 0) {
      horasDeducidasDebito = Math.min(ajuste, debito);
      saldoRestanteDebito = Math.round((debito - horasDeducidasDebito) * 100) / 100;
      const sobranteExtra = Math.round((ajuste - horasDeducidasDebito) * 100) / 100;
      horasFinalesOrdinarie = Math.round((extra + sobranteExtra) * 100) / 100;
    } else {
      horasFinalesOrdinarie = Math.round((extra + ajuste) * 100) / 100;
      saldoRestanteDebito = 0;
    }
  } else if (ajuste < 0) {
    const absAjuste = Math.abs(ajuste);
    if (extra >= absAjuste) {
      horasFinalesOrdinarie = Math.round((extra - absAjuste) * 100) / 100;
    } else {
      horasFinalesOrdinarie = 0;
      const deficitExtra = Math.round((absAjuste - extra) * 100) / 100;
      saldoRestanteDebito = Math.round((debito + deficitExtra) * 100) / 100;
    }
  }

  return {
    horasFinalesOrdinarie: horasFinalesOrdinarie,
    saldoRestanteDebito: saldoRestanteDebito,
    horasDeducidasDebito: horasDeducidasDebito
  };
}

const testCasesAjuste = [
  {
    nome: 'Debito 3h, ajuste +1h -> 1h detratta dal debito, debito residuo 2h, 0h extra pagate',
    input: [3, 0, 1],
    atteso: { horasFinalesOrdinarie: 0, saldoRestanteDebito: 2, horasDeducidasDebito: 1 }
  },
  {
    nome: 'Debito 3h, ajuste +3h -> 3h detratte dal debito, debito azzerato (0h), 0h extra pagate',
    input: [3, 0, 3],
    atteso: { horasFinalesOrdinarie: 0, saldoRestanteDebito: 0, horasDeducidasDebito: 3 }
  },
  {
    nome: 'Debito 3h, ajuste +5h -> 3h azzerano il debito, le 2h eccedenti vanno a ore extra pagate',
    input: [3, 0, 5],
    atteso: { horasFinalesOrdinarie: 2, saldoRestanteDebito: 0, horasDeducidasDebito: 3 }
  },
  {
    nome: 'Debito 0h, ore extra 2h, ajuste +1.5h -> si somma direttamente alle ore extra (3.5h pagate)',
    input: [0, 2, 1.5],
    atteso: { horasFinalesOrdinarie: 3.5, saldoRestanteDebito: 0, horasDeducidasDebito: 0 }
  },
  {
    nome: 'Debito 0h, ore extra 0h, ajuste +2h -> si aggiungono 2h alle ore extra pagate',
    input: [0, 0, 2],
    atteso: { horasFinalesOrdinarie: 2, saldoRestanteDebito: 0, horasDeducidasDebito: 0 }
  }
];

let superatiAjuste = 0;
testCasesAjuste.forEach(tc => {
  const res = calcolaAjusteCompenso(tc.input[0], tc.input[1], tc.input[2]);
  const ok = res.horasFinalesOrdinarie === tc.atteso.horasFinalesOrdinarie &&
             res.saldoRestanteDebito === tc.atteso.saldoRestanteDebito &&
             res.horasDeducidasDebito === tc.atteso.horasDeducidasDebito;
  if (ok) superatiAjuste++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + tc.nome);
});

console.log('-----------------------------------------------------');
console.log('Totale test Ajuste superati: ' + superatiAjuste + ' / ' + testCasesAjuste.length);
if (superatiAjuste !== testCasesAjuste.length) {
  process.exit(1);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcolaSettimanaHosteleria,
    redondearMezzora,
    redondear2Decimali
  };
}
