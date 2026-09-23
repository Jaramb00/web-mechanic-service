# Pitanja za klijenta i budući razvoj

Demo je namijenjen tome da klijent vidi kako bi sustav radio i kaže što želi drukčije.
Ovo su pitanja na koja treba odgovor prije nastavka, i popis onoga što u ovoj fazi
svjesno **nije** napravljeno.

---

## 1. Podaci koje samo klijent može dati

Sve navedeno je u demou **zamjensko** i mora se zamijeniti prije objave. Nalazi se na
jednom mjestu: `frontend/src/config/site.ts`.

- [ ] Naziv servisa i puni naziv tvrtke, OIB
- [ ] Adresa, koordinate za kartu, uputa za dolazak
- [ ] Telefon i e-mail
- [ ] **Stvarni cjenik** — cijene u demou su ilustrativne
- [ ] Stvarno radno vrijeme, uključujući praznike i sezonske izmjene
- [ ] Stvarni broj radnih mjesta (dizalica) u radionici
- [ ] Tekst stranice „O nama" — namjerno nismo izmislili godine iskustva,
      broj stranaka ni certifikate
- [ ] Fotografije radionice, ako ih klijent želi
- [ ] Logo i boje, ako postoje (sustav je pripremljen da ih preuzme)
- [ ] Pregled pravnih stranica kod pravnog stručnjaka

## 2. Poslovna pitanja koja mijenjaju sustav

**Termini**
- Koliko unaprijed se smije rezervirati? (demo: 60 dana)
- Do kada se smije otkazati bez posljedica? (demo: 2 sata prije)
- Treba li termin potvrđivati ručno ili se potvrđuje sam?
- Rade li svi majstori sve usluge, ili termin treba vezati uz određenu osobu?
- Treba li blokirati pauzu za ručak i praznike?
- Što s klijentima koji se ponavljano ne pojave?

**Sezona**
- Treba li lista čekanja kad su svi termini popunjeni?
- Treba li u sezoni drukčije radno vrijeme ili kraći slotovi?

**Zaliha**
- Tko smije mijenjati cijene — samo vlasnik ili i skladištar?
- Treba li praćenje dobavljača i narudžbenica?
- Treba li rezervacija artikla imati rok isteka?

**Hotel za gume**
- Kako se vodi evidencija gdje je čiji komplet (polica, mjesto)?
- Koliko dugo se čuva i što s nepreuzetim kompletima?
- Naplaćuje se po sezoni ili po mjesecu?

**Poslovanje**
- Treba li izdavanje računa i fiskalizacija? To je najveći pojedinačni posao izvan demoa.
- Treba li povezivanje s postojećim knjigovodstvenim programom?

## 3. Svjesno izvan opsega demo verzije

Nije napravljeno i **ne izgleda kao da jest**:

| Funkcionalnost | Napomena |
|---|---|
| Potvrda rezervacije kupcu e-mailom | traži provjeru adrese — vidi niže |
| SMS i Viber obavijesti | plaća se po poruci; odluka je klijentova |
| Podsjetnik dan prije termina | traži zakazani posao i stupac `reminder_sent_at` |
| Obrazac za kontakt | traži zaštitu od spama jaču od honeypota; telefon i e-mail su na stranici |
| Online plaćanje | plaća se pri preuzimanju vozila |
| Izdavanje računa i fiskalizacija | zaseban i opsežan posao |
| Narudžbe dobavljačima | inventory prati stanje, ne nabavni proces |
| Više poslovnica | arhitektura to podnosi, ali nije implementirano |
| Izvještaji i analitika | dashboard pokazuje stanje dana, ne trendove |
| Mobilna aplikacija | stranica je responzivna, native aplikacije nema |

### Što treba prije nego potvrda krene kupcu

Dojava servisu o novoj rezervaciji **šalje se e-mailom**. Potvrda kupcu se svjesno ne
šalje: adresa koju upiše pri registraciji nije ničim provjerena, pa bi slanje na nju
značilo slanje na tuđu ili nepostojeću adresu. Redoslijed:

- [ ] Token za potvrdu adrese pri registraciji i stupac `email_verified_at`
- [ ] E-mail s poveznicom za potvrdu, s rokom trajanja
- [ ] Postupanje s odbijenim porukama (bounce) — adresa koja odbija prestaje se koristiti
- [ ] Tek onda potvrda o rezervaciji, po želji s `.ics` privitkom za kalendar

Slanje je u demou sinkrono, unutar obrade događaja. Za produkciju ide red poruka s
ponavljanjem, da spor SMTP ne drži zahtjev.

---

## 4. Tehnički dug prije produkcije

Poredano po važnosti:

1. **HTTPS i sigurni kolačići** — `COOKIE_SECURE=true`, TLS na reverse proxyju,
   uključiti HSTS u `nginx.conf`. (Pripremljeno, treba uključiti.)
2. **Rate limit u zajedničkom spremniku** — sada je u memoriji jedne instance, pa se
   gubi pri restartu i ne radi iza više instanci. Rješenje: Redis.
3. **CAPTCHA na javnim formama** — honeypot zaustavlja samo nevješte botove.
4. **Prerender ili SSR javnih stranica** — aplikacija je SPA, pa meta podaci postoje tek
   nakon izvršavanja JavaScripta. Za ozbiljan SEO treba prerender.
5. **Skeniranje ovisnosti na Java strani** — `npm audit` pokriva samo frontend.
6. **Skeniranje tajni u CI-u** (`gitleaks`) kao mreža za ljudsku grešku.
7. **Rezervne kopije baze** i provjera da se iz njih može vratiti.
8. **Praćenje rada u produkciji** — trenutno postoji samo `/actuator/health`.
9. **Rotacija JWT ključa** i refresh tokeni za dulje sesije.
10. **Testovi pristupačnosti u CI-u** (axe) — pristupačnost je ugrađena, ali nije
    automatski provjerena.

## 5. Što bismo predložili kao sljedeći korak

Ako klijent potvrdi smjer, redoslijed koji donosi najviše koristi po uloženom:

1. Zamjena zamjenskih podataka stvarnima i pravni pregled — bez toga se ništa ne može
   objaviti.
2. Slanje e-maila: potvrda termina i podsjetnik dan prije. Najveći pojedinačni dobitak
   za smanjenje nedolazaka.
3. HTTPS i produkcijski deploy.
4. Evidencija hotela za gume s lokacijom kompleta na polici.
5. Izdavanje računa, ako je poslovno potrebno.
