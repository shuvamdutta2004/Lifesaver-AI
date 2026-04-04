import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EmergencyProvider } from './context/EmergencyContext'
import Navbar from './components/Navbar'
import VoiceTrigger from './components/VoiceTrigger'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import WomenSafety from './pages/WomenSafety'
import DisasterMode from './pages/DisasterMode'
import ChatPage from './pages/ChatPage'

export default function App() {
  return (
    <EmergencyProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-bg-primary text-white font-sans">
          <Navbar />
          <VoiceTrigger />
          <Routes>
            <Route path="/"               element={<Home />} />
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/women-safety"   element={<WomenSafety />} />
            <Route path="/disaster"       element={<DisasterMode />} />
            <Route path="/chat"           element={<ChatPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </EmergencyProvider>
  )
}
