import React from 'react';
import { Sprout } from 'lucide-react';
import { useI18n } from '../../i18n';
import { Card } from '../ui/kit';

/** A no-shame offer to begin again smaller. Never a warning, never a penalty. */
export const RestartCard: React.FC<{
  days: number;
  canRestart: boolean;
  onRestart: () => void;
  onLater?: () => void;
}> = ({ days, canRestart, onRestart, onLater }) => {
  const { t } = useI18n();
  return (
    <Card tone="soft" className="border-sage-300" index={0} labelledBy="restart-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-700">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="restart-title" className="font-editorial text-lg text-forest-950">
            {t('today.restartTitle')}
          </h2>
          <p className="mt-1 text-sm text-forest-900/80">{t('today.restartBody', { days })}</p>
          {canRestart && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="thy-btn-primary min-h-[44px] !py-2.5" onClick={onRestart}>
                {t('today.restartCta')}
              </button>
              {onLater && (
                <button type="button" className="thy-btn-ghost min-h-[44px] !py-2.5" onClick={onLater}>
                  {t('today.restartLater')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
