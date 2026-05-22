import React from 'react';
import { UserProvider } from './context/UserContext';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <UserProvider>
      <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col">
        {/* Main Application Global Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                S
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">SocialSync</h1>
                <p className="text-xs text-slate-400">Multi-Channel Posting Engine</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/50">
                Dev Engine Active
              </span>
            </div>
          </div>
        </header>

        {/* Content Panel Box */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
          <Dashboard />
        </main>
      </div>
    </UserProvider>
  );
}

export default App;