import { useNavigate } from "react-router-dom";
import { useWeb3Context } from "../context/Web3Context";
import { useEffect, useState } from "react";

const FEATURES = [
  { icon: "🔗", titulo: "Registrado na Blockchain", desc: "Cada etapa do cultivo é gravada de forma permanente e imutável na blockchain Polygon." },
  { icon: "🌿", titulo: "100% Auditável", desc: "Qualquer pessoa pode verificar a procedência de um produto orgânico a qualquer momento." },
  { icon: "🏆", titulo: "NFT de Certificação", desc: "Ao concluir todas as etapas, o produtor recebe um NFT como certificado digital verificável." },
  { icon: "🔍", titulo: "Verificação por QR Code", desc: "Consumidores verificam a autenticidade do produto escaneando um QR Code na embalagem." },
];

export default function Home() {
  const navigate = useNavigate();
  const { contract } = useWeb3Context();
  const [stats, setStats] = useState({ produtores: "—", produtos: "—" });

  useEffect(() => {
    if (!contract) return;
    (async () => {
      try {
        const [p, pr] = await Promise.all([
          contract.totalProdutores(),
          contract.totalProdutos(),
        ]);
        setStats({ produtores: p.toString(), produtos: pr.toString() });
      } catch (_) {}
    })();
  }, [contract]);

  return (
    <div className="page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-tag animate-fade-up">
            🌾 Residência em TIC 29 · HackWeb Web3
          </div>
          <h1 className="hero-title animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Certificação Orgânica<br />
            <span>na Blockchain</span>
          </h1>
          <p className="hero-desc animate-fade-up" style={{ animationDelay: "0.2s" }}>
            O AgroProof transforma o histórico de cultivo orgânico em registros
            imutáveis e verificáveis publicamente — sem intermediários, sem falsificações.
          </p>
          <div className="hero-btns animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/produtor")}>
              🌱 Sou Produtor
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate("/verificar")}>
              🔍 Verificar Produto
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="container">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-valor">{stats.produtores}</div>
            <div className="stat-label">Produtores Registrados</div>
          </div>
          <div className="stat-card">
            <div className="stat-valor">{stats.produtos}</div>
            <div className="stat-label">Lotes na Blockchain</div>
          </div>
          <div className="stat-card">
            <div className="stat-valor">5</div>
            <div className="stat-label">Etapas Certificadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-valor">NFT</div>
            <div className="stat-label">Certificado Digital</div>
          </div>
        </div>

        <div className="divider" />

        {/* ── Features ── */}
        <div className="section-header">
          <div className="section-tag">Como funciona</div>
          <h2>Da terra à blockchain, cada etapa registrada</h2>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.titulo} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-titulo">{f.titulo}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* ── Fluxo ── */}
        <div className="section-header">
          <div className="section-tag">Jornada do Produtor</div>
          <h2>5 etapas para a certificação completa</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { num: "01", etapa: "Plantio 🌱",           desc: "Registre o início do plantio com localização e descrição do solo." },
            { num: "02", etapa: "Irrigação 💧",          desc: "Comprove o tipo e frequência de irrigação utilizada." },
            { num: "03", etapa: "Adubação Orgânica 🌿",  desc: "Registre os insumos orgânicos utilizados e suas origens." },
            { num: "04", etapa: "Inspeção 🔍",           desc: "Registre a inspeção do lote com evidências fotográficas." },
            { num: "05", etapa: "Colheita 🌾",           desc: "Ao registrar a colheita, o NFT de certificação é emitido automaticamente." },
          ].map((s) => (
            <div key={s.num} style={{
              display: "flex", gap: "1.5rem", alignItems: "flex-start",
              padding: "1.25rem", background: "var(--branco)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(90,158,64,0.12)"
            }}>
              <div style={{
                fontFamily: "var(--fonte-display)", fontWeight: 800,
                fontSize: "1.5rem", color: "var(--verde-claro)",
                minWidth: "2.5rem"
              }}>{s.num}</div>
              <div>
                <div style={{ fontFamily: "var(--fonte-display)", fontWeight: 700, color: "var(--verde-musgo)", marginBottom: "0.25rem" }}>{s.etapa}</div>
                <p style={{ fontSize: "0.88rem" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
