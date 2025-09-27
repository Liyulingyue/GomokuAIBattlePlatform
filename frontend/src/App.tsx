import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Battle from './pages/Battle'
import Login from './pages/Login'
import Room from './pages/Room'
import MultiplayerBattle from './pages/MultiplayerBattle'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/room" element={<Room />} />
          <Route path="/multiplayer-battle" element={<MultiplayerBattle />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
