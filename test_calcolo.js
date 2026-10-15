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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcolaSettimanaHosteleria,
    redondearMezzora,
    redondear2Decimali
  };
}
