import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWeb3Context } from "../context/Web3Context";
import { ETAPAS } from "../utils/contract";
import QRCode from "qrcode";

const ETAPA_NOMES = ["Plantio", "Irrigação", "Adubação Orgânica", "Inspeção", "Colheita"];

function formatData(ts) {
  return new Date(Number(ts) * 1000).toLocaleString("pt-BR");
}

function shortAddr(addr) {
  return `${addr?.slice(0,8)}...${addr?.slice(-6)}`;
}

export default function Verificar() {
  const { produtoId: paramId } = useParams();
  const { contract, provider } = useWeb3Context();
  const navigate = useNavigate();

  const [busca, setBusca] = useState(paramId || "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [produto, setProduto] = useState(null);
  const [produtor, setProdutor] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [etapasConcluidas, setEtapasConcluidas] = useState([]);
  const qrRef = useRef(null);

  useEffect(() => {
    if (paramId) buscarProduto(paramId);
  }, [paramId, contract]);

  const buscarProduto = async (id = busca) => {
    if (!contract) { setErro("Conecte sua carteira para verificar."); return; }
    setCarregando(true); setErro(""); setProduto(null);

    try {
      const [resumo, hist, ec] = await Promise.all([
        contract.resumoProduto(id),
        contract.consultarHistorico(id),
        contract.etapasConcluidas(id),
      ]);
      const prod = await contract.consultarProdutor(resumo.produtor);

      setProduto({ id, ...resumo });
      setProdutor(prod);
      setHistorico([...hist]);
      setEtapasConcluidas([...ec]);

      // Gera QR code
      setTimeout(async () => {
        if (qrRef.current) {
          const url = `${window.location.origin}/verificar/${id}`;
          await QRCode.toCanvas(qrRef.current, url, {
            width: 180,
            color: { dark: "#2d4a22", light: "#edf7e6" },
            margin: 2,
          });
        }
      }, 100);

    } catch (e) {
      setErro("Produto não encontrado. Verifique o ID e tente novamente.");
    }
    setCarregando(false);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="section-header" style={{ textAlign: "center" }}>
          <div className="section-tag">Verificação Pública</div>
          <h2>Verificar Procedência Orgânica</h2>
          <p style={{ marginTop: "0.5rem" }}>
            Qualquer pessoa pode verificar a autenticidade de um produto orgânico registrado na blockchain.
          </p>
        </div>

        {/* ── Busca ── */}
        <div style={{ maxWidth: 500, margin: "0 auto 3rem", display: "flex", gap: "0.75rem" }}>
          <input
            className="form-input"
            placeholder="ID do produto (ex: 0, 1, 2...)"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === "Enter" && buscarProduto()}
          />
          <button className="btn btn-primary" onClick={() => buscarProduto()} disabled={carregando}>
            {carregando ? <span className="loader" /> : "🔍 Verificar"}
          </button>
        </div>

        {erro && <div className="alert alert-erro" style={{ maxWidth: 500, margin: "0 auto 2rem" }}>❌ {erro}</div>}

        {/* ── Resultado ── */}
        {produto && (
          <div className="animate-fade-up">

            {/* Certificado destaque */}
            {produto.certificado ? (
              <div className="certificado-card" style={{ marginBottom: "2rem", maxWidth: 700, margin: "0 auto 2rem" }}>
                <div className="certificado-badge">🏆 NFT Certificado · ImpactLedger</div>
                <div className="certificado-titulo">{produto.nomeProduto}</div>
                <div className="certificado-produto">
                  Lote: {produto.lote} · Produtor: {produtor?.nome}
                </div>
                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--verde-menta)" }}>
                    📍 {produtor?.localizacao}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--verde-menta)" }}>
                    🌿 {produtor?.cultura}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--verde-menta)" }}>
                    📅 {formatData(produto.dataInicio)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="alert alert-aviso" style={{ marginBottom: "2rem" }}>
                ⏳ Produto em processo de certificação — {Number(produto.numEtapas)} de 5 etapas concluídas.
              </div>
            )}

            <div className="two-col">
              {/* Coluna esquerda */}
              <div>
                {/* Dados do produtor */}
                <div className="card" style={{ marginBottom: "1.5rem" }}>
                  <div className="card-title">👨‍🌾 Produtor Verificado</div>
                  {[
                    { l: "Nome", v: produtor?.nome },
                    { l: "Localização", v: produtor?.localizacao },
                    { l: "Cultura", v: produtor?.cultura },
                    { l: "Endereço na blockchain", v: <span className="address">{shortAddr(produto.produtor)}</span> },
                    { l: "Registrado em", v: formatData(produtor?.dataRegistro) },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(90,158,64,0.08)", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--cinza-claro)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{l}</span>
                      <span style={{ fontSize: "0.88rem", color: "var(--verde-musgo)" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Etapas */}
                <div className="card">
                  <div className="card-title">📋 Etapas de Certificação</div>
                  <div className="etapas-grid">
                    {ETAPAS.map((et, i) => (
                      <div key={i} className={`etapa-item ${etapasConcluidas[i] ? "concluida" : ""}`}>
                        <span className="etapa-icon">{et.icon}</span>
                        <span className="etapa-nome">{et.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div>
                {/* QR Code */}
                <div className="qr-container" style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontFamily: "var(--fonte-display)", fontWeight: 700, color: "var(--verde-musgo)", marginBottom: "0.5rem" }}>
                    QR Code de Verificação
                  </div>
                  <canvas ref={qrRef} />
                  <p style={{ fontSize: "0.78rem", textAlign: "center", color: "var(--cinza-claro)" }}>
                    Escaneie para verificar a autenticidade
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const url = `${window.location.origin}/verificar/${produto.id}`;
                    navigator.clipboard?.writeText(url);
                  }}>
                    📋 Copiar Link de Verificação
                  </button>
                </div>

                {/* ID e dados técnicos */}
                <div className="card">
                  <div className="card-title">⛓️ Dados na Blockchain</div>
                  {[
                    { l: "ID do Produto", v: `#${produto.id}` },
                    { l: "Nome", v: produto.nomeProduto },
                    { l: "Código do Lote", v: produto.lote },
                    { l: "Início do Cultivo", v: formatData(produto.dataInicio) },
                    { l: "Status", v: produto.certificado ? <span className="badge badge-verde">✅ Certificado</span> : <span className="badge badge-cinza">⏳ Em andamento</span> },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(90,158,64,0.08)", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--cinza-claro)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{l}</span>
                      <span style={{ fontSize: "0.88rem", color: "var(--verde-musgo)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Histórico completo */}
            <div style={{ marginTop: "2rem" }}>
              <div className="section-header">
                <div className="section-tag">Registro Imutável</div>
                <h3>Histórico Completo na Blockchain</h3>
              </div>

              {historico.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p>Nenhuma etapa registrada ainda.</p>
                </div>
              ) : (
                <div className="timeline">
                  {historico.map((h, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot">{ETAPAS[h.etapa]?.icon || "🌿"}</div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-etapa">{ETAPA_NOMES[h.etapa]}</span>
                          <span className="timeline-data">{formatData(h.timestamp)}</span>
                        </div>
                        <p className="timeline-desc">{h.descricao}</p>
                        {h.evidenciaHash && h.evidenciaHash !== "sem-evidencia" && (
                          <div className="timeline-hash">🔒 Evidência: {h.evidenciaHash}</div>
                        )}
                        <div className="timeline-hash" style={{ marginTop: "0.25rem" }}>
                          👤 {shortAddr(h.registradoPor)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
