import { Sheet } from './Sheet';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DatenschutzModal({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Datenschutzerklärung" subtitle="Bierwagen-Kasse-App" width="36rem" selectable>

        <div className="space-y-4 text-sm text-ink">
          <section>
            <h3 className="mb-1 font-semibold text-ink">
              1. Verantwortliche Stelle
            </h3>
            <p className="leading-relaxed">
              Marco Riege
              <br />
              Webexperte.Berlin
              <br />
              Onckenstr. 2
              <br />
              12435 Berlin
              <br />
              Tel: +49 (0) 30 239 961 59
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
            <h3 className="mb-1 font-semibold text-ink">2. Geltungsbereich</h3>
            <p className="leading-relaxed">
              Diese Datenschutzerklärung beschreibt die Verarbeitung
              personenbezogener Daten beim Aufruf und der Nutzung der Webanwendung
              „Bierwagen Kasse" (im Folgenden „die App").
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              3. Keine Datenverarbeitung in der App
            </h3>
            <p className="leading-relaxed">
              Die App ist eine rein clientseitige Single-Page-Anwendung und
              verarbeitet keine personenbezogenen Daten im Sinne der DSGVO:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>Es gibt kein Backend und keine Datenbank.</li>
              <li>
                Es werden keine <code>sessionStorage</code>, IndexedDB oder
                Cookies verwendet.
              </li>
              <li>
                Es findet keine Telemetrie, Analyse oder
                Drittanbieter-Datenübermittlung statt.
              </li>
              <li>
                Bestellungen, Pfand-Rückgaben und Bargeld-Eingaben leben
                ausschließlich im Arbeitsspeicher des Browsers und werden beim
                Reload gelöscht.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              4. Lokale Speicherung im <code>localStorage</code> und IndexedDB
            </h3>
            <p className="leading-relaxed">
              Damit die App über einen Reload hinaus nutzbar bleibt, werden auf
              deinem Gerät folgende Daten gespeichert:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Konfiguration</strong>{' '}
                (<code>localStorage</code>-Schlüssel{' '}
                <code>bierwagen-kasse:config:v1</code>): Getränke- und
                Pfand-Liste, inklusive Bestand und Happy-Hour.
              </li>
              <li>
                <strong className="text-ink">Einstellungen</strong>{' '}
                (<code>bierwagen-kasse:settings:v1</code>): Sprache,
                Hell-/Dunkel-Modus, aktivierte Funktionen, Anfangsbestand der
                Kasse.
              </li>
              <li>
                <strong className="text-ink">Tagesbilanz</strong>{' '}
                (<code>bierwagen-kasse:bilanz:v1</code>): abgeschlossene
                Bestellungen mit Positionen, Trinkgeld und Zahlart — nur, wenn
                die Tagesbilanz-Funktion aktiviert ist.
              </li>
              <li>
                <strong className="text-ink">Sync-Doc</strong> (IndexedDB,
                Datenbank <code>bierwagen-kasse-doc-v1</code>): identische
                Inhalte als CRDT-Dokument für die Geräte-Sync. Nur befüllt, wenn
                die Synchronisation in Konfiguration → Geräte aktiviert wurde.
              </li>
            </ul>
            <p className="mt-2 leading-relaxed">
              Die Daten verbleiben lokal auf dem Gerät, werden nicht an Server
              übertragen und nicht mit personenbezogenen Daten verknüpft. Über
              „Alles zurücksetzen" in den Einstellungen oder die
              Browser-Einstellungen lassen sie sich jederzeit löschen.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
              an einer komfortablen Bedienung ohne Wiedereingabe).
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              4a. Geräte-Synchronisation (optional)
            </h3>
            <p className="leading-relaxed">
              Die App bietet eine optionale Funktion „Geräte synchronisieren"
              (Konfiguration → Geräte). Sie ist standardmäßig deaktiviert und
              wird nur durch eine bewusste Nutzeraktion aktiviert (Scan eines
              QR-Codes zwischen Geräten).
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-ink-soft">
              <li>
                Pairing-Daten (Session-ID + WebRTC-SDP) werden nur einmalig per
                QR-Code zwischen den Geräten ausgetauscht — nicht über Server.
              </li>
              <li>
                Nach dem Pairing fließen Bilanz-, Bestand- und
                Sortiment-Updates direkt zwischen den Geräten via{' '}
                <code>WebRTC DataChannel</code>. Die Daten verlassen das
                lokale Netzwerk nicht.
              </li>
              <li>
                Es wird kein Signaling-Server, kein Backend, kein
                Drittanbieter-Service genutzt.
              </li>
              <li>
                Für den Verbindungsaufbau wird weder ein STUN- noch ein
                TURN-Server kontaktiert. Die Geräte müssen sich deshalb im selben
                lokalen Netzwerk befinden.
              </li>
            </ul>
            <p className="mt-2 leading-relaxed">
              Sync kann jederzeit per „Verbindung beenden" beendet werden. Die
              lokal gespeicherten Daten bleiben erhalten. Beim Reset
              („Alles zurücksetzen") wird die Sync-Verbindung getrennt und die
              IndexedDB-Doc gelöscht.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              5. Server-Logs durch den Hoster
            </h3>
            <p className="leading-relaxed">
              Beim Abruf der App werden vom Webserver des Hosters technisch
              notwendige Zugriffsdaten verarbeitet, die für die sichere und stabile
              Auslieferung erforderlich sind: Browsertyp und -version,
              Betriebssystem, Referrer-URL, Datum und Uhrzeit des Zugriffs,
              IP-Adresse sowie Internet-Service-Provider. Rechtsgrundlage ist Art.
              6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Sicherheit und
              Funktionsfähigkeit). Eine Zusammenführung dieser Daten mit anderen
              Quellen erfolgt nicht.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              6. Service Worker und Offline-Modus
            </h3>
            <p className="leading-relaxed">
              Beim ersten Aufruf wird ein Service Worker registriert, der den
              App-Code im Browser-Cache ablegt, um eine Offline-Nutzung zu
              ermöglichen. Es findet dabei keine Übertragung personenbezogener
              Daten an den Anbieter statt.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">7. Ihre Rechte</h3>
            <p className="leading-relaxed">Sie haben das Recht auf:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 leading-relaxed text-ink-soft">
              <li>Auskunft (Art. 15 DSGVO)</li>
              <li>Berichtigung (Art. 16 DSGVO)</li>
              <li>Löschung (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">
              8. Verbraucherstreitbeilegung
            </h3>
            <p className="leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-ink">9. Änderungen</h3>
            <p className="leading-relaxed">
              Diese Datenschutzerklärung kann angepasst werden, falls sich
              technische oder rechtliche Rahmenbedingungen ändern. Es gilt jeweils
              die zum Zeitpunkt der Nutzung abrufbare Fassung.
            </p>
          </section>

          <div className="rounded-lg bg-surface p-3 text-xs text-ink-mute">
            <p>
              Quelle / Inhaltliche Basis:{' '}
              <a
                className="text-accent-ink underline-offset-2 hover:underline"
                href="https://webexperte.berlin/datenschutz.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                webexperte.berlin/datenschutz.html
              </a>
            </p>
            <p className="mt-1">© 2026 Marco Riege · Webexperte.Berlin</p>
          </div>
        </div>

    </Sheet>
  );
}
