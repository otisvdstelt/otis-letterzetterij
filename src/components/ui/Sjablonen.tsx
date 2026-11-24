import { strings } from '../../content/strings'
import type { Template } from '../../lib/type/goals'
import type { EigenTekst } from '../../lib/type/zetsel'

/**
 * De zes sjablonen. Elk heeft koppen op meerdere niveaus, broodtekst, een citaat en een klein bijschrift,
 * zodat de hele schaal te zien is. Jouw kop, naam, alinea's, knop en menu gaan voor; verder staat er neutrale vultekst bij het doel
 */
export function Sjabloon({ kind, zin, eigen }: { kind: Template; zin: string; eigen?: EigenTekst }) {
  const t = strings.zetsel
  // Jouw tekst gaat voor. Alinea's worden gescheiden door een lege regel; zijn er meer plekken dan alinea's, dan begint hij weer vooraan
  const paras = eigen?.alinea.trim() ? eigen.alinea.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean) : null
  const p = (i: number, fallback: string) => (paras ? paras[i % paras.length] : fallback)
  const merk = (fallback: string) => eigen?.naam.trim() || fallback
  const knop = (fallback: string) => eigen?.knop.trim() || fallback
  const menu = eigen?.menu.trim() ? eigen.menu.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 5) : t.website.menu
  switch (kind) {
    case 'website':
      return (
        <div className="sj sj-website">
          <nav className="sj-nav" aria-hidden="true">
            <span className="sj-merk">{merk(t.website.merk)}</span>
            <span className="sj-menu">
              {menu.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </span>
          </nav>
          <header className="sj-held">
            <h1 className="lv-h1">{zin}</h1>
            <p className="lv-tekst sj-intro" data-weduwe>
              {p(0, t.website.intro)}
            </p>
            <span className="sj-knop">{knop(t.website.knop)}</span>
          </header>
          <h2 className="lv-h2 tweede">{t.website.h2}</h2>
          <p className="lv-tekst" data-weduwe>
            {p(1, t.website.alinea)}
          </p>
          <figure className="sj-citaat">
            <blockquote className="lv-h4">{t.website.citaat}</blockquote>
            <figcaption className="lv-klein">{t.website.bron}</figcaption>
          </figure>
          <h3 className="lv-h3 tweede">{t.website.h3}</h3>
          <p className="lv-tekst">
            {p(2, t.website.alinea2)} <strong>{merk(t.website.merk)}</strong>.
          </p>
          <p className="lv-klein sj-bijschrift">{t.website.bijschrift}</p>
        </div>
      )
    case 'boek':
      return (
        <div className="sj sj-boek">
          <p className="lv-klein kapitalen sj-kopregel">{merk(t.boek.kopregel)}</p>
          <p className="lv-klein kapitalen tweede">{t.boek.hoofdstuk}</p>
          <h1 className="lv-h2">{zin}</h1>
          <p className="lv-tekst sj-eerste" data-weduwe>
            {p(0, t.boek.alinea)}
          </p>
          <p className="lv-tekst sj-inspring">{p(1, t.boek.alinea2)}</p>
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
          <h2 className="lv-h3">{merk(t.affiche.plaats)}</h2>
          <p className="lv-tekst cijfers">{t.affiche.tijd}</p>
          <h3 className="lv-h4 tweede">{t.affiche.h2}</h3>
          <p className="lv-tekst" data-weduwe>
            {p(0, t.affiche.alinea)}
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
            {(paras ?? t.dia.punten).slice(0, 4).map((punt, i) => (
              <li key={i}>{punt}</li>
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
            <p className="lv-h3 sj-woordmerk">{merk(t.briefpapier.merk)}</p>
            <p className="lv-h4">{t.briefpapier.naam}</p>
            <p className="lv-klein kapitalen tweede">{t.briefpapier.functie}</p>
            <p className="lv-klein cijfers sj-contact">
              {t.briefpapier.contact.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </p>
          </div>
          <div className="sj-brief-vel">
            <p className="lv-h4 sj-woordmerk">{merk(t.briefpapier.merk)}</p>
            <p className="lv-klein cijfers">{t.briefpapier.datum}</p>
            <h1 className="lv-h3">{zin}</h1>
            <p className="lv-klein kapitalen tweede">{t.briefpapier.betreft}</p>
            <p className="lv-tekst">{t.briefpapier.aanhef}</p>
            <p className="lv-tekst" data-weduwe>
              {p(0, t.briefpapier.alinea)}
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
            <span className="lv-h4">{merk(t.app.balk)}</span>
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
          <span className="sj-knop">{knop(t.app.knop)}</span>
          <nav className="sj-tabs lv-klein" aria-hidden="true">
            {menu.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </nav>
          <p className="lv-klein cijfers sj-tekens">{t.app.tekens}</p>
          <blockquote className="lv-tekst cursief">{t.app.citaat}</blockquote>
          <p className="lv-klein">{t.app.bijschrift}</p>
        </div>
      )
  }
}
