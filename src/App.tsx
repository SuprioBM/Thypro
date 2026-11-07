import React, { Suspense, lazy } from 'react';
import { Landing } from './Landing';
import { go, useRoute } from './app/router';
import { startSession } from './app/session';

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
      <Suspense fallback={<AppFallback />}>
        <AppRoot />
      </Suspense>
    );
  }
  return (
    <Landing
      onContinueAsGuest={(lang) => {
        startSession('guest', lang);
        go('today');
      }}
    />
  );
};

export default App;
