import { useState } from "react";
import './App.css'
import { LoadingScreen } from './components/LoadingScreen'
import { Home } from "./components/sections/Home";
import { Login } from "./components/sections/Login";
import { Dashboard } from "./components/sections/Dashboard";

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <> {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
    <div className={`min-h-screen transition-opacity duration-700} ${isLoaded ? "opacity-100" : "opacity-0"} bg-black text-gray-100`}>
      <Home />
      <Login />
      <Dashboard />
      </div>
    </>
  )
}

export default App
