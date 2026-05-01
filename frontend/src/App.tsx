// import { useState } from 'react';
// import { HomePage }      from './pages/HomePage';
// import { SessionPage }   from './pages/SessionPage';
// import { RecordingsPage } from './pages/RecordingsPage';
// import { AddressBookPage } from './pages/AddressBookPage';
// import { SettingsPage, ProfilePage } from './pages/SettingsPage';
// import { AuthPage }      from './auth/AuthPage';
// import { useAuth }       from './auth/AuthProvider';

// export type Page = 'home' | 'session' | 'recordings' | 'addressbook' | 'settings' | 'profile';

// export default function App() {
//   const [page, setPage]             = useState<Page>('home');
//   const [sessionData, setSessionData] = useState<{
//     myId: string; remoteId: string; isHost: boolean;
//   } | null>(null);

//   const { isLoading, isAuthenticated } = useAuth();

//   // ── Loading spinner ───────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#080809] flex flex-col items-center justify-center gap-3"
//         style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
//         <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
//         <p className="text-white/30 text-sm">Loading...</p>
//       </div>
//     );
//   }

//   // ── Auth gate — optional: user can skip with "Continue without account" ───
//   const skippedAuth = sessionStorage.getItem('rda_skip_auth') === '1';
//   if (!isAuthenticated && !skippedAuth) {
//     return <AuthPage />;
//   }

//   // ── Navigation ────────────────────────────────────────────────────────────
//   const navigate = (p: Page) => setPage(p);

//   const startSession = (myId: string, remoteId: string, isHost: boolean) => {
//     setSessionData({ myId, remoteId, isHost });
//     setPage('session');
//   };

//   const endSession = () => {
//     setSessionData(null);
//     setPage('home');
//   };

//   if (page === 'session' && sessionData) {
//     return (
//       <SessionPage
//         myId={sessionData.myId}
//         remoteId={sessionData.remoteId}
//         isHostInitial={sessionData.isHost}
//         onEnd={endSession}
//       />
//     );
//   }

//   if (page === 'recordings')  return <RecordingsPage  onBack={() => navigate('home')} />;
//   if (page === 'addressbook') return <AddressBookPage onBack={() => navigate('home')} onConnect={(id) => startSession('', id, false)} />;
//   if (page === 'settings')    return <SettingsPage    onBack={() => navigate('home')} />;
//   if (page === 'profile')     return <ProfilePage     onBack={() => navigate('home')} />;

//   return <HomePage onStartSession={startSession} onNavigate={navigate} />;
// }




import { useState } from 'react';
import { HomePage }       from './pages/HomePage';
import { SessionPage }    from './pages/SessionPage';
import { RecordingsPage } from './pages/RecordingsPage';
import { AddressBookPage } from './pages/AddressBookPage';
import { SettingsPage, ProfilePage } from './pages/SettingsPage';
import { useAuth } from './auth/AuthProvider';

export type Page = 'home' | 'session' | 'recordings' | 'addressbook' | 'settings' | 'profile';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [sessionData, setSessionData] = useState<{
    myId: string; remoteId: string; isHost: boolean;
  } | null>(null);

  const { isLoading, isAuthenticated } = useAuth();

  // Loading screen while Keycloak initialises
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#080809] flex flex-col items-center justify-center gap-3"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/30 text-sm">Connecting to authentication...</p>
      </div>
    );
  }

  // Safety net — login-required mode redirects automatically,
  // so this state is normally invisible.
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-[#080809] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <p className="text-white/30 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  const navigate = (p: Page) => setPage(p);

  const startSession = (myId: string, remoteId: string, isHost: boolean) => {
    setSessionData({ myId, remoteId, isHost });
    setPage('session');
  };

  const endSession = () => {
    setSessionData(null);
    setPage('home');
  };

  if (page === 'session' && sessionData) {
    return (
      <SessionPage
        myId={sessionData.myId}
        remoteId={sessionData.remoteId}
        isHostInitial={sessionData.isHost}
        onEnd={endSession}
      />
    );
  }

  if (page === 'recordings')  return <RecordingsPage  onBack={() => navigate('home')} />;
  if (page === 'addressbook') return <AddressBookPage onBack={() => navigate('home')} onConnect={id => startSession('', id, false)} />;
  if (page === 'settings')    return <SettingsPage    onBack={() => navigate('home')} />;
  if (page === 'profile')     return <ProfilePage     onBack={() => navigate('home')} />;

  return <HomePage onStartSession={startSession} onNavigate={navigate} />;
}