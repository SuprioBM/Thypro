import React from 'react';
import { BarChart3, Dumbbell, BellRing, BookOpen, ChevronRight, FileDown, Globe, Lightbulb, LogOut, PieChart, ScrollText, SlidersHorizontal } from 'lucide-react';
import type { Key } from '../../i18n';
import { useI18n } from '../../i18n';
import { go, type Screen } from '../router';
import { useStore } from '../store';
import { Card, ScreenHeader } from '../ui/kit';
import { LanguageSelect } from '../components/LanguageSelect';

const LINKS: { screen: Screen; icon: typeof BellRing; key: Key }[] = [
  { screen: 'strength', icon: Dumbbell, key: 'nav.strength' },
  { screen: 'settings', icon: SlidersHorizontal, key: 'nav.settings' },
  { screen: 'story', icon: BookOpen, key: 'nav.story' },
  { screen: 'reminders', icon: BellRing, key: 'nav.reminders' },
  { screen: 'techniques', icon: Lightbulb, key: 'nav.techniques' },
  { screen: 'export', icon: FileDown, key: 'nav.export' },
  { screen: 'audit', icon: ScrollText, key: 'nav.audit' },
  { screen: 'pilot', icon: BarChart3, key: 'nav.pilot' },
  { screen: 'sponsor', icon: PieChart, key: 'nav.sponsor' }
];

export const More: React.FC = () => {
  const { t } = useI18n();
  const { exitSession } = useStore();
  return (
    <div className="space-y-4">
      <ScreenHeader title={t('more.title')} />
      <Card index={0} className="!p-2">
        <ul>
          {LINKS.map(({ screen, icon: Icon, key }) => (
            <li key={screen}>
              <button type="button" onClick={() => go(screen)} className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-start hover:bg-forest-900/[0.04]">
                <Icon className="h-5 w-5 text-ochre-700" aria-hidden="true" />
                <span className="flex-1 text-base text-forest-950">{t(key)}</span>
                <ChevronRight className="h-4 w-4 text-forest-800/50 flip-rtl" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card index={1} className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-ochre-700" aria-hidden="true" />
        <LanguageSelect className="flex-1" />
      </Card>
      <Card index={2} className="!p-2">
        <button type="button" onClick={exitSession} className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-start hover:bg-forest-900/[0.04]">
          <LogOut className="h-5 w-5 text-forest-800" aria-hidden="true" />
          <span className="text-base text-forest-950">{t('nav.exit')}</span>
        </button>
      </Card>
    </div>
  );
};
