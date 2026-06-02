// ABI do contrato AgroProof — gerado pelo Hardhat após compilação
// Para atualizar: copie o conteúdo de artifacts/contracts/AgroProof.sol/AgroProof.json

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const CONTRACT_ABI = [
  // Eventos
  "event ProdutorRegistrado(address indexed carteira, string nome, string cultura)",
  "event ProdutoRegistrado(uint256 indexed produtoId, address indexed produtor, string nomeProduto, string lote)",
  "event EtapaRegistrada(uint256 indexed produtoId, uint8 etapa, string descricao, uint256 timestamp)",
  "event CertificadoEmitido(uint256 indexed produtoId, address indexed produtor, uint256 tokenId)",

  // Write functions
  "function registrarProdutor(string nome, string localizacao, string cultura)",
  "function registrarProduto(string nomeProduto, string lote) returns (uint256)",
  "function registrarEtapa(uint256 produtoId, uint8 etapa, string descricao, string evidenciaHash)",

  // Read functions
  "function consultarProdutor(address carteira) view returns (tuple(string nome, string localizacao, string cultura, address carteira, bool registrado, uint256 dataRegistro))",
  "function consultarHistorico(uint256 produtoId) view returns (tuple(uint8 etapa, string descricao, string evidenciaHash, uint256 timestamp, address registradoPor)[])",
  "function consultarProdutosDoProdutor(address produtor) view returns (uint256[])",
  "function resumoProduto(uint256 produtoId) view returns (string nomeProduto, string lote, address produtor, uint256 dataInicio, bool certificado, uint256 numEtapas)",
  "function etapasConcluidas(uint256 produtoId) view returns (bool[5])",
  "function totalProdutores() view returns (uint256)",
  "function totalProdutos() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

export const ETAPAS = [
  { id: 0, nome: "Plantio",           icon: "🌱", cor: "#4ade80" },
  { id: 1, nome: "Irrigação",         icon: "💧", cor: "#60a5fa" },
  { id: 2, nome: "Adubação Orgânica", icon: "🌿", cor: "#a3e635" },
  { id: 3, nome: "Inspeção",          icon: "🔍", cor: "#fbbf24" },
  { id: 4, nome: "Colheita",          icon: "🌾", cor: "#f97316" },
];

export const REDE_CONFIG = {
  chainId: "0x13882", // Polygon Amoy = 80002
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};
