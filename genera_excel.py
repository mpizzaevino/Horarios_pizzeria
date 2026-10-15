import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Inizializza la cartella di lavoro
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Calcolo Settimanale"
ws.views.sheetView[0].showGridLines = True

# Colori Palette
COLOR_HEADER_BG = "1F4E78"       # Blu scuro
COLOR_HEADER_TEXT = "FFFFFF"     # Bianco
COLOR_ZEBRA_LIGHT = "F2F5F9"     # Grigio/blu chiarissimo
COLOR_SUMMARY_BG = "E9EEF4"      # Grigio chiaro per riassunto
COLOR_ACCENT_GREEN = "D9EAD3"    # Verde chiaro per evidenziare festivo
COLOR_HIGHLIGHT_YELLOW = "FFF2CC"# Giallo tenue per totale
COLOR_TEXT_MAIN = "333333"

# Stili
font_title = Font(name="Calibri", size=16, bold=True, color="1F4E78")
font_subtitle = Font(name="Calibri", size=11, italic=True, color="595959")
font_header = Font(name="Calibri", size=11, bold=True, color=COLOR_HEADER_TEXT)
font_bold = Font(name="Calibri", size=11, bold=True, color=COLOR_TEXT_MAIN)
font_regular = Font(name="Calibri", size=11, color=COLOR_TEXT_MAIN)
font_total = Font(name="Calibri", size=12, bold=True, color="1F4E78")

fill_header = PatternFill(start_color=COLOR_HEADER_BG, end_color=COLOR_HEADER_BG, fill_type="solid")
fill_zebra = PatternFill(start_color=COLOR_ZEBRA_LIGHT, end_color=COLOR_ZEBRA_LIGHT, fill_type="solid")
fill_festivo = PatternFill(start_color=COLOR_ACCENT_GREEN, end_color=COLOR_ACCENT_GREEN, fill_type="solid")
fill_summary = PatternFill(start_color=COLOR_SUMMARY_BG, end_color=COLOR_SUMMARY_BG, fill_type="solid")
fill_total = PatternFill(start_color=COLOR_HIGHLIGHT_YELLOW, end_color=COLOR_HIGHLIGHT_YELLOW, fill_type="solid")

thin_border_side = Side(border_style="thin", color="D9D9D9")
border_cell = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
border_top_thick = Border(top=Side(border_style="medium", color="1F4E78"))
border_total = Border(top=Side(border_style="thin", color="1F4E78"), bottom=Side(border_style="double", color="1F4E78"))

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

# Formati numerici
FMT_DECIMAL = "0.0"
FMT_CURRENCY = "#,##0.00 €"

# Header Titolo
ws["A1"] = "CONTROLLO ORE SETTIMANALI ED EXTRA"
ws["A1"].font = font_title
ws["A2"] = "Settore Hosteleria (6 giorni lavorativi / settimana)"
ws["A2"].font = font_subtitle

# Dati Dipendente e Parametri (Sezione Inizio)
params = [
    ("Dipendente:", "MOHAMMED"),
    ("Ore Contratto Settimanali:", 30.0),
    ("Giorni Lavorativi / Settimana:", 6),
    ("Tariffa Ora Extra Normale:", 8.50),
    ("Tariffa Ora Festiva:", 11.60)
]

for i, (param_name, param_val) in enumerate(params, start=4):
    ws.cell(row=i, column=1, value=param_name).font = font_bold
    cell_val = ws.cell(row=i, column=2, value=param_val)
    cell_val.font = font_regular
    if "Tariffa" in param_name:
        cell_val.number_format = FMT_CURRENCY
    elif "Ore" in param_name:
        cell_val.number_format = FMT_DECIMAL

# Tabella Orario Giornaliero
headers_table = ["Giorno", "Data", "È Festivo? (SÌ/NO)", "Ore Lavorate"]
start_row_table = 10

for col_idx, text in enumerate(headers_table, start=1):
    c = ws.cell(row=start_row_table, column=col_idx, value=text)
    c.font = font_header
    c.fill = fill_header
    c.alignment = align_center

# Dati d'esempio per una settimana
dati_settimana = [
    ("Lunedì", "01/01/2024", "NO", 5.0),
    ("Martedì", "02/01/2024", "NO", 5.0),
    ("Mercoledì", "03/01/2024", "NO", 5.0),
    ("Giovedì", "04/01/2024", "NO", 4.5),
    ("Venerdì", "05/01/2024", "NO", 8.0),
    ("Sabato", "06/01/2024", "SÌ", 5.0), # Festivo d'esempio con 5 ore
    ("Domenica", "07/01/2024", "RIPOSO", 0.0)
]

for r_offset, (giorno, data, festivo, ore) in enumerate(dati_settimana):
    r = start_row_table + 1 + r_offset
    
    cell_giorno = ws.cell(row=r, column=1, value=giorno)
    cell_data = ws.cell(row=r, column=2, value=data)
    cell_festivo = ws.cell(row=r, column=3, value=festivo)
    cell_ore = ws.cell(row=r, column=4, value=ore)
    
    cell_giorno.font = font_regular
    cell_data.font = font_regular
    cell_festivo.font = font_bold
    cell_ore.font = font_regular
    
    cell_giorno.alignment = align_left
    cell_data.alignment = align_center
    cell_festivo.alignment = align_center
    cell_ore.alignment = align_right
    
    cell_ore.number_format = FMT_DECIMAL
    
    # Bordinatura e applicazione stile zebra o festivo
    for col_idx in range(1, 5):
        c = ws.cell(row=r, column=col_idx)
        c.border = border_cell
        if festivo == "SÌ":
            c.fill = fill_festivo
        elif r_offset % 2 == 1:
            c.fill = fill_zebra

# Totale Ore Lavorate
row_tot_ore = start_row_table + len(dati_settimana) + 1
ws.cell(row=row_tot_ore, column=1, value="TOTALE ORE LAVORATE").font = font_bold
c_tot_ore = ws.cell(row=row_tot_ore, column=4, value=f"=SUM(D11:D17)")
c_tot_ore.font = font_bold
c_tot_ore.alignment = align_right
c_tot_ore.number_format = FMT_DECIMAL
for col_idx in range(1, 5):
    ws.cell(row=row_tot_ore, column=col_idx).border = border_top_thick

# Sezione Riconciliazione e Calcolo Extra (A destra)
summary_start_col = 6 # Colonna F

summary_rows = [
    ("RECAPITO E CALCOLO EXTRA", "", "", "HEADER"),
    ("Giorni Festivi Lavorati nella Settimana", '=COUNTIF(C11:C17, "SÌ")', "giorni", "QTY"),
    ("Ore Ordinaria Giornaliera Base", '=B5/B6', "ore", "QTY"),
    ("Ore Dovute Settimana (H. Nomina)", '=B5 - (G12*G13)', "ore", "QTY"),
    ("Totale Ore Lavorate Effettive", '=D18', "ore", "QTY"),
    ("Ore Extra Totali (o Debito)", '=G15-G14', "ore", "QTY"),
    ("", "", "", "BLANK"),
    ("RIPARTIZIONE ECONOMICHE", "QUANTITÀ", "TARIFFA", "HEADER_SUB"),
    ("Ore Extra Ordinarie", '=MAX(0, G16 - G21)', '=B7', "ROW_EXTRA_ORD"),
    ("Ore Festive Lavorate", '=SUMIF(C11:C17, "SÌ", D11:D17)', '=B8', "ROW_FESTIVE"),
    ("TOTALE COMPENSO EXTRA", "", "", "TOTAL")
]

for offset, row_info in enumerate(summary_rows):
    r = 10 + offset
    label = row_info[0]
    formula_val = row_info[1]
    unit_or_tariff = row_info[2]
    row_type = row_info[3]
    
    if row_type == "HEADER":
        ws.merge_cells(start_row=r, start_column=6, end_row=r, end_column=8)
        cell = ws.cell(row=r, column=6, value=label)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
    elif row_type == "HEADER_SUB":
        ws.cell(row=r, column=6, value=label).font = font_bold
        ws.cell(row=r, column=7, value=formula_val).font = font_bold
        ws.cell(row=r, column=8, value=unit_or_tariff).font = font_bold
        ws.cell(row=r, column=7).alignment = align_center
        ws.cell(row=r, column=8).alignment = align_right
        for col in range(6, 9):
            ws.cell(row=r, column=col).border = border_top_thick
    elif row_type == "QTY":
        c_lbl = ws.cell(row=r, column=6, value=label)
        c_val = ws.cell(row=r, column=7, value=formula_val)
        c_unit = ws.cell(row=r, column=8, value=unit_or_tariff)
        
        c_lbl.font = font_regular
        c_val.font = font_bold
        c_unit.font = font_subtitle
        
        c_val.alignment = align_right
        c_unit.alignment = align_left
        c_val.number_format = FMT_DECIMAL
        
        for col in range(6, 9):
            ws.cell(row=r, column=col).fill = fill_summary
            ws.cell(row=r, column=col).border = border_cell
    elif row_type == "ROW_EXTRA_ORD":
        ws.cell(row=r, column=6, value=label).font = font_regular
        c_qty = ws.cell(row=r, column=7, value=formula_val)
        c_tar = ws.cell(row=r, column=8, value=unit_or_tariff)
        c_tot = ws.cell(row=r, column=9, value=f"=G{r}*H{r}")
        
        c_qty.font = font_regular
        c_tar.font = font_regular
        c_tot.font = font_bold
        
        c_qty.alignment = align_right
        c_tar.alignment = align_right
        c_tot.alignment = align_right
        
        c_qty.number_format = FMT_DECIMAL
        c_tar.number_format = FMT_CURRENCY
        c_tot.number_format = FMT_CURRENCY
        
        for col in range(6, 10):
            ws.cell(row=r, column=col).border = border_cell
    elif row_type == "ROW_FESTIVE":
        ws.cell(row=r, column=6, value=label).font = font_regular
        c_qty = ws.cell(row=r, column=7, value=formula_val)
        c_tar = ws.cell(row=r, column=8, value=unit_or_tariff)
        c_tot = ws.cell(row=r, column=9, value=f"=G{r}*H{r}")
        
        c_qty.font = font_regular
        c_tar.font = font_regular
        c_tot.font = font_bold
        
        c_qty.alignment = align_right
        c_tar.alignment = align_right
        c_tot.alignment = align_right
        
        c_qty.number_format = FMT_DECIMAL
        c_tar.number_format = FMT_CURRENCY
        c_tot.number_format = FMT_CURRENCY
        
        for col in range(6, 10):
            ws.cell(row=r, column=col).border = border_cell
            ws.cell(row=r, column=col).fill = fill_festivo
    elif row_type == "TOTAL":
        ws.cell(row=r, column=6, value=label).font = font_total
        c_tot_final = ws.cell(row=r, column=9, value="=I20+I21")
        c_tot_final.font = font_total
        c_tot_final.alignment = align_right
        c_tot_final.number_format = FMT_CURRENCY
        
        for col in range(6, 10):
            c = ws.cell(row=r, column=col)
            c.border = border_total
            c.fill = fill_total

# Aggiusta la larghezza delle colonne
column_widths = {
    "A": 18,
    "B": 16,
    "C": 20,
    "D": 16,
    "E": 4,
    "F": 36,
    "G": 14,
    "H": 14,
    "I": 16
}

for col_letter, width in column_widths.items():
    ws.column_dimensions[col_letter].width = width

wb.save("Calcolo_Ore_Extra_Hosteleria.xlsx")