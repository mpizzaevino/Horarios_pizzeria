# 🍕 Controllo Orari e Compensi Extra - Settore Ristorazione & Hosteleria

Applicazione completa e reattiva sviluppata per la gestione avanzata dei turni dei dipendenti, il tracciamento dei giorni festivi infrasettimanali e l'algoritmo matematico di disaccoppiamento tra ore lavorate, ore extra ordinarie e ore festive su base settimanale (Lunedì - Domenica).

---

## 📐 Algoritmo Matematico di Calcolo (Passo Passo)

L'applicazione implementa rigorosamente la logica di calcolo del settore ristorazione/hosteleria:

### 1. Ripartizione e Regole di Base
* **Ciclo Settimanale:** Calcolato rigorosamente da **Lunedì a Domenica**.
* **Settimana Lavorativa Base:** 6 giorni lavorativi su 7.
* **Parametri Dinamici (modificabili dall'interfaccia utente):**
  * `Contratto_Ore_Settimana`: Monte ore settimanale concordato per dipendente (es. 30,0 h).
  * `Giorni_Lavorativi_Base`: Impostato di default a **6** (personalizzabile).
  * `Tariffa_Ora_Extra_Normale`: Tariffa oraria per straordinari feriali (es. 8,50 €).
  * `Tariffa_Ora_Festiva`: Tariffa oraria per ore lavorate nei festivi (es. 11,60 €).

### 2. I 5 Passi Matematici dell'Algoritmo

$$\text{Ore Giornaliere Base} = \frac{\text{Contratto Ore Settimana}}{\text{Giorni Lavorativi Base}}$$
*(Es. 30,0 h / 6 gg = 5,0 h/giorno)*

$$\text{Ore Dovute Settimana (H\_NOMINA)} = \text{Contratto Ore Settimana} - (\text{Giorni Festivi Conteggiati} \times \text{Ore Giornaliere Base})$$
*(Ogni festivo infrasettimanale con flag `Is_Festivo = TRUE` decurta una giornata base dal dovuto settimanale).*

$$\text{Ore Extra Totali} = \text{Totale Ore Lavorate} - \text{Ore Dovute Settimana}$$
*(Se negativo, rappresenta un deficit orario che slitta al periodo successivo).*

$$\text{Ore Festive Lavorate} = \sum \text{Ore effettivamente prestate nei giorni con Is\_Festivo = TRUE}$$
$$\text{Ore Extra Ordinarie} = \max(0, \text{Ore Extra Totali} - \text{Ore Festive Lavorate})$$

$$\text{Compenso Extra Ordinario} = \text{Ore Extra Ordinarie} \times \text{Tariffa Ora Extra Normale}$$
$$\text{Compenso Festivo} = \text{Ore Festive Lavorate} \times \text{Tariffa Ora Festiva}$$
$$\mathbf{TOTALE\ COMPENSO\ EXTRA} = \text{Compenso Extra Ordinario} + \text{Compenso Festivo}$$

---

## 🧪 Validazione Unit Test

Il repository include lo script di unit test automatico `test_calcolo.js` che verifica il caso di test:
* **Input:**
  * Contratto: 30,0 h/settimana
  * Giorni Base: 6 gg
  * Tariffa Extra Normale: 8,50 €
  * Tariffa Festiva: 11,60 €
  * Settimana: Lun (Festivo: SÌ, 5.0h) | Mar (5.0h) | Mer (5.0h) | Gio (4.5h) | Ven (8.0h) | Sab (5.0h) | Dom (0.0h) -> **Totale Lavorate: 32,5 ore**.
* **Risultati Verificati:**
  1. Ore Giornaliere Base = 5,0 ore
  2. Giorni Festivi Conteggiati = 1
  3. Ore Dovute Settimana (H_NOMINA) = 25,0 ore
  4. Ore Extra Totali = 7,5 ore
  5. Ore Festive Lavorate = 5,0 ore
  6. Ore Extra Ordinarie = 2,5 ore
  7. TOTALE COMPENSO EXTRA = (2,5 × 8,50 €) + (5,0 × 11,60 €) = **79,25 €**

Esegui il test in locale con:
```bash
node test_calcolo.js
# oppure
npm test
```

---

## 🚀 Come Pubblicare / Aggiornare l'App su Google Apps Script

Puoi caricare questa repository su GitHub e distribuirla su Google Apps Script con due modalità semplici:

### Metodo 1: Tramite Google Clasp CLI (Consigliato per sviluppatori)
1. Installa Google Clasp globalmente:
   ```bash
   npm install -g @google/clasp
   ```
2. Effettua l'accesso a Google:
   ```bash
   clasp login
   ```
3. Crea un nuovo script o collega il tuo script esistente:
   * **Crea nuovo:** `clasp create --title "App Orari Pizzeria" --type webapp`
   * **Oppure collega esistente:** copia `.clasp.json.example` in `.clasp.json` e inserisci il tuo `scriptId` reperibile nell'URL dell'editor (`https://script.google.com/d/<SCRIPT_ID>/edit`).
4. Invia i file al cloud:
   ```bash
   clasp push
   ```
5. Apri l'editor:
   ```bash
   clasp open
   ```

### Metodo 2: Tramite Copia-Incolla su script.google.com
1. Vai su [script.google.com](https://script.google.com/) e apri il tuo progetto.
2. Inserisci i seguenti file con lo stesso nome:
   * **`Code.gs`**: copia il codice contenuto in `Code.gs`.
   * **`Index.html`**: crea un file HTML di nome `Index` e incolla il contenuto di `Index.html`.
   * **`View.html`**: crea un file HTML di nome `View` e incolla il contenuto di `View.html`.
   * **`appsscript.json`**: attiva la visualizzazione del file manifest nelle Impostazioni del progetto (*Mostra file manifest "appsscript.json" nell'editor*) e incolla il contenuto di `appsscript.json`.
3. Clicca su **Salva progetto** (`Ctrl+S`).

---

## 🌐 Distribuzione della Web App

1. Nell'editor di Google Apps Script, clicca in alto a destra su **Distribuisci** > **Nuova distribuzione**.
2. Seleziona il tipo: **Applicazione web**.
3. Configura le impostazioni:
   * **Descrizione:** *Versione 2.0 - Upgrade Calcolo Hosteleria*
   * **Esegui come:** *Me stesso (il tuo account)*
   * **Chi può accedere:** *Chiunque* (consente ai dipendenti di accedere ai link privati dei turni e delle ricevute di compenso).
4. Clicca su **Distribuisci** e copia l'URL generato.

---

## 📁 Struttura della Repository

```
├── .clasp.json.example             # Template configurazione Clasp CLI
├── .gitignore                      # File ignorati da Git
├── appsscript.json                 # Manifest ufficiale Google Apps Script V8
├── Code.gs                         # Backend Apps Script (motore orari, festivi, compensi)
├── Code.js                         # Versione .js di Code.gs per compatibilità
├── Index.html                      # Pannello di amministrazione completo e reattivo
├── View.html                       # Vista dipendente / Ricevute private con desglose
├── test_calcolo.js                 # Suite di unit test Node.js per validazione matematica
├── package.json                    # Script npm di test e gestione
├── genera_excel.py                 # Script Python per generazione modello Excel
├── Calcolo_Ore_Extra_Hosteleria.xlsx# Foglio Excel sincronizzato con le formule dell'app
└── README.md                       # Documentazione tecnica e guida all'installazione
```

---

## 🔒 Sicurezza e Privacy
* I link per i dipendenti (`View.html`) sono protetti tramite token sicuri e hanno una scadenza temporale automatica configurabile.
* I documenti di compensazione hanno valore informativo privato ad uso interno e non sostituiscono i cedolini paga ufficiali.
