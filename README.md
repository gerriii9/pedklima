# PEDKlima web

Statický web so slovenskou a maďarskou verziou. Texty, fotky a kontakty sú v `content/`, vzhľad v `static/css/style.css`. Netlify po každej zmene spustí `node build.js` a zverejní priečinok `dist/`.

## Spustenie na Netlify

1. Nahraj celý tento priečinok do nového repozitára na GitHube, vetva musí byť `main`.
2. V Netlify daj **Add new project → Import an existing project** a vyber repozitár. Nastavenia sa načítajú z `netlify.toml`.
3. V projekte zapni **Identity**. V jeho nastaveniach daj **Registration → Invite only**.
4. V **Identity → Services** zapni **Git Gateway**.
5. V **Identity** pošli pozvánku na e-mail majiteľa. Odkaz z pozvánky ho prevedie do `/admin/`, kde si nastaví heslo.

Admin potom beží na `tvojweb.netlify.app/admin/`.

## Formulár

1. V Netlify v časti **Forms** zapni **Enable form detection** a znova spusti nasadenie.
2. Vo **Forms → Form notifications** pridaj e-mailové upozornenie na `pedklima@gmail.com`.
3. Pošli skúšobný dopyt zo živého webu. Má prísť do Netlify aj na e-mail a zákazníka má presmerovať na stránku s ďakovaním.

## Recenzie

Sú v admine v časti **Recenzie z Googlu**. Nové treba doplniť ručne a upraviť hodnotenie a počet, automaticky sa neaktualizujú. Ak je zoznam prázdny, pás sa nezobrazí.

## Pred ostrým spustením

- V admine v **Kontakt a firemné údaje** doplň názov firmy, IČO a oblasť pôsobenia. Adresa a Facebook sú prevzaté z Google profilu, tak ich over. Mapa na konci stránky sa berie z adresy a bez adresy sa nezobrazí.
- V tej istej časti vypni **Skryť web pred Googlom**. Kým je zapnuté, Google stránku nezaindexuje.
- Nech majiteľ skontroluje texty, najmä maďarskú verziu a službu Rozvody v hrubej stavbe.

## Ak admin nepôjde

- Netlify vedie Git Gateway ako zastaraný. Na zapnutých weboch funguje, ale ak ho na novom projekte nepôjde zapnúť, treba prejsť na iné prihlásenie cez `backend` v `static/admin/config.yml`.
- Ak po uložení v admine Netlify čaká na schválenie nasadenia, schváľ ho a pridaj autora do tímu.

## Lokálne

`node build.js` a potom otvor `dist/` cez ľubovoľný statický server.

Písma TeX Gyre Adventor a TeX Gyre Heros sú pod licenciou GUST Font License.
