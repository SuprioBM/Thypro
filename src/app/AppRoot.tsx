import React, { useEffect, useState } from 'react';
import { AppShell } from './AppShell';
import { Entry } from './Entry';
import { go, parseHash, useRoute, type Screen } from './router';
import { endSession, readSession, startSession, type EntryMode } from './session';
import { AccountGate } from './cloud/AccountGate';
import { StoreProvider } from './store';
import type { Lang } from '../domain/types';

/**
 * Entry point for everything under #/app.
 * No session yet → the start screen (language + guest/local). With a session
 * → the shell. A guest session lives only in memory, so a reload returns here.
 */
const AppRoot: React.FC = () => {
  const route = useRoute();
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    // Read the live hash, not React state: right after "Start", state can still say 'start'
    // while the hash already points at the screen we just chose (e.g. setup).
    const current = parseHash(window.location.hash).screen;
    if (session && current === 'start') go('today');
    if (!session && current !== 'start') go('start');
  }, [session, route.screen]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.screen]);

  if (!session) {
    return (
      <Entry
        initialLang="en"
        onStart={(mode: EntryMode, lang: Lang) => {
          startSession(mode, lang);
          setSession({ mode, lang });
          go(mode === 'local' ? 'setup' : 'today');
        }}
      />
    );
  }

  const screen: Exclude<Screen, 'start'> = route.screen === 'start' ? 'today' : route.screen;
  if (session.mode === 'account') {
    return (
      <AccountGate
        lang={session.lang}
        onCancel={() => {
          endSession();
          setSession(null);
          go('start');
        }}
      >
        {({ persistence, onExit }) => (
          <StoreProvider mode="local" lang={session.lang} persistence={persistence} onExit={onExit}>
            <AppShell screen={screen} />
          </StoreProvider>
        )}
      </AccountGate>
    );
  }
  return (
    <StoreProvider mode={session.mode} lang={session.lang}>
      <AppShell screen={screen} />
    </StoreProvider>
  );
};

export default AppRoot;
