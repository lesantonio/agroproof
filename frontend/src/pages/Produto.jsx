import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWeb3Context } from "../context/Web3Context";
import { ETAPAS } from "../utils/contract";

export default function Produto() {
  const { contract, account, conectado, loading, executarTransacao, error, setError } = useWeb3Context();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const produtoIdParam = params.get("id");

  const [modo, setModo] = useState(produtoIdParam ? "etapa" : "lote"); // "lote" | "etapa"
  const [sucesso, setSucesso] = useState("");
  const [produtoId, setProdutoId] = useState(produtoIdParam || "");
  const [etapasConcluidas, setEtapasConcluidas] = useState([false,false,false,false,false]);
  const [resumo, setResumo] = useState(null);

  const [formLote, setFormLote] = useState({ nome: "", lote: "" });
  const [formEtapa, setFormEtapa] = useState({ etapa: "0", descricao: "", evidencia: "" });

  // Carrega estado do produto se ID informado
  useEffect(() => {
    if (!contract || !produtoId) return;
    (async () => {
      try {
        const ec = await contract.etapasConcluidas(produtoId);
        setEtapasConcluidas([...ec]);
        const r = await contract.resumoProduto(produtoId);
        setResumo(r);
      } catch (_) {}
    })();
  }, [contract, produtoId]);

  const handleRegistrarLote = async (e) => {
    e.preventDefault();
    setError(null); setSucesso("");
    try {
      const receipt = await executarTransacao(contract.registrarProduto, formLote.nome, formLote.lote);
      // Pega o ID do evento
      const event = receipt.logs?.find(l => l.fragment?.name === "ProdutoRegistrado");
      const novoId = event?.args?.[0]?.toString() || "0";
      setProdutoId(novoId);
      setSucesso(`Lote registrado na blockchain! ID: #${novoId} 🎉`);
      setModo("etapa");
    } catch (_) {}
  };

  const handleRegistrarEtapa = async (e) => {
    e.preventDefault();
    setError(null); setSucesso("");
    try {
      await executarTransacao(
        contract.registrarEtapa,
        produtoId,
        parseInt(formEtapa.etapa),
        formEtapa.descricao,
        formEtapa.evidencia || "sem-evidencia"
      );
      const etapaNome = ETAPAS[parseInt(formEtapa.etapa)].nome;
      setSucesso(`Etapa "${etapaNome}" registrada na blockchain! ✅`);
      // Atualiza estado
      const ec = await contract.etapasConcluidas(produtoId);
      setEtapasConcluidas([...ec]);
      const r = await contract.resumoProduto(produtoId);
      setResumo(r);
      setFormEtapa({ etapa: "0", descricao: "", evidencia: "" });

      if (r.certificado) {
        setSucesso("🏆 Todas as etapas concluídas! NFT de certificação emitido automaticamente!");
      }
    } catch (_) {}
  };

  if (!conectado) return (
    <div className="page">
      <div className="container">
        <div className="wallet-connect-banner">
          <div className="wallet-icon">🦊</div>
          <h2>Conecte sua Carteira</h2>
          <p style={{ marginBottom: "1.5rem" }}>Você precisa estar conectado para registrar lotes.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
          <button className={`btn ${modo === "lote" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setModo("lote")}>📦 Novo Lote</button>
          <button className={`btn ${modo === "etapa" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setModo("etapa")}>🌱 Registrar Etapa</button>
        </div>

        {error && <div className="alert alert-erro">❌ {error}</div>}
        {sucesso && <div className="alert alert-sucesso">{sucesso}</div>}

        {/* ── Registrar Lote ── */}
        {modo === "lote" && (
          <div className="card">
            <div className="card-title">📦 Novo Lote de Produção</div>
            <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Registre um novo lote na blockchain. Cada lote recebe um ID único imutável.
            </p>
            <form onSubmit={handleRegistrarLote}>
              <div className="form-group">
                <label className="form-label">Nome do Produto</label>
                <input className="form-input" placeholder="Ex: Tomate Cereja Orgânico"
                  value={formLote.nome} required
                  onChange={e => setFormLote({ ...formLote, nome: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Código do Lote</label>
                <input className="form-input" placeholder="Ex: LOTE-2024-001"
                  value={formLote.lote} required
                  onChange={e => setFormLote({ ...formLote, lote: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
                {loading ? <><span className="loader" /> Registrando...</> : "📦 Registrar Lote na Blockchain"}
              </button>
            </form>
          </div>
        )}

        {/* ── Registrar Etapa ── */}
        {modo === "etapa" && (
          <>
            {/* ID do produto */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-title">🆔 ID do Produto</div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input className="form-input" placeholder="ID do produto (ex: 0, 1, 2...)"
                  value={produtoId}
                  onChange={e => setProdutoId(e.target.value)} />
                <button className="btn btn-secondary" onClick={async () => {
                  if (!contract || !produtoId) return;
                  const ec = await contract.etapasConcluidas(produtoId);
                  setEtapasConcluidas([...ec]);
                  const r = await contract.resumoProduto(produtoId);
                  setResumo(r);
                }}>Carregar</button>
              </div>
            </div>

            {/* Status do produto */}
            {resumo && (
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontFamily: "var(--fonte-display)", fontWeight: 700, color: "var(--verde-musgo)" }}>
                      {resumo.nomeProduto}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--cinza-claro)" }}>Lote: {resumo.lote}</div>
                  </div>
                  {resumo.certificado
                    ? <span className="badge badge-verde">✅ Certificado NFT</span>
                    : <span className="badge badge-cinza">⏳ {Number(resumo.numEtapas)}/5 etapas</span>
                  }
                </div>

                {/* Etapas grid */}
                <div className="etapas-grid">
                  {ETAPAS.map((et, i) => (
                    <div key={i} className={`etapa-item ${etapasConcluidas[i] ? "concluida" : ""}`}>
                      <span className="etapa-icon">{et.icon}</span>
                      <span className="etapa-nome">{et.nome}</span>
                    </div>
                  ))}
                </div>

                {resumo.certificado && (
                  <div className="certificado-card" style={{ marginTop: "1rem" }}>
                    <div className="certificado-badge">🏆 NFT Emitido</div>
                    <div className="certificado-titulo">Produto Certificado</div>
                    <div className="certificado-produto">{resumo.nomeProduto} · Lote {resumo.lote}</div>
                  </div>
                )}
              </div>
            )}

            {/* Form etapa */}
            {resumo && !resumo.certificado && (
              <div className="card">
                <div className="card-title">🌱 Registrar Nova Etapa</div>
                <form onSubmit={handleRegistrarEtapa}>
                  <div className="form-group">
                    <label className="form-label">Etapa do Cultivo</label>
                    <select className="form-select"
                      value={formEtapa.etapa}
                      onChange={e => setFormEtapa({ ...formEtapa, etapa: e.target.value })}>
                      {ETAPAS.map((et, i) => (
                        <option key={i} value={i} disabled={etapasConcluidas[i]}>
                          {et.icon} {et.nome} {etapasConcluidas[i] ? "✓ (concluída)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição da Etapa</label>
                    <textarea className="form-textarea"
                      placeholder="Descreva detalhes desta etapa: técnicas, insumos, condições..."
                      value={formEtapa.descricao} required
                      onChange={e => setFormEtapa({ ...formEtapa, descricao: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hash de Evidência (opcional)</label>
                    <input className="form-input"
                      placeholder="Hash SHA-256 de foto ou documento comprobatório"
                      value={formEtapa.evidencia}
                      onChange={e => setFormEtapa({ ...formEtapa, evidencia: e.target.value })} />
                    <span style={{ fontSize: "0.75rem", color: "var(--cinza-claro)" }}>
                      Use sha256sum para gerar o hash de um arquivo de evidência
                    </span>
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
                    {loading ? <><span className="loader" /> Registrando na blockchain...</> : "✅ Registrar Etapa"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
