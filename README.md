# Creative Scaler

Kalkulačka, která klientovi ukáže, kolik kreativ na Meta Ads opravdu potřebuje, kolik to bude stát a co se stane bez nových kreativ. Na konci je formulář „Chci kreativy“.

Aplikace má dvě části:

| Část | Adresa | Pro koho | Co tam je |
|---|---|---|---|
| **Veřejná** | `/` | klienti | kalkulačka, náklady AI vs. klasika, graf únavy kreativ, měsíční plán, poptávkový formulář, jazyky CZ/SK/EN |
| **Admin** | `/admin` | tým | celá kalkulačka s předpoklady a rozpisem výpočtu, demo účty, generátor názvů kreativ do výroby, odkaz pro klienta, **nastavení** (ceník, pravidla, budgety trhů) a **poptávky** |

Co se v adminu uloží v Nastavení, veřejná část hned přebere. Interní věci (předpoklady, zadání do výroby, demo účty, poptávky) do veřejné části vůbec nechodí, ani ve zdrojovém kódu stránky.

## Hesla

- `ADMIN_PASSWORD` – vstup do adminu.
- `PUBLIC_PASSWORD` – vstup do veřejné části. Dokud je nastavené, klient potřebuje heslo. **Až bude kalkulačka pro klienty hotová, proměnnou smažte** a veřejná část se otevře.

Admin heslo otevře i veřejnou část. Změna hesla automaticky odhlásí všechny, kdo byli přihlášení starým heslem.

## Nasazení na Railway

1. V Railway klikněte **New Project → Deploy from GitHub repo** a vyberte `creative-scaler`.
2. V záložce **Variables** přidejte:
   - `ADMIN_PASSWORD` – heslo pro tým
   - `PUBLIC_PASSWORD` – heslo na prezentaci
   - `SESSION_SECRET` – dlouhý náhodný text (stačí 40 náhodných znaků)
   - `DATA_DIR` = `/data`
3. Přidejte **Volume** (pravým tlačítkem na službu → Attach Volume) s cestou `/data`. Tam se ukládá nastavení a poptávky. Bez volume by se po každém nasazení smazaly.
4. V **Settings → Networking** klikněte na **Generate Domain**. Dostanete adresu typu `creative-scaler-production.up.railway.app`.
5. Hotovo. Každý push do větve `main` se nasadí sám.

**Vlastní doména `creativescaler.mairateam.com`:** v Settings → Networking → Custom Domain zadejte doménu a Railway vypíše záznam CNAME, který musí správce DNS pro mairateam.com přidat.

**Poptávky do Slacku (nepovinné):** ve Slacku vytvořte Incoming Webhook do zvoleného kanálu a jeho adresu vložte do proměnné `SLACK_WEBHOOK_URL`. Každá nová poptávka pak přijde i tam.

## Lokální spuštění

```bash
npm install
npm run dev
```

Otevřete http://localhost:3000 (heslo `demo`) a http://localhost:3000/admin (heslo `admin`).

## Co je zatím demo

- **Demo účty** v adminu jsou vymyšlené. Další krok je načítat spend, CPA, ROAS a počet reklam přímo z Meta účtu klienta.
- **Graf únavy kreativ** je ilustrační křivka (bez obměny +7 % týdně od 3. týdne). Nahradit daty z účtů MAIRA.
- **Ceník** je ukázkový. Přepište ho v Nastavení a vypněte volbu „Ceny jsou orientační“.
- **Budgety trhů** mimo Česko jsou návrh. Po ověření je v Nastavení zaškrtněte jako ověřené.

## Jak výpočet funguje

1. Z měsíčního spendu jde výchozích 30 % na testování.
2. Jedna testovací sada potřebuje denní budget trhu × délka testu (CZ: 5 000 Kč × 6 dní = 30 000 Kč).
3. Počet sad = rozpočet na testování ÷ budget sady, zaokrouhleno dolů.
4. Každá sada má 5 kreativ: 3 videa s různým hookem a 2 odlišné statiky.
5. Živé kreativy = kreativy v právě běžících testech + vítězové (1 ze sady, běží ~4 týdny).

Hodnoty z bodů 1, 2, 4 a 5 jdou změnit v adminu v Nastavení.

## Struktura

```
server.js              server, přihlášení, API
store.js               ukládání nastavení a poptávek (JSON v DATA_DIR)
views/                 stránky: veřejná, admin, přihlášení
public/assets/         veřejné soubory: styly, sdílený výpočet (core.js), veřejná logika
private/admin.js       logika adminu, posílá se jen přihlášenému adminovi
```
