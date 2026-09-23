# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + TypeScript + Vite + Tailwind CSS (frontend), Spring Boot 3.5 + PostgreSQL 16
(backend). Odabrao korisnik u odobrenom planu projekta; nije delegirano.

## Users

**Primarni korisnik:** privatni vozač u Hrvatskoj koji sam dolazi u vulkanizerski servis.
Potvrđeno u intervjuu.

Situacija u kojoj dolazi na stranicu:
- **Sezonska navala** (listopad–studeni, ožujak–travanj): treba zamijeniti gume i zna da su
  termini rijetki. Traži prvi slobodan termin, ne pregled ponude.
- **Hitan kvar**: probušena guma, vibracije pri vožnji. Traži telefon, adresu i radno
  vrijeme — često s mobitela, često na cesti ili s parkirališta.
- **Planirano**: kupnja novih guma ili ostavljanje kompleta na čuvanje. Uspoređuje cijene i
  dimenzije prije dolaska.

Nije tehnički korisnik. Ne poznaje pojmove iz softvera i neće tražiti skrivene funkcije.

**Sekundarni korisnici (osoblje servisa):** majstor u radionici (tablet, prljave ruke,
kratki pogledi između poslova), skladištar (stanje guma i dijelova), vlasnik/administrator
(pregled dana, cjenik, korisnici). Tvrtke s voznim parkom NISU ciljana skupina u ovoj fazi.

## Product Purpose

Servis trenutno nema nikakav poslovni softver — termini se dogovaraju telefonom, a zaliha
se vodi napamet ili u bilježnici. Proizvod treba:

1. omogućiti vozaču da rezervira termin bez telefonskog poziva, uključujući izvan radnog
   vremena servisa;
2. dati servisu jedno mjesto na kojem vidi raspored dana i stanje zalihe.

Uspjeh demo faze: klijent nakon prezentacije razumije kako bi sustav radio kod njega i zna
reći što želi dodati, promijeniti ili maknuti.

## Positioning

Za razliku od generičkog alata za rezervacije, sustav zna da je jedinica kapaciteta
**radno mjesto (dizalica)**, a ne "termin" — više vozila može biti u servisu istovremeno,
ali ne na istoj dizalici. Zaliha i termini su povezani: artikl utrošen na servisu skida se
sa stanja u istom trenutku.

## Operating Context

- Radno vrijeme je fiksno i uređuje ga administrator; nedjeljom se ne radi.
- Kapacitet je definiran brojem radnih mjesta u radionici.
- Sezona je izrazito neravnomjerna: dva vrhunca godišnje, ostatak godine mirniji.
- Osoblje radi rukama; su­čelja koja koriste moraju podnositi korištenje na tabletu i
  kratke poglede, bez sitnih meta za dodir.
- Hotel za gume (sezonsko čuvanje kompleta) je **jedna od glavnih usluga** — potvrđeno u
  intervjuu — jer veže klijenta na servis kroz cijelu godinu.

## Capabilities and Constraints

Implementirano u demou: javna stranica s cjenikom, online rezervacija termina, korisnički
portal (vozila, termini, rezervacije artikala), dashboard administratora, majstora i
skladištara, osnovni inventory s knjigom prometa, e-mail dojava servisu o novoj
rezervaciji.

Svjesno izvan opsega demo faze: online plaćanje, potvrda rezervacije kupcu e-mailom
(traži provjeru adrese), SMS, narudžbe dobavljačima, više poslovnica, izdavanje računa,
integracija s fiskalizacijom.

**Podaci o klijentu nisu poznati.** Naziv servisa, adresa, telefon, OIB, koordinate i
fotografije su placeholderi u `frontend/src/config/site.ts` i moraju se zamijeniti prije
bilo kakvog javnog prikaza. Ništa od toga se ne smije izmišljati.

## Brand Commitments

Nema ih. Klijent nema postojeći vizualni identitet koji bi trebalo poštovati, niti je
zadao boje, font ili reference. Vizualni svijet se stoga slobodno bira, ali svi tokeni
moraju biti na jednom mjestu kako bi ih klijent kasnije mogao zamijeniti svojima.

## Evidence on Hand

Nema stvarnih podataka klijenta: nema recenzija, nema fotografija radionice, nema
brojeva (koliko vozila dnevno, koliko godina posluje). Demo NE SMIJE izmišljati
testimonijale, brojke ni certifikate. Sav sadržaj u demou je jasno označen kao
ilustrativan.

Postoji: potpuno funkcionalan backend s demo podacima (8 usluga, 18 artikala, 10 termina,
6 korisnika) koji frontend koristi kao stvarni izvor.

## Product Principles

1. **Termin je jedina svrha javne stranice.** Sve ostalo služi tome da posjetitelj dođe do
   rezervacije ili do telefona.
2. **Ne izmišljaj klijenta.** Gdje nema podatka, stoji označeni placeholder — nikad
   uvjerljiva izmišljotina.
3. **Portal je alat, ne izlog.** Dashboardi se mjere brzinom snalaženja, ne dojmom.
4. **Sezona diktira dizajn.** Sučelje mora raditi i kad je servis pun i termina nema —
   prazna i "nema slobodno" stanja nisu rubni slučajevi nego redoviti prizor.
5. **Demo mora biti iskren.** Ono što nije implementirano ne smije izgledati kao da jest.

## Accessibility & Inclusion

Korisnici su svih dobi, često na mobitelu, ponekad na suncu ili u žurbi. Obavezno: WCAG AA
kontrast na svim stanjima, vidljiv focus, meta za dodir najmanje 44 px, potpuna navigacija
tipkovnicom i semantičke oznake za čitače ekrana. Cijelo sučelje je na hrvatskom jeziku.
