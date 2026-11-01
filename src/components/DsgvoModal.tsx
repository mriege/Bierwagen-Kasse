import {
  Shield,
  Database,
  Wifi,
  RotateCcw,
  FileText,
  Lock,
  RadioTower,
  BookOpen,
} from 'lucide-react';
import { Sheet } from './Sheet';

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenImpressum: () => void;
  onOpenDatenschutz: () => void;
};

export function DsgvoModal({
  open,
  onClose,
  onOpenImpressum,
  onOpenDatenschutz,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Daten nur lokal — kein Cloud-Server" subtitle="So speichert die App deine Daten." width="30rem" selectable>

        <ul className="space-y-3 text-sm text-ink">
          <li className="flex gap-3">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-positive-ink" />
            <div>
              <div className="font-semibold">Lokale Speicherung auf deinem Gerät</div>
              <div className="text-ink-mute">
                Damit die App zuverlässig nach einem Reload weiterläuft,
                speichern wir auf deinem Gerät:
                <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                  <li>
                    <strong className="text-ink-soft">Konfiguration</strong>{' '}
                    (<code>localStorage</code>) — Getränke- und Pfand-Liste,
                    inklusive Bestand und Happy-Hour.
                  </li>
                  <li>
                    <strong className="text-ink-soft">Einstellungen</strong>{' '}
                    (<code>localStorage</code>) — Sprache, Hell-/Dunkel-Modus,
                    aktivierte Funktionen, Kassen-Anfangsbestand,
                    Geräte-ID und Gerätename.
                  </li>
                  <li>
                    <strong className="text-ink-soft">Tagesbilanz</strong>{' '}
                    (<code>localStorage</code>) — abgeschlossene Bestellungen
                    inkl. Erfassungs-Gerät; nur wenn die Bilanz-Funktion
                    aktiviert ist.
                  </li>
                  <li>
                    <strong className="text-ink-soft">Sync-Doc</strong>{' '}
                    (<code>IndexedDB</code>) — gleicher Inhalt als
                    CRDT-Dokument, nur befüllt wenn die optionale
                    Geräte-Synchronisation aktiviert wurde.
                  </li>
                </ul>
                Keine Cookies, keine <code>sessionStorage</code>-Nutzung, keine
                Drittanbieter-Identifier. Alles bleibt auf deinem Gerät.
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-positive-ink" />
            <div>
              <div className="font-semibold">Nur im Arbeitsspeicher</div>
              <div className="text-ink-mute">
                Die <em>laufende</em> Bestellung, Pfand-Rückgaben,
                Bargeld-Eingaben und Trinkgeld leben ausschließlich im RAM und
                sind beim Reload weg. Beim Klick auf „Neue Bestellung" wandert
                der Inhalt — falls Tagesbilanz aktiv — in einen abgeschlossenen
                Eintrag, der dann persistent gespeichert wird.
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-positive-ink" />
            <div>
              <div className="font-semibold">Kein Backend, kein Tracking</div>
              <div className="text-ink-mute">
                Es gibt keinen Server, der die Bestellungen empfängt. Keine
                Telemetrie, keine Analyse, keine Drittanbieter-Skripte. Nach
                dem ersten Aufruf läuft die App komplett offline.
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <RadioTower className="mt-0.5 h-5 w-5 shrink-0 text-promo-ink" />
            <div>
              <div className="font-semibold">
                Geräte-Sync &amp; Kundendisplay (optional, opt-in)
              </div>
              <div className="text-ink-mute">
                Wer die <strong>Mehrgeräte-Sync</strong> oder das{' '}
                <strong>Kundendisplay</strong> aktiviert, koppelt zwei Geräte
                per QR-Code direkt aneinander. Die Daten fließen anschließend
                über eine{' '}
                <strong className="text-ink-soft">
                  WebRTC-Verbindung Peer-zu-Peer im LAN
                </strong>{' '}
                — ohne externen Server, ohne Cloud, ohne Signaling-Service.
                Sync ist standardmäßig aus und wird nur durch eine bewusste
                Nutzeraktion aktiviert.
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-positive-ink" />
            <div>
              <div className="font-semibold">Volle Kontrolle</div>
              <div className="text-ink-mute">
                Über „Alles zurücksetzen" in den Einstellungen wird der gesamte
                lokale Speicher gelöscht und die Default-Konfig wiederhergestellt.
                Konfiguration und Tagesbilanz lassen sich zusätzlich als JSON
                exportieren und auf anderen Geräten importieren.
              </div>
            </div>
          </li>
        </ul>

        <div className="mt-5 rounded-lg bg-surface p-3 text-xs text-ink-mute">
          Hinweis: Diese App ist <em>keine</em> KassenSichV-/TSE-konforme Registrierkasse.
          Sie ist gedacht für Vereinsfeste, einzelne Bierwagen-Einsätze oder andere
          Veranstaltungen ohne Aufzeichnungspflicht.
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenImpressum();
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-surface py-2.5 text-sm font-semibold text-ink ring-1 ring-line active:bg-raised"
          >
            <FileText className="h-4 w-4" /> Impressum
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenDatenschutz();
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-surface py-2.5 text-sm font-semibold text-ink ring-1 ring-line active:bg-raised"
          >
            <Lock className="h-4 w-4" /> Datenschutzerklärung
          </button>
        </div>

        <a
          href="/dokumentation/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-surface py-2.5 text-sm font-semibold text-positive-ink ring-1 ring-line active:bg-raised"
        >
          <BookOpen className="h-4 w-4" /> Dokumentation öffnen ↗
        </a>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg bg-accent py-3 font-bold text-on-accent active:bg-accent-press"
        >
          Verstanden
        </button>

        <div className="mt-3 text-center text-xs text-ink-mute">
          Open Source · MIT-Lizenz ·{' '}
          <a
            href="https://github.com/Webexperte-Berlin/bierwagen-kasse"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-soft underline-offset-2 hover:underline"
          >
            github.com/Webexperte-Berlin/bierwagen-kasse
          </a>
        </div>
    </Sheet>
  );
}
