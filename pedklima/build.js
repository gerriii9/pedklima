// Poskladá web z textov v priečinku content/ do priečinka dist/.
// Bez závislostí, spúšťa ho Netlify po každej zmene v admine.
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dist = path.join(root, 'dist');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'content', name), 'utf8'));

const nastavenia = read('nastavenia.json');
const realizacie = read('realizacie.json').polozky || [];
const recenzie = read('recenzie.json');
const siteUrl = (process.env.URL || '').replace(/\/$/, '');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tel = (n) => String(n || '').replace(/[^\d+]/g, '');
// +421948312446 → 0948 312 446
const telVisible = (n) => {
  const d = tel(n).replace(/^\+421/, '0').replace(/^00421/, '0');
  return /^0\d{9}$/.test(d) ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : String(n || '');
};

const ui = {
  sk: {
    lang: 'sk', other: 'hu', otherLabel: 'Magyar', home: '/', otherHome: '/hu/',
    navSluzby: 'Služby', navCistenie: 'Čistenie', navRealizacie: 'Realizácie', navKontakt: 'Kontakt',
    zavolat: 'Zavolať', napisat: 'Napísať', zobrazitSluzby: 'Pozrieť služby', pred: 'Pred čistením', po: 'Po čistení',
    jazyk: 'Jazyk', hlavna: 'Hlavná navigácia', zvacsit: 'Zväčšiť fotku', zavriet: 'Zavrieť', dalsia: 'Ďalšia fotka', predosla: 'Predchádzajúca fotka',
    pusobnost: 'Pôsobíme', ico: 'IČO', mapa: 'Mapa', naGoogli: (n) => `${n} hodnotenia na Googli`, zastavit: 'Zastaviť', spustit: 'Spustiť',
    dakujeme: '/dakujeme/', fMeno: 'Meno', fTelefon: 'Telefón', fEmail: 'E-mail (nepovinné)', fObec: 'Obec (nepovinné)', fSluzba: 'O čo máte záujem', fSprava: 'Čo potrebujete (nepovinné)', fIne: 'Iné', fOdoslat: 'Odoslať dopyt',
    fPozn: 'Údaje použijeme len na odpoveď na váš dopyt.', dNadpis: 'Ďakujeme, dopyt sme dostali', dText: 'Ozveme sa vám na uvedený kontakt.', dSpat: 'Späť na úvod',
  },
  hu: {
    lang: 'hu', other: 'sk', otherLabel: 'Slovensky', home: '/hu/', otherHome: '/',
    navSluzby: 'Szolgáltatások', navCistenie: 'Tisztítás', navRealizacie: 'Munkáink', navKontakt: 'Kapcsolat',
    zavolat: 'Hívás', napisat: 'E-mail', zobrazitSluzby: 'Szolgáltatásaink', pred: 'Tisztítás előtt', po: 'Tisztítás után',
    jazyk: 'Nyelv', hlavna: 'Fő navigáció', zvacsit: 'Fotó nagyítása', zavriet: 'Bezárás', dalsia: 'Következő fotó', predosla: 'Előző fotó',
    pusobnost: 'Működési terület', ico: 'Cégazonosító (IČO)', mapa: 'Térkép', naGoogli: (n) => `${n} értékelés a Google-on`, zastavit: 'Megállítás', spustit: 'Indítás',
    dakujeme: '/hu/koszonjuk/', fMeno: 'Név', fTelefon: 'Telefonszám', fEmail: 'E-mail (nem kötelező)', fObec: 'Település (nem kötelező)', fSluzba: 'Mi érdekli', fSprava: 'Mire van szüksége (nem kötelező)', fIne: 'Egyéb', fOdoslat: 'Ajánlatkérés küldése',
    fPozn: 'Adatait csak az ajánlatkérés megválaszolására használjuk.', dNadpis: 'Köszönjük, megkaptuk az ajánlatkérést', dText: 'A megadott elérhetőségen jelentkezünk.', dSpat: 'Vissza a főoldalra',
  },
};

// Prihlasovacie odkazy z pozvánok Netlify Identity presmeruje do adminu.
const identityRedirect = `<script>if(/(invite|recovery|confirmation|email_change)_token=/.test(location.hash))location.replace('/admin/'+location.hash)</script>`;

function page(t, c) {
  const n = nastavenia;
  const pusobnost = t.lang === 'hu' ? n.pusobnost_hu : n.pusobnost_sk;
  const tel1 = tel(n.telefon1);
  const absolute = (p) => (siteUrl ? siteUrl + p : p);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'HVACBusiness', name: 'PEDKlima',
    telephone: tel1, email: n.email, description: c.seo_popis,
    ...(siteUrl ? { url: siteUrl, image: absolute(c.hero_foto) } : {}),
    ...(n.adresa ? { address: n.adresa } : {}),
    ...(n.facebook ? { sameAs: [n.facebook] } : {}),
  };

  const sluzby = (c.sluzby || []).map((s, i) => `
      <article class="service${i % 2 ? ' service--flip' : ''}">
        <img class="service__photo elbow" src="${esc(s.foto)}" alt="${esc(s.foto_popis)}" loading="lazy" decoding="async">
        <div class="service__body">
          <h3>${esc(s.nazov)}</h3>
          <p>${esc(s.text)}</p>
        </div>
      </article>`).join('');

  const fotky = realizacie.map((r, i) => {
    const popis = t.lang === 'hu' ? r.popis_hu : r.popis_sk;
    return `
        <li class="work">
          <button type="button" class="work__open" data-index="${i}" aria-label="${esc(t.zvacsit)}: ${esc(popis)}">
            <img src="${esc(r.foto)}" alt="${esc(popis)}" loading="lazy" decoding="async">
          </button>
          <p>${esc(popis)}</p>
        </li>`;
  }).join('');

  const pata = [
    n.firma && esc(n.firma),
    n.adresa && esc(n.adresa),
    n.ico && `${esc(t.ico)}: ${esc(n.ico)}`,
  ].filter(Boolean);

  const stars = '<span class="stars" aria-hidden="true">★★★★★</span>';
  const karty = recenzie.polozky || [];
  const karta = (r) => `<blockquote class="quote" lang="sk">${stars}<p>${esc(r.text)}</p><footer>${esc(r.meno)}</footer></blockquote>`;
  // Sada sa zopakuje, aby pás zaplnil široký monitor; druhá polovica slúži na plynulú slučku.
  const sada = Array.from({ length: Math.max(1, Math.ceil(6 / (karty.length || 1))) }, () => karty.map(karta).join('')).join('');
  const reviews = karty.length ? `
    <div class="reviews">
      <div class="reviews__head">
        <a href="${esc(recenzie.odkaz)}" rel="noopener"><strong>${esc(recenzie.hodnotenie)}</strong> ${stars} <span>${esc(t.naGoogli(recenzie.pocet))}</span></a>
        <button type="button" class="reviews__toggle" aria-pressed="false" data-stop="${esc(t.zastavit)}" data-play="${esc(t.spustit)}">${esc(t.zastavit)}</button>
      </div>
      <div class="reviews__view">
        <div class="reviews__track">
          <div class="reviews__set">${sada}</div>
          <div class="reviews__set" aria-hidden="true">${sada}</div>
        </div>
      </div>
    </div>` : '';

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.seo_titulok)}</title>
<meta name="description" content="${esc(c.seo_popis)}">
${n.skryt_pred_googlom ? '<meta name="robots" content="noindex">\n' : ''}<meta name="theme-color" content="#0F3B35">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(c.seo_titulok)}">
<meta property="og:description" content="${esc(c.seo_popis)}">
<meta property="og:image" content="${esc(absolute('/images/og.jpg'))}">
<meta property="og:locale" content="${t.lang === 'hu' ? 'hu_HU' : 'sk_SK'}">
<link rel="alternate" hreflang="sk" href="${esc(absolute('/'))}">
<link rel="alternate" hreflang="hu" href="${esc(absolute('/hu/'))}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/adventor-bold.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
${identityRedirect}
</head>
<body>
<a class="skip" href="#sluzby">${esc(t.navSluzby)}</a>
<svg class="pipe" aria-hidden="true" focusable="false"><path class="pipe__bed"/><path class="pipe__flow"/><circle class="pipe__end" r="6"/></svg>

<header class="top">
  <a class="top__logo" href="${t.home}" aria-label="PEDKlima"><img src="/images/pedklima-logo.svg" alt="PEDKlima" width="172" height="44"></a>
  <nav class="top__nav" aria-label="${esc(t.hlavna)}">
    <a href="#sluzby">${esc(t.navSluzby)}</a>
    <a href="#cistenie">${esc(t.navCistenie)}</a>
    <a href="#realizacie">${esc(t.navRealizacie)}</a>
    <a href="#kontakt">${esc(t.navKontakt)}</a>
  </nav>
  <div class="top__side">
    <a class="top__lang" href="${t.otherHome}" hreflang="${t.other}" lang="${t.other}">${esc(t.otherLabel)}</a>
    <a class="top__phone" href="tel:${esc(tel1)}">${esc(telVisible(n.telefon1))}</a>
  </div>
</header>

<main>
  <section class="hero">
    <div class="hero__text">
      <h1>${(c.hero_riadky || []).map((r) => `<span>${esc(r.text)}</span>`).join(' ')}</h1>
      <p class="hero__slogan">${esc(c.hero_slogan)}</p>
      <p class="hero__lead">${esc(c.hero_text)}</p>
      <div class="actions">
        <a class="btn btn--solid" href="tel:${esc(tel1)}">${esc(t.zavolat)}: ${esc(telVisible(n.telefon1))}</a>
        <a class="btn" href="#sluzby">${esc(t.zobrazitSluzby)}</a>
      </div>
    </div>
    <img class="hero__photo" data-pipe-start src="${esc(c.hero_foto)}" alt="${esc(c.hero_foto_popis)}" fetchpriority="high" decoding="async">${reviews}
  </section>

  <section class="band" id="sluzby" data-pipe="left">
    <div class="wrap">
      <h2>${esc(c.sluzby_nadpis)}</h2>
      <div class="services">${sluzby}
      </div>
    </div>
  </section>

  <section class="band band--dark" id="cistenie" data-pipe="right">
    <div class="wrap clean">
      <div class="clean__text">
        <h2>${esc(c.cistenie_nadpis)}</h2>
        <p>${esc(c.cistenie_text)}</p>
        <a class="btn btn--light" href="#dopyt">${esc(c.cistenie_tlacidlo)}</a>
      </div>
      <div class="clean__pair">
        <figure><img src="${esc(c.cistenie_pred_foto)}" alt="${esc(c.cistenie_pred_popis)}" loading="lazy" decoding="async"><figcaption>${esc(t.pred)}</figcaption></figure>
        <figure><img src="${esc(c.cistenie_po_foto)}" alt="${esc(c.cistenie_po_popis)}" loading="lazy" decoding="async"><figcaption>${esc(t.po)}</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="band" id="realizacie" data-pipe="left">
    <div class="wrap">
      <div class="band__head">
        <h2>${esc(c.realizacie_nadpis)}</h2>
        <p>${esc(c.realizacie_text)}</p>
      </div>
      <ul class="works">${fotky}
      </ul>
    </div>
  </section>

  <section class="band band--ice" id="kontakt" data-pipe="left">
    <div class="wrap contact">
      <div class="contact__text">
        <h2>${esc(c.kontakt_nadpis)}</h2>
        <p>${esc(c.kontakt_text)}</p>
        ${pusobnost ? `<p>${esc(t.pusobnost)}: ${esc(pusobnost)}</p>` : ''}
        <div class="contact__links">
          <a class="contact__big" data-pipe-end href="tel:${esc(tel1)}">${esc(telVisible(n.telefon1))}</a>
          ${n.telefon2 ? `<a class="contact__big" href="tel:${esc(tel(n.telefon2))}">${esc(telVisible(n.telefon2))}</a>` : ''}
          <a class="contact__mail" href="mailto:${esc(n.email)}">${esc(n.email)}</a>
          ${n.facebook ? `<a class="contact__mail" href="${esc(n.facebook)}" rel="noopener">Facebook</a>` : ''}
        </div>
      </div>
      <form class="form" id="dopyt" name="dopyt" method="POST" action="${t.dakujeme}" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="dopyt">
        <input type="hidden" name="jazyk" value="${t.lang}">
        <p class="form__trap"><label>Nevypĺňať <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <label class="field"><span>${esc(t.fMeno)}</span><input name="meno" required autocomplete="name"></label>
        <label class="field"><span>${esc(t.fTelefon)}</span><input name="telefon" type="tel" required autocomplete="tel"></label>
        <label class="field"><span>${esc(t.fEmail)}</span><input name="email" type="email" autocomplete="email"></label>
        <label class="field"><span>${esc(t.fObec)}</span><input name="obec" autocomplete="address-level2"></label>
        <label class="field field--wide"><span>${esc(t.fSluzba)}</span>
          <select name="sluzba">
            ${[...(c.sluzby || []).map((s) => s.nazov), c.cistenie_nadpis, t.fIne].map((o) => `<option>${esc(o)}</option>`).join('')}
          </select>
        </label>
        <label class="field field--wide"><span>${esc(t.fSprava)}</span><textarea name="sprava" rows="4"></textarea></label>
        <p class="form__note">${esc(t.fPozn)}</p>
        <button class="btn btn--solid" type="submit">${esc(t.fOdoslat)}</button>
      </form>
    </div>
  </section>
${n.adresa ? `
  <section class="map" aria-label="${esc(t.mapa)}">
    <iframe src="https://www.google.com/maps?q=${encodeURIComponent(`PEDKlima, ${n.adresa}`)}&hl=${t.lang}&z=15&output=embed" title="${esc(t.mapa)}: ${esc(n.adresa)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </section>` : ''}
</main>

<footer class="foot">
  <img src="/images/pedklima-logo-biele.svg" alt="PEDKlima" width="141" height="36" loading="lazy">
  ${pata.length ? `<p>${pata.join('<br>')}</p>` : ''}
  <p>© ${new Date().getFullYear()} PEDKlima</p>
</footer>

<div class="callbar">
  <a href="tel:${esc(tel1)}">${esc(t.zavolat)}</a>
  <a href="#dopyt">${esc(t.napisat)}</a>
</div>

<dialog class="viewer" aria-label="${esc(t.navRealizacie)}">
  <img alt="">
  <p class="viewer__caption"></p>
  <button type="button" class="viewer__btn viewer__close" aria-label="${esc(t.zavriet)}">×</button>
  <button type="button" class="viewer__btn viewer__prev" aria-label="${esc(t.predosla)}">‹</button>
  <button type="button" class="viewer__btn viewer__next" aria-label="${esc(t.dalsia)}">›</button>
</dialog>
<script src="/js/main.js" defer></script>
</body>
</html>
`;
}

function thanks(t) {
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(t.dNadpis)} | PEDKlima</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/style.css">
</head>
<body class="thanks">
<main>
  <img src="/images/pedklima-logo.svg" alt="PEDKlima" width="172" height="44">
  <h1>${esc(t.dNadpis)}</h1>
  <p>${esc(t.dText)}</p>
  <a class="btn btn--solid" href="${t.home}">${esc(t.dSpat)}</a>
</main>
</body>
</html>
`;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'static'), dist, { recursive: true });
fs.mkdirSync(path.join(dist, 'hu'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), page(ui.sk, read('sk.json')));
fs.writeFileSync(path.join(dist, 'hu', 'index.html'), page(ui.hu, read('hu.json')));
fs.mkdirSync(path.join(dist, 'dakujeme'), { recursive: true });
fs.mkdirSync(path.join(dist, 'hu', 'koszonjuk'), { recursive: true });
fs.writeFileSync(path.join(dist, 'dakujeme', 'index.html'), thanks(ui.sk));
fs.writeFileSync(path.join(dist, 'hu', 'koszonjuk', 'index.html'), thanks(ui.hu));
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\n${nastavenia.skryt_pred_googlom ? 'Disallow: /\n' : 'Disallow: /admin/\n'}`);
console.log('Web je pripravený v priečinku dist/');
