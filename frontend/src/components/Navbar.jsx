import { NavLink, useNavigate } from "react-router-dom";
import { useWeb3Context } from "../context/Web3Context";

export default function Navbar() {
  const { account, conectado, conectarCarteira, loading } = useWeb3Context();
  const navigate = useNavigate();

  const short = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-logo" onClick={() => navigate("/")}>
          <div className="logo-icon">🌱</div>
          AgroProof
        </button>

        <ul className="navbar-links">
          <li><NavLink to="/">Início</NavLink></li>
          <li><NavLink to="/produtor">Meu Perfil</NavLink></li>
          <li><NavLink to="/produto">Registrar Lote</NavLink></li>
          <li><NavLink to="/verificar">Verificar</NavLink></li>
        </ul>

        <div>
          {conectado ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                width: 8, height: 8,
                background: "var(--verde-vivo)",
                borderRadius: "50%",
                display: "inline-block",
                animation: "pulse-verde 2s infinite"
              }} />
              <span className="address">{short(account)}</span>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={conectarCarteira}
              disabled={loading}
            >
              {loading ? <span className="loader" /> : "🦊 Conectar Carteira"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
