import React, { useEffect, useState } from 'react';
import { AppShell } from './AppShell';
import { Entry } from './Entry';
import { go, useRoute, type Screen } from './router';
import { readSession, startSession } from './session';
import { StoreProvider } from './store';
import type { Lang, SessionMode } from '../domain/types';

/**
 * Entry point for everything under #/app.
 * No session yet → the start screen (language + guest/local). With a session
 * → the shell. A guest session lives only in memory, so a reload returns here.
 */
const AppRoot: React.FC = () => {
  const route = useRoute();
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    if (session && route.screen === 'start') go('today');
    if (!session && route.screen !== 'start') go('start');
  }, [session, route.screen]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.screen]);

  if (!session) {
    return (
      <Entry
        initialLang="en"
        onStart={(mode: SessionMode, lang: Lang) => {
          startSession(mode, lang);
          setSession({ mode, lang });
          go(mode === 'local' ? 'setup' : 'today');
        }}
      />
    );
  }

  const screen: Exclude<Screen, 'start'> = route.screen === 'start' ? 'today' : route.screen;
  return (
    <StoreProvider mode={session.mode} lang={session.lang}>
      <AppShell screen={screen} />
    </StoreProvider>
  );
};

export default AppRoot;
