# Creative Scaler

Kalkulačka, která klientovi ukáže, kolik kreativ na Meta Ads opravdu potřebuje, kolik to bude stát a co se stane bez nových kreativ. Na konci je formulář „Chci kreativy“.

Aplikace má dvě části:

| Část | Adresa | Pro koho | Co tam je |
|---|---|---|---|
| **Veřejná** | `/` | klienti | kalkulačka, náklady na AI produkci, ukázky AI kreativ, graf únavy kreativ, měsíční plán, poptávkový formulář, jazyky CZ/SK/EN |
| **Admin** | `/admin` | tým | celá kalkulačka s předpoklady a rozpisem výpočtu, demo účty, generátor názvů kreativ do výroby, odkaz pro klienta, **nastavení** (ceník, pravidla, ukázky) a **poptávky** |

Návod pro kolegy (bez technických detailů) je přímo v aplikaci na adrese **/READ_ME**.

Co se v adminu uloží v Nastavení, veřejná část hned přebere. Interní věci (předpoklady, zadání do výroby, demo účty, poptávky) do veřejné části vůbec nechodí, ani ve zdrojovém kódu stránky.

## Hesla

- `ADMIN_PASSWORD` – vstup do adminu.
- `PUBLIC_PASSWORD` – vstup do veřejné části. Dokud je nastavené, klient potřebuje heslo.
- `PUBLIC_OPEN` – **až bude kalkulačka pro klienty hotová**, nastavte `PUBLIC_OPEN=true`. Veřejná část se otevře bez hesla (i když je `PUBLIC_PASSWORD` vyplněné).

Když chybí heslo i `PUBLIC_OPEN`, veřejná část zůstane zavřená a pustí jen admina. Nic se tak neotevře omylem.

- `ADMIN_OPEN` – nastavte `true`, aby admin fungoval bez hesla (jen pro demo). Pozor: kdo zná adresu `/admin`, uvidí poptávky i s kontakty a může měnit nastavení.

**Demo teď běží bez hesel:** `PUBLIC_OPEN=true` a `ADMIN_OPEN=true`.

Admin heslo otevře i veřejnou část. Změna hesla automaticky odhlásí všechny, kdo byli přihlášení starým heslem.

## Nasazení na Railway

1. V Railway klikněte **New Project → Deploy from GitHub repo** a vyberte `creative-scaler`.
2. V záložce **Variables** přidejte (klíč pro přihlášení si aplikace vygeneruje sama a uloží na volume):
   - `ADMIN_PASSWORD` – heslo pro tým
   - `PUBLIC_PASSWORD` – heslo na prezentaci
   - `DATA_DIR` = `/data`
3. Přidejte **Volume** (pravým tlačítkem na službu → Attach Volume) s cestou `/data`. Tam se ukládá nastavení a poptávky. Bez volume by se po každém nasazení smazaly.
4. V **Settings → Networking** klikněte na **Generate Domain**. Dostanete adresu typu `creative-scaler-production.up.railway.app`.
5. Hotovo. Každý push do větve `main` se nasadí sám.

**Vlastní doména `creativescaler.mairateam.com`:** v Settings → Networking → Custom Domain zadejte doménu a Railway vypíše záznam CNAME, který musí správce DNS pro mairateam.com přidat.

**Poptávky do Slacku (nepovinné):** ve Slacku vytvořte Incoming Webhook do zvoleného kanálu a jeho adresu vložte do proměnné `SLACK_WEBHOOK_URL`. Každá nová poptávka pak přijde i tam.

## Písmo

Web MAIRA používá písmo **PP Neue Corp Compact**. Soubory písma nejsou v repozitáři, protože jde o placené písmo a jeho licenci spravuje MAIRA. Do té doby se zobrazuje velmi podobné **Archivo** (Google Fonts) ve zúženém řezu.

Až MAIRA písmo dodá a licence to dovolí, stačí nahrát tyto dva soubory do `public/assets/fonts/`:

- `PPNeueCorp-CompactMedium.woff2`
- `PPNeueCorp-CompactUltrabold.woff2`

Aplikace je začne používat sama, bez další úpravy kódu.

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
- **Ukázky AI kreativ** zatím chybí. Nahrajte je v Nastavení.

## Jak výpočet funguje (verze 0.5)

Podle zpětné vazby týmu (Šimon, Kuba, Filip – Asana, říjen 2026):

1. Počet nových kreativ měsíčně vychází přímo z rozpočtu bez katalogu: přímka mezi kotvami **100 tis. Kč = 10** a **1 mil. Kč = 50** kreativ, zaokrouhleno po 5.
2. **Situace účtu** násobí výsledek: stabilní provoz 1×, růst 1,5×, launch / nový směr 2×.
3. **Malé rozpočty:** pod 100 tis. Kč 1 sada (5 kreativ) měsíčně, pod 50 tis. Kč 1 sada za 2 měsíce.
4. **Nad 50 kreativ** se číslo počítá dál, ale klient vidí štítek „individuální nabídka“.
5. Sada má 5 kreativ: 3 videa s různým hookem a 2 odlišné statiky.
6. Živé kreativy = kreativy v právě běžících testech + vítězové (1 ze sady, ~4 týdny), **minimálně 6**.
7. **Únava kreativ:** bez obměny zdražuje konverze o 7 % týdně od 3. týdne. Doporučený objem tento růst tlumí o 70 %, menší objem úměrně méně. Když klient vyplní dnešní počet kreativ, druhá křivka ukazuje jeho dnešní tempo.
8. **CPA a ROAS** počet kreativ neovlivňují, slouží jen k přepočtu na konverze, tržby a ztrátu z únavy. Trh se už nevybírá.
9. Veřejná část ukazuje jen cenu AI produkce. Srovnání s klasickou produkcí je jen v adminu.
10. **Ukázky AI kreativ** se nahrávají v adminu v Nastavení (soubory jdou na volume do `DATA_DIR/media`). Bez ukázek se sekce neukazuje.

Všechny kotvy, násobky, minimum živých reklam, únava i ceník jdou změnit v adminu v Nastavení.

## Struktura

```
server.js              server, přihlášení, API
store.js               ukládání nastavení a poptávek (JSON v DATA_DIR)
views/                 stránky: veřejná, admin, přihlášení
public/assets/         veřejné soubory: styly, sdílený výpočet (core.js), veřejná logika
private/admin.js       logika adminu, posílá se jen přihlášenému adminovi
```
