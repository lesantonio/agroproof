import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3Context } from "../context/Web3Context";

export default function Produtor() {
  const { contract, account, conectado, conectarCarteira, loading, executarTransacao, error, setError } = useWeb3Context();
  const navigate = useNavigate();

  const [produtor, setProdutor] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [form, setForm] = useState({ nome: "", localizacao: "", cultura: "" });
  const [produtos, setProdutos] = useState([]);

  // Carrega dados do produtor conectado
  useEffect(() => {
    if (!contract || !account) return;
    (async () => {
      setCarregando(true);
      try {
        const p = await contract.consultarProdutor(account);
        if (p.registrado) {
          setProdutor(p);
          const ids = await contract.consultarProdutosDoProdutor(account);
          const prods = await Promise.all(ids.map(id => contract.resumoProduto(id).then(r => ({ id: id.toString(), ...r }))));
          setProdutos(prods);
        }
      } catch (_) {}
      setCarregando(false);
    })();
  }, [contract, account]);

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setError(null);
    setSucesso("");
    try {
      await executarTransacao(
        contract.registrarProdutor,
        form.nome, form.localizacao, form.cultura
      );
      setSucesso("Produtor registrado com sucesso na blockchain! 🎉");
      const p = await contract.consultarProdutor(account);
      setProdutor(p);
    } catch (_) {}
  };

  if (!conectado) return (
    <div className="page">
      <div className="container">
        <div className="wallet-connect-banner">
          <div className="wallet-icon">🦊</div>
          <h2>Conecte sua Carteira</h2>
          <p style={{ marginBottom: "1.5rem" }}>Para acessar o painel do produtor, conecte sua carteira MetaMask.</p>
          <button className="btn btn-primary btn-lg" onClick={conectarCarteira}>
            Conectar MetaMask
          </button>
        </div>
      </div>
    </div>
  );

  if (carregando) return (
    <div className="page" style={{ textAlign: "center" }}>
      <span className="loader loader-dark" style={{ width: 32, height: 32 }} />
      <p style={{ marginTop: "1rem" }}>Consultando blockchain...</p>
    </div>
  );

  return (
    <div className="page">
      <div className="container">
        {/* ── Perfil do produtor já registrado ── */}
        {produtor ? (
          <>
            <div className="section-header">
              <div className="section-tag">Perfil na Blockchain</div>
              <h2>Olá, {produtor.nome} 👋</h2>
            </div>

            <div className="two-col" style={{ marginBottom: "2rem" }}>
              <div className="card">
                <div className="card-title">🌿 Seus Dados</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { label: "Nome", valor: produtor.nome },
                    { label: "Localização", valor: produtor.localizacao },
                    { label: "Cultura", valor: produtor.cultura },
                    { label: "Endereço", valor: <span className="address">{account}</span> },
                    { label: "Registro", valor: new Date(Number(produtor.dataRegistro) * 1000).toLocaleDateString("pt-BR") },
                  ].map(({ label, valor }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--cinza-claro)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--verde-musgo)", fontWeight: 500 }}>{valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">📊 Resumo</div>
                <div className="stats-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="stat-card">
                    <div className="stat-valor">{produtos.length}</div>
                    <div className="stat-label">Lotes Registrados</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-valor">{produtos.filter(p => p.certificado).length}</div>
                    <div className="stat-label">Certificados</div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}
                  onClick={() => navigate("/produto")}>
                  + Registrar Novo Lote
                </button>
              </div>
            </div>

            {/* Lista de produtos */}
            <div className="section-header">
              <div className="section-tag">Seus Lotes</div>
              <h3>Produtos registrados na blockchain</h3>
            </div>

            {produtos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>Nenhum lote registrado ainda.</p>
                <button className="btn btn-primary" style={{ marginTop: "1rem" }}
                  onClick={() => navigate("/produto")}>
                  Registrar Primeiro Lote
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {produtos.map((p) => (
                  <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
                    <div>
                      <div style={{ fontFamily: "var(--fonte-display)", fontWeight: 700, color: "var(--verde-musgo)" }}>
                        {p.nomeProduto}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--cinza-claro)" }}>
                        Lote: {p.lote} · {Number(p.numEtapas)} etapas registradas
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {p.certificado
                        ? <span className="badge badge-verde">✅ Certificado</span>
                        : <span className="badge badge-cinza">⏳ Em andamento</span>
                      }
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/verificar/${p.id}`)}>
                        Ver
                      </button>
                      {!p.certificado && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/produto?id=${p.id}`)}>
                          + Etapa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Formulário de registro ── */
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="section-header" style={{ textAlign: "center" }}>
              <div className="section-tag">Novo Produtor</div>
              <h2>Registre-se na Blockchain</h2>
              <p style={{ marginTop: "0.5rem" }}>Seu perfil será gravado permanentemente na Polygon.</p>
            </div>

            {error && <div className="alert alert-erro">❌ {error}</div>}
            {sucesso && <div className="alert alert-sucesso">{sucesso}</div>}

            <div className="card">
              <form onSubmit={handleRegistrar}>
                <div className="form-group">
                  <label className="form-label">Nome do Produtor</label>
                  <input className="form-input" placeholder="Ex: João da Silva"
                    value={form.nome} required
                    onChange={e => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Localização</label>
                  <input className="form-input" placeholder="Ex: Zona Rural de Lavras, MG"
                    value={form.localizacao} required
                    onChange={e => setForm({ ...form, localizacao: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cultura Principal</label>
                  <input className="form-input" placeholder="Ex: Tomate Orgânico"
                    value={form.cultura} required
                    onChange={e => setForm({ ...form, cultura: e.target.value })} />
                </div>
                <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
                  {loading ? <><span className="loader" /> Registrando na blockchain...</> : "🌱 Registrar como Produtor"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
