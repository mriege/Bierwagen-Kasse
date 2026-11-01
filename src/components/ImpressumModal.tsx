import { Sheet } from './Sheet';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ImpressumModal({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Impressum" subtitle="Angaben gemäß § 5 DDG" width="36rem" selectable>

        <div className="space-y-4 text-sm text-ink">
          <section>
            <h3 className="mb-1 font-semibold text-ink">Anbieter</h3>
            <p className="leading-relaxed">
              Marco Riege
              <br />
              Webexperte.Berlin
              <br />
              Onckenstr. 2
              <br />
              12435 Berlin
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">Kontakt</h3>
            <p className="leading-relaxed">
              Festnetz: +49 (0) 30 239 961 59
              <br />
              Mobil: +49 (0) 176 658 695 63
              <br />
              E-Mail:{' '}
              <a
                className="text-accent-ink underline-offset-2 hover:underline"
                href="mailto:marco@webexperte.berlin"
              >
                marco@webexperte.berlin
              </a>
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">Umsatzsteuer-ID</h3>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{' '}
              <span className="font-mono">DE289725467</span>
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h3>
            <p>Marco Riege (Anschrift wie oben)</p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              Verbraucherstreitbeilegung
            </h3>
            <p className="leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">Haftung für Inhalte</h3>
            <p className="leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
              auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
              §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet,
              übermittelte oder gespeicherte fremde Informationen zu überwachen oder
              nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
              hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung
              von Informationen nach den allgemeinen Gesetzen bleiben hiervon
              unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
              Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
              Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
              Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">Haftung für Links</h3>
            <p className="leading-relaxed">
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
              Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
              fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
              Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden
              wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">Urheberrecht</h3>
            <p className="leading-relaxed">
              Die durch den Seitenbetreiber erstellten Inhalte und Werke
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
              Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <div className="rounded-lg bg-surface p-3 text-xs text-ink-mute">
            <p>
              Quelle / Inhaltliche Basis:{' '}
              <a
                className="text-accent-ink underline-offset-2 hover:underline"
                href="https://webexperte.berlin/impressum.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                webexperte.berlin/impressum.html
              </a>
            </p>
            <p className="mt-1">© 2026 Marco Riege · Webexperte.Berlin</p>
          </div>
        </div>

    </Sheet>
  );
}
