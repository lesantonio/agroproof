// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgroProof
 * @dev Plataforma de certificação de agricultores orgânicos na blockchain.
 * Registra etapas do cultivo e emite NFT de certificação ao concluir.
 */
contract AgroProof is ERC721, ERC721URIStorage, Ownable {

    // ─── Tipos e Estruturas ───────────────────────────────────────────────────

    enum EtapaCultivo {
        Plantio,        // 0
        Irrigacao,      // 1
        AdubacaoOrganica, // 2
        Inspecao,       // 3
        Colheita        // 4
    }

    struct Produtor {
        string nome;
        string localizacao;
        string cultura;       // ex: "Tomate Orgânico", "Café Arábica"
        address carteira;
        bool registrado;
        uint256 dataRegistro;
    }

    struct RegistroEtapa {
        EtapaCultivo etapa;
        string descricao;
        string evidenciaHash;  // hash IPFS ou SHA256 de foto/documento
        uint256 timestamp;
        address registradoPor;
    }

    struct Produto {
        uint256 id;
        address produtor;
        string nomeProduto;
        string lote;
        uint256 dataInicio;
        bool certificado;
        uint256 tokenId;       // NFT emitido (0 se não certificado)
        RegistroEtapa[] etapas;
        bool[5] etapasConcluidas; // mapeamento de quais etapas foram feitas
    }

    // ─── Estado ────────────────────────────────────────────────────────────────

    mapping(address => Produtor) public produtores;
    mapping(uint256 => Produto) public produtos;
    mapping(address => uint256[]) public produtosPorProdutor;

    uint256 private _produtoIdCounter;
    uint256 private _tokenIdCounter;

    address[] public listaProdutores;

    // ─── Eventos ───────────────────────────────────────────────────────────────

    event ProdutorRegistrado(address indexed carteira, string nome, string cultura);
    event ProdutoRegistrado(uint256 indexed produtoId, address indexed produtor, string nomeProduto, string lote);
    event EtapaRegistrada(uint256 indexed produtoId, EtapaCultivo etapa, string descricao, uint256 timestamp);
    event CertificadoEmitido(uint256 indexed produtoId, address indexed produtor, uint256 tokenId);

    // ─── Modificadores ─────────────────────────────────────────────────────────

    modifier apenasProdutorRegistrado() {
        require(produtores[msg.sender].registrado, "Produtor nao registrado");
        _;
    }

    modifier produtoExiste(uint256 produtoId) {
        require(produtoId < _produtoIdCounter, "Produto nao existe");
        _;
    }

    modifier apenasDonoDoProsduto(uint256 produtoId) {
        require(produtos[produtoId].produtor == msg.sender, "Nao e o dono do produto");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor() ERC721("AgroProof Certificate", "AGRO") Ownable(msg.sender) {}

    // ─── Funções Principais ────────────────────────────────────────────────────

    /**
     * @dev Registra um novo produtor na plataforma
     */
    function registrarProdutor(
        string calldata nome,
        string calldata localizacao,
        string calldata cultura
    ) external {
        require(!produtores[msg.sender].registrado, "Produtor ja registrado");
        require(bytes(nome).length > 0, "Nome invalido");
        require(bytes(cultura).length > 0, "Cultura invalida");

        produtores[msg.sender] = Produtor({
            nome: nome,
            localizacao: localizacao,
            cultura: cultura,
            carteira: msg.sender,
            registrado: true,
            dataRegistro: block.timestamp
        });

        listaProdutores.push(msg.sender);

        emit ProdutorRegistrado(msg.sender, nome, cultura);
    }

    /**
     * @dev Registra um novo produto/lote para cultivo
     */
    function registrarProduto(
        string calldata nomeProduto,
        string calldata lote
    ) external apenasProdutorRegistrado returns (uint256) {
        require(bytes(nomeProduto).length > 0, "Nome do produto invalido");
        require(bytes(lote).length > 0, "Lote invalido");

        uint256 produtoId = _produtoIdCounter++;

        Produto storage novoProduto = produtos[produtoId];
        novoProduto.id = produtoId;
        novoProduto.produtor = msg.sender;
        novoProduto.nomeProduto = nomeProduto;
        novoProduto.lote = lote;
        novoProduto.dataInicio = block.timestamp;
        novoProduto.certificado = false;
        novoProduto.tokenId = 0;

        produtosPorProdutor[msg.sender].push(produtoId);

        emit ProdutoRegistrado(produtoId, msg.sender, nomeProduto, lote);

        return produtoId;
    }

    /**
     * @dev Registra uma etapa do cultivo para um produto
     */
    function registrarEtapa(
        uint256 produtoId,
        EtapaCultivo etapa,
        string calldata descricao,
        string calldata evidenciaHash
    ) external
        produtoExiste(produtoId)
        apenasDonoDoProsduto(produtoId)
    {
        Produto storage produto = produtos[produtoId];
        require(!produto.certificado, "Produto ja certificado");
        require(!produto.etapasConcluidas[uint256(etapa)], "Etapa ja registrada");
        require(bytes(descricao).length > 0, "Descricao invalida");

        produto.etapas.push(RegistroEtapa({
            etapa: etapa,
            descricao: descricao,
            evidenciaHash: evidenciaHash,
            timestamp: block.timestamp,
            registradoPor: msg.sender
        }));

        produto.etapasConcluidas[uint256(etapa)] = true;

        emit EtapaRegistrada(produtoId, etapa, descricao, block.timestamp);

        // Verifica se todas as 5 etapas foram concluídas
        if (_todasEtapasConcluidas(produto.etapasConcluidas)) {
            _emitirCertificado(produtoId);
        }
    }

    // ─── Funções de Consulta ───────────────────────────────────────────────────

    /**
     * @dev Retorna o histórico completo de etapas de um produto
     */
    function consultarHistorico(uint256 produtoId)
        external
        view
        produtoExiste(produtoId)
        returns (RegistroEtapa[] memory)
    {
        return produtos[produtoId].etapas;
    }

    /**
     * @dev Retorna os dados do produtor
     */
    function consultarProdutor(address carteira)
        external
        view
        returns (Produtor memory)
    {
        return produtores[carteira];
    }

    /**
     * @dev Retorna todos os produtos de um produtor
     */
    function consultarProdutosDoProdutor(address produtor)
        external
        view
        returns (uint256[] memory)
    {
        return produtosPorProdutor[produtor];
    }

    /**
     * @dev Retorna o número total de produtores
     */
    function totalProdutores() external view returns (uint256) {
        return listaProdutores.length;
    }

    /**
     * @dev Retorna o número total de produtos
     */
    function totalProdutos() external view returns (uint256) {
        return _produtoIdCounter;
    }

    /**
     * @dev Verifica quais etapas foram concluídas para um produto
     */
    function etapasConcluidas(uint256 produtoId)
        external
        view
        produtoExiste(produtoId)
        returns (bool[5] memory)
    {
        return produtos[produtoId].etapasConcluidas;
    }

    /**
     * @dev Retorna dados resumidos de um produto (sem etapas para economizar gas)
     */
    function resumoProduto(uint256 produtoId)
        external
        view
        produtoExiste(produtoId)
        returns (
            string memory nomeProduto,
            string memory lote,
            address produtor,
            uint256 dataInicio,
            bool certificado,
            uint256 numEtapas
        )
    {
        Produto storage p = produtos[produtoId];
        return (
            p.nomeProduto,
            p.lote,
            p.produtor,
            p.dataInicio,
            p.certificado,
            p.etapas.length
        );
    }

    // ─── Funções Internas ──────────────────────────────────────────────────────

    function _todasEtapasConcluidas(bool[5] storage etapas)
        internal
        view
        returns (bool)
    {
        for (uint256 i = 0; i < 5; i++) {
            if (!etapas[i]) return false;
        }
        return true;
    }

    function _emitirCertificado(uint256 produtoId) internal {
        Produto storage produto = produtos[produtoId];
        produto.certificado = true;

        uint256 tokenId = _tokenIdCounter++;
        produto.tokenId = tokenId;

        // Monta URI simples do certificado (em produção seria IPFS)
        string memory tokenURI = string(abi.encodePacked(
            "https://agroproof.app/certificate/", _toString(produtoId)
        ));

        _safeMint(produto.produtor, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit CertificadoEmitido(produtoId, produto.produtor, tokenId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ─── Overrides ERC721 ──────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
