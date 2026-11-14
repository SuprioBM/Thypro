import React, { useState } from 'react';
import { BarChart3, ClipboardList, Dumbbell, Home } from 'lucide-react';
import { useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { ScreenHeader } from '../ui/kit';
import { LibraryTab, Onboarding, PlanTab, ProgressTab, TodayTab } from './StrengthTabs';

type Tab = 'today' | 'plan' | 'library' | 'progress';

const TABS: { id: Tab; icon: typeof Home }[] = [
  { id: 'today', icon: Home },
  { id: 'plan', icon: ClipboardList },
  { id: 'library', icon: Dumbbell },
  { id: 'progress', icon: BarChart3 }
];

/** Strength & mobility: one screen, four sections. */
export const Strength: React.FC = () => {
  const { t } = useI18n();
  const { state } = useStore();
  const plan = state.strength.plan;
  const [tab, setTab] = useState<Tab>('today');

  return (
    <div>
      <ScreenHeader title={t('st.title')} subtitle={t('st.subtitle')} />

      {!plan ? (
        <>
          <Onboarding />
          {/* Even before choosing a plan, the exercises can be browsed. */}
          <div className="mt-8">
            <h2 className="mb-3 font-editorial text-xl text-forest-950">{t('st.tab.library')}</h2>
            <LibraryTab />
          </div>
        </>
      ) : (
        <>
          <div className="thy-seg mb-5 w-full justify-between sm:w-auto" role="tablist" aria-label={t('st.tabs')}>
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`st-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="st-panel"
                onClick={() => setTab(id)}
                className="thy-seg-btn !shrink flex-1 justify-center !px-2 sm:!px-4 sm:flex-none"
              >
                <Icon className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
                <span>{t(`st.tab.${id}` as Key)}</span>
              </button>
            ))}
          </div>

          <div key={tab} id="st-panel" role="tabpanel" aria-labelledby={`st-tab-${tab}`} className="thy-swap">
            {tab === 'today' && <TodayTab plan={plan} />}
            {tab === 'plan' && <PlanTab plan={plan} />}
            {tab === 'library' && <LibraryTab />}
            {tab === 'progress' && <ProgressTab />}
          </div>
        </>
      )}
    </div>
  );
};
