# Poštovní schránky - Vyhledávací aplikace

Webová aplikace pro vyhledávání poštovních schránek v České republice s mapovou podporou.

## 🚀 Funkce

- **Pokročilé vyhledávání** - Vyhledávání podle PSČ, adresy nebo kombinace obou
- **Mapová integrace** - Zobrazení polohy schránek na mapě pomocí Leaflet
- **Rychlé výsledky** - Optimalizovaná databáze s podporou stránkování
- **Export dat** - Možnost exportu výsledků do CSV formátu
- **Mobilní design** - Responzivní rozhraní pro všechna zařízení
- **Externí mapy** - Integrace s Google Maps a Mapy.cz

## 🛠️ Technologie

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: PHP 8.x
- **Databáze**: MariaDB
- **Styly**: Bootstrap 5.3
- **Mapy**: Leaflet.js
- **Ikony**: Bootstrap Icons

## 🚦 Instalace

1. **Klonování repozitáře**
   ```bash
   git clone [repository-url]
   cd postovni-schranky
   ```

2. **Nastavení databáze**
    - Vytvořte MariaDB databázi `my_user_app`
    - Importujte strukturu tabulky `postboxes` s sloupci:
        - `psc` (VARCHAR) - PSČ
        - `adresa` (VARCHAR) - Adresa schránky

3. **Konfigurace databáze**
    - Upravte připojovací údaje v `php/get_postboxes.php`:
   ```php
   $pdo = new PDO(
       "mysql:host=localhost;port=3306;dbname=my_user_app;charset=utf8mb4",
       "your_username", "your_password"
   );
   ```

4. **Webový server**
    - Nahrajte soubory na webový server s podporou PHP
    - Ujistěte se, že PHP má povolené PDO_MYSQL extension

## 🎯 Použití

### Základní vyhledávání
1. Otevřete `html/home.html` v prohlížeči
2. Klikněte na "Začít vyhledávat" nebo přejděte na `html/index.html`
3. Zadejte PSČ nebo adresu do vyhledávacího pole
4. Klikněte na "Hledat"

### Pokročilé možnosti
- **Typ vyhledávání**: Zvolte mezi PSČ, adresou nebo kombinací
- **Počet výsledků**: Nastavte 10-100 výsledků na stránku
- **Export**: Exportujte výsledky do CSV formátu
- **Mapa**: Zobrazte polohu schránky na mapě

### API endpoint

**GET/POST** `/php/get_postboxes.php`

**Parametry:**

```json
 { "search": "hledaný výraz", "searchType": "all|psc|adresa", "page": 1, "perPage": 25 }
 ```
**Odpověď:**
```json
{ "success": true, "data": [ { , "total": 1, "showing": 1, "page": 1, "totalPages": 1, "perPage": 25, "searchType": "all", "searchTerm": "praha" }
```
## 🔧 Konfigurace

### Databáze
- Host: `localhost`
- Port: `3306`
- Databáze: `my_user_app`
- Tabulka: `postboxes`

### CORS
API je nakonfigurováno pro všechny origins (`*`). Pro produkční nasazení upravte:

```php 
header("Access-Control-Allow-Origin: [https://your-domain.com](https://your-domain.com)");
```
## 📱 Kompatibilita

- **Prohlížeče**: Chrome, Firefox, Safari, Edge (moderní verze)
- **Mobilní zařízení**: iOS Safari, Android Chrome
- **Responzivní design**: Bootstrap 5.3

## 🔒 Zabezpečení

- Prepared statements pro SQL dotazy
- Input validace a sanitizace
- Error handling s obecnými chybovými hláškami
- Limity na počet výsledků (max 100)

## 📄 Licence

Všechna práva vyhrazena © 2025

## 🤝 Přispívání

Pro hlášení chyb nebo návrhy vylepšení vytvořte issue v repozitáři.

## 📞 Kontakt

Pro technickou podporu kontaktujte správce aplikace.
