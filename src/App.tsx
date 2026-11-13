import React, { Suspense, lazy } from 'react';
import { Landing } from './Landing';
import { InfoPage } from './components/InfoPage';
import { go, leaveApp, useRoute } from './app/router';
import { startSession } from './app/session';
import { ErrorBoundary, ErrorState } from './app/ui/kit';
import { translate } from './i18n';

// The habit app is its own chunk: visitors to the marketing page never download it.
const AppRoot = lazy(() => import('./app/AppRoot'));

const AppFallback: React.FC = () => (
  <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-ivory-100">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-900/15 border-t-ochre-500" />
    <span className="sr-only">Loading</span>
  </div>
);

export const App: React.FC = () => {
  const route = useRoute();
  if (route.inApp) {
    return (
      <ErrorBoundary
        fallback={() => (
          <div className="mx-auto max-w-lg px-4 py-10">
            <ErrorState
              title={translate('en', 'shell.errorTitle')}
              body={translate('en', 'shell.errorBody')}
              retryLabel={translate('en', 'nav.website')}
              onRetry={leaveApp}
            />
          </div>
        )}
      >
        <Suspense fallback={<AppFallback />}>
          <AppRoot />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (route.page) return <InfoPage key={route.page} slug={route.page} />;
  return (
    <Landing
      onContinueAsGuest={(lang) => {
        startSession('guest', lang);
        go('today');
      }}
      onTryLoop={(lang) => {
        startSession('guest', lang);
        go('story');
      }}
    />
  );
};

export default App;
