import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">五子棋AI平台</Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/">首页</Link></li>
        <li><Link to="/battle">单人AI测试</Link></li>
        <li><Link to="/login">多玩家对战</Link></li>
      </ul>
    </nav>
  )
}

export default Navbar