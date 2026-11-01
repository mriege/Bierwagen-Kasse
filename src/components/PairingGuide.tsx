import {
  Wifi,
  Smartphone,
  RadioTower,
  ScanLine,
  Camera,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Sheet } from './Sheet';
import { useT } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Schritt-für-Schritt-Anleitung zum Pairen.
 *
 * Wird aus dem SyncPanel über das ?-Icon geöffnet. Der Inhalt ist
 * vollständig i18n-getrennt — neue Keys: `guide.*`.
 */
export function PairingGuide({ open, onClose }: Props) {
  const t = useT();

  return (
    <Sheet open={open} onClose={onClose} title={t('guide.title')} subtitle={t('guide.subtitle')} width="42rem" selectable>

        <div className="space-y-4 text-sm text-ink">
          {/* Voraussetzungen */}
          <Section
            icon={<Wifi className="h-5 w-5 text-positive-ink" />}
            title={t('guide.prereqTitle')}
          >
            <ul className="ml-5 list-disc space-y-1 leading-relaxed">
              <li>{t('guide.prereqWifi')}</li>
              <li>{t('guide.prereqCamera')}</li>
              <li>{t('guide.prereqBrowser')}</li>
            </ul>
          </Section>

          {/* Schritt 1 */}
          <StepBox
            num={1}
            icon={<Smartphone className="h-5 w-5 text-accent-ink" />}
            title={t('guide.s1Title')}
          >
            <p className="leading-relaxed">{t('guide.s1Body')}</p>
          </StepBox>

          {/* Schritt 2: Master starten */}
          <StepBox
            num={2}
            icon={<RadioTower className="h-5 w-5 text-accent-ink" />}
            title={t('guide.s2Title')}
          >
            <p className="mb-2 leading-relaxed">{t('guide.s2Body')}</p>
            <Hint>{t('guide.s2Hint')}</Hint>
          </StepBox>

          {/* Schritt 3: Joiner scannt */}
          <StepBox
            num={3}
            icon={<ScanLine className="h-5 w-5 text-accent-ink" />}
            title={t('guide.s3Title')}
          >
            <p className="mb-2 leading-relaxed">{t('guide.s3Body')}</p>
            <Hint>{t('guide.s3Hint')}</Hint>
          </StepBox>

          {/* Schritt 4: Master scannt Antwort */}
          <StepBox
            num={4}
            icon={<Camera className="h-5 w-5 text-accent-ink" />}
            title={t('guide.s4Title')}
          >
            <p className="leading-relaxed">{t('guide.s4Body')}</p>
          </StepBox>

          {/* Schritt 5: Verbunden */}
          <StepBox
            num={5}
            icon={<CheckCircle2 className="h-5 w-5 text-positive-ink" />}
            title={t('guide.s5Title')}
          >
            <p className="leading-relaxed">{t('guide.s5Body')}</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 leading-relaxed">
              <li>{t('guide.s5b1')}</li>
              <li>{t('guide.s5b2')}</li>
              <li>{t('guide.s5b3')}</li>
            </ul>
          </StepBox>

          {/* Weitere Geräte */}
          <Section
            icon={<Users className="h-5 w-5 text-positive-ink" />}
            title={t('guide.moreDevicesTitle')}
          >
            <p className="leading-relaxed">{t('guide.moreDevicesBody')}</p>
          </Section>

          {/* Häufige Probleme */}
          <Section
            icon={<AlertCircle className="h-5 w-5 text-accent-ink" />}
            title={t('guide.troubleTitle')}
          >
            <dl className="space-y-2">
              <Trouble q={t('guide.troubleQ1')} a={t('guide.troubleA1')} />
              <Trouble q={t('guide.troubleQ2')} a={t('guide.troubleA2')} />
              <Trouble q={t('guide.troubleQ3')} a={t('guide.troubleA3')} />
              <Trouble q={t('guide.troubleQ4')} a={t('guide.troubleA4')} />
            </dl>
          </Section>

          {/* Datenschutz-Hinweis */}
          <Section
            icon={<ShieldCheck className="h-5 w-5 text-positive-ink" />}
            title={t('guide.privacyTitle')}
          >
            <p className="leading-relaxed">{t('guide.privacyBody')}</p>
          </Section>
        </div>

    </Sheet>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-surface p-3">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-ink">
          {title}
        </h3>
      </div>
      <div className="text-sm text-ink-soft">{children}</div>
    </section>
  );
}

function StepBox({
  num,
  icon,
  title,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-3 rounded-xl bg-surface p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-on-accent">
        {num}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-ink">{title}</h3>
        </div>
        <div className="text-sm text-ink-soft">{children}</div>
      </div>
    </section>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded bg-canvas px-2 py-1.5 text-xs leading-relaxed text-ink-mute">
      {children}
    </div>
  );
}

function Trouble({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="font-bold text-accent-ink">{q}</dt>
      <dd className="ml-1 leading-relaxed text-ink-soft">{a}</dd>
    </div>
  );
}
