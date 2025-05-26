import { useEffect, useState } from 'react';
import './App.css';
import { LoadingScreen } from './components/LoadingScreen';
import { Home } from './components/sections/Home';
import { Login } from "./components/sections/Login";
import { Dashboard } from "./components/sections/Dashboard";
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from "./context/ProtectedRoute";
import { supabase } from './supabaseClient'; // adjust this import to your supabase client file

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsLoaded(true); // user is logged in — skip loading screen
      }
      setCheckingSession(false);
    }

    checkSession();
  }, []);

  if (checkingSession) {
    // while checking session, render nothing or a spinner
    return null;
  }

  return (
    <>
      {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
      <Routes>
        <Route
          path="/"
          element={
            <div
              className={`min-h-screen transition-opacity duration-700 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } bg-black text-gray-100`}
            >
              <Home />
              <Login />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;