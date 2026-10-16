# 🍕 Controllo Orari e Compensi Extra - Settore Ristorazione & Hosteleria

Applicazione completa e reattiva per la gestione avanzata dei turni dei dipendenti, il tracciamento dei giorni festivi infrasettimanali e l'algoritmo matematico di calcolo e disaccoppiamento tra ore lavorate, ore extra ordinarie e ore festive su base settimanale (Lunedì - Domenica).

Funziona sia come **Web App su GitHub Pages** (in piena autonomia locale con `localStorage`), sia come **Web App su Google Apps Script** (con Google Sheets e PropertiesService).

---

## ⚡ Come Risolvere l'Errore "404 File not found" su GitHub Pages

Se accedendo al link di GitHub Pages (es. `https://mpizzaevino.github.io/Horarios_pizzeria/`) ricevi l'errore **404 File not found**:

### Causa 1: Il file si chiamava `Index.html` invece di `index.html`
I server di GitHub Pages (Linux) sono strettamente *case-sensitive*. Il file principale deve chiamarsi rigorosamente **`index.html`** tutto in **minuscolo**. Questo file è ora predisposto correttamente in minuscolo.

### Causa 2: I file sono stati caricati dentro una sottocartella anziché nella radice (root)
GitHub Pages cerca `index.html` nella cartella principale (root) della repository o nella cartella `/docs`.
* **Assicurati di caricare i file direttamente nella radice della repository**, non dentro una cartella chiamata `github/`.

### Procedura Rapida di Caricamento / Aggiornamento su GitHub:

#### Opzione A: Tramite interfaccia web di GitHub
1. Vai sulla tua repository GitHub: `https://github.com/mpizzaevino/Horarios_pizzeria`.
2. Se i file sono dentro una cartella `github/`, o se `index.html` ha la "I" maiuscola, trascina e rilascia direttamente i file contenuti dentro `C:\Users\User\Desktop\APP ORARI PIZZERIA\github\` nella pagina della repository.
3. Assicurati che siano presenti nella radice del repository:
   * `index.html` *(minuscolo)*
   * `view.html` *(minuscolo)*
   * `local_engine.js`
   * `.nojekyll`
   * `404.html`
4. Clicca su **Commit changes**.
5. Nelle impostazioni della repository (**Settings** > **Pages**):
   * **Source:** `Deploy from a branch`
   * **Branch:** `main` (o `master`) e cartella `/ (root)`.
   * Clicca su **Save**. Dopo 1-2 minuti, il sito sarà online e funzionante!

#### Opzione B: Tramite riga di comando Git
Esegui questi comandi all'interno della cartella `github`:
```bash
cd "C:\Users\User\Desktop\APP ORARI PIZZERIA\github"
git init
git add .
git commit -m "fix: aggiungi index.html minuscolo, local engine e supporto GitHub Pages"
git branch -M main
git remote add origin https://github.com/mpizzaevino/Horarios_pizzeria.git
git push -u origin main --force
```

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

Il repository include lo script di unit test automatico `test_calcolo.js`:
* **Input:**
  * Contratto: 30,0 h/settimana | Giorni Base: 6 gg
  * Tariffa Extra Normale: 8,50 € | Tariffa Festiva: 11,60 €
  * Settimana: Lun (Festivo: SÌ, 5.0h) | Mar (5.0h) | Mer (5.0h) | Gio (4.5h) | Ven (8.0h) | Sab (5.0h) | Dom (0.0h) -> **Totale: 32,5 ore**.
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

## 📁 Struttura della Repository

Tutti i seguenti file devono trovarsi nella radice della repository:
```
├── index.html                      # Pannello di amministrazione (lowercase per GitHub Pages)
├── view.html                       # Vista dipendente / Ricevute private con desglose
├── local_engine.js                 # Motore di esecuzione locale/offline per GitHub Pages
├── .nojekyll                       # Disabilita filtri Jekyll su GitHub Pages
├── 404.html                        # Reindirizzamento intelligente SPA per GitHub Pages
├── Code.gs                         # Backend Google Apps Script
├── Code.js                         # Versione .js di Code.gs
├── appsscript.json                 # Manifest ufficiale Google Apps Script V8
├── test_calcolo.js                 # Suite di unit test Node.js
├── package.json                    # Script npm di test e gestione
├── genera_excel.py                 # Script Python per generazione modello Excel
├── Calcolo_Ore_Extra_Hosteleria.xlsx# Foglio Excel sincronizzato con le formule dell'app
└── README.md                       # Questa documentazione
```
