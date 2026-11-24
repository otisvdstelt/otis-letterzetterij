import { strings } from '../../content/strings'
import type { Template } from '../../lib/type/goals'

/**
 * De zes sjablonen. Elk heeft koppen op meerdere niveaus, broodtekst, een citaat en een klein bijschrift,
 * zodat de hele schaal te zien is. Jouw zin is de grote kop
 */
export function Sjabloon({ kind, zin }: { kind: Template; zin: string }) {
  const t = strings.zetsel
  switch (kind) {
    case 'website':
      return (
        <div className="sj sj-website">
          <nav className="sj-nav" aria-hidden="true">
            <span className="sj-merk">{t.website.merk}</span>
            <span className="sj-menu">
              {t.website.menu.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </span>
          </nav>
          <header className="sj-held">
            <h1 className="lv-h1">{zin}</h1>
            <p className="lv-tekst sj-intro" data-weduwe>
              {t.website.intro}
            </p>
            <span className="sj-knop">{t.website.knop}</span>
          </header>
          <h2 className="lv-h2 tweede">{t.website.h2}</h2>
          <p className="lv-tekst" data-weduwe>
            {t.website.alinea}
          </p>
          <figure className="sj-citaat">
            <blockquote className="lv-h4">{t.website.citaat}</blockquote>
            <figcaption className="lv-klein">{t.website.bron}</figcaption>
          </figure>
          <h3 className="lv-h3 tweede">{t.website.h3}</h3>
          <p className="lv-tekst">
            {t.website.alinea2} <strong>{t.website.merk}</strong>.
          </p>
          <p className="lv-klein sj-bijschrift">{t.website.bijschrift}</p>
        </div>
      )
    case 'boek':
      return (
        <div className="sj sj-boek">
          <p className="lv-klein kapitalen sj-kopregel">{t.boek.kopregel}</p>
          <p className="lv-klein kapitalen tweede">{t.boek.hoofdstuk}</p>
          <h1 className="lv-h2">{zin}</h1>
          <p className="lv-tekst sj-eerste" data-weduwe>
            {t.boek.alinea}
          </p>
          <p className="lv-tekst sj-inspring">{t.boek.alinea2}</p>
          <blockquote className="lv-tekst sj-citaat cursief">{t.boek.citaat}</blockquote>
          <h3 className="lv-h4 tweede">{t.boek.h3}</h3>
          <p className="lv-klein sj-noot">{t.boek.noot}</p>
          <p className="lv-klein sj-folio cijfers">{t.boek.folio}</p>
        </div>
      )
    case 'affiche':
      return (
        <div className="sj sj-affiche">
          <p className="lv-h4 kapitalen tweede">{t.affiche.boven}</p>
          <h1 className="lv-groot">{zin}</h1>
          <h2 className="lv-h3">{t.affiche.plaats}</h2>
          <p className="lv-tekst cijfers">{t.affiche.tijd}</p>
          <h3 className="lv-h4 tweede">{t.affiche.h2}</h3>
          <p className="lv-tekst" data-weduwe>
            {t.affiche.alinea}
          </p>
          <blockquote className="lv-tekst cursief">{t.affiche.citaat}</blockquote>
          <p className="lv-klein cijfers">{t.affiche.bijschrift}</p>
        </div>
      )
    case 'dia':
      return (
        <div className="sj sj-dia">
          <p className="lv-klein kapitalen">{t.dia.boven}</p>
          <h1 className="lv-h1">{zin}</h1>
          <h2 className="lv-h3 tweede">{t.dia.h2}</h2>
          <ul className="lv-tekst sj-punten">
            {t.dia.punten.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <blockquote className="lv-h4 cursief">{t.dia.citaat}</blockquote>
          <p className="lv-klein">{t.dia.bijschrift}</p>
        </div>
      )
    case 'briefpapier':
      return (
        <div className="sj sj-brief">
          <div className="sj-kaartje">
            <p className="lv-h3 sj-woordmerk">{t.briefpapier.merk}</p>
            <p className="lv-h4">{t.briefpapier.naam}</p>
            <p className="lv-klein kapitalen tweede">{t.briefpapier.functie}</p>
            <p className="lv-klein cijfers sj-contact">
              {t.briefpapier.contact.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </p>
          </div>
          <div className="sj-brief-vel">
            <p className="lv-h4 sj-woordmerk">{t.briefpapier.merk}</p>
            <p className="lv-klein cijfers">{t.briefpapier.datum}</p>
            <h1 className="lv-h3">{zin}</h1>
            <p className="lv-klein kapitalen tweede">{t.briefpapier.betreft}</p>
            <p className="lv-tekst">{t.briefpapier.aanhef}</p>
            <p className="lv-tekst" data-weduwe>
              {t.briefpapier.alinea}
            </p>
            <blockquote className="lv-tekst cursief">{t.briefpapier.citaat}</blockquote>
            <p className="lv-tekst">
              {t.briefpapier.groet}
              <br />
              <strong>{t.briefpapier.naam}</strong>
            </p>
            <p className="lv-klein cijfers sj-voetregel">{t.briefpapier.voetregel}</p>
          </div>
        </div>
      )
    case 'app':
      return (
        <div className="sj sj-app">
          <div className="sj-balk">
            <span className="lv-h4">{t.app.balk}</span>
          </div>
          <h1 className="lv-h2">{zin}</h1>
          <h2 className="lv-h3 tweede">{t.app.h3}</h2>
          <ul className="sj-regels lv-tekst cijfers">
            {t.app.regels.map(([wat, prijs]) => (
              <li key={wat}>
                <span>{wat}</span>
                <span>{prijs}</span>
              </li>
            ))}
            <li className="sj-totaal">
              <strong>{t.app.totaal[0]}</strong>
              <strong>{t.app.totaal[1]}</strong>
            </li>
          </ul>
          <span className="sj-knop">{t.app.knop}</span>
          <p className="lv-klein cijfers sj-tekens">{t.app.tekens}</p>
          <blockquote className="lv-tekst cursief">{t.app.citaat}</blockquote>
          <p className="lv-klein">{t.app.bijschrift}</p>
        </div>
      )
  }
}
