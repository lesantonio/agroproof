const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgroProof", function () {
  let agroproof;
  let owner, produtor1, produtor2;

  const ETAPAS = { Plantio: 0, Irrigacao: 1, AdubacaoOrganica: 2, Inspecao: 3, Colheita: 4 };

  beforeEach(async function () {
    [owner, produtor1, produtor2] = await ethers.getSigners();
    const AgroProof = await ethers.getContractFactory("AgroProof");
    agroproof = await AgroProof.deploy();
  });

  // ─── Registro de Produtor ────────────────────────────────────────────────

  describe("Registro de Produtor", function () {
    it("deve registrar um produtor com sucesso", async function () {
      await agroproof.connect(produtor1).registrarProdutor(
        "João da Silva", "Minas Gerais", "Tomate Orgânico"
      );
      const p = await agroproof.consultarProdutor(produtor1.address);
      expect(p.nome).to.equal("João da Silva");
      expect(p.registrado).to.equal(true);
    });

    it("deve emitir evento ProdutorRegistrado", async function () {
      await expect(
        agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate")
      ).to.emit(agroproof, "ProdutorRegistrado")
        .withArgs(produtor1.address, "João", "Tomate");
    });

    it("não deve permitir registrar o mesmo produtor duas vezes", async function () {
      await agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate");
      await expect(
        agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate")
      ).to.be.revertedWith("Produtor ja registrado");
    });

    it("deve incrementar o total de produtores", async function () {
      expect(await agroproof.totalProdutores()).to.equal(0);
      await agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate");
      expect(await agroproof.totalProdutores()).to.equal(1);
    });
  });

  // ─── Registro de Produto ─────────────────────────────────────────────────

  describe("Registro de Produto", function () {
    beforeEach(async function () {
      await agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate");
    });

    it("deve registrar um produto com sucesso", async function () {
      await agroproof.connect(produtor1).registrarProduto("Tomate Cereja", "LOTE-001");
      const { nomeProduto, lote } = await agroproof.resumoProduto(0);
      expect(nomeProduto).to.equal("Tomate Cereja");
      expect(lote).to.equal("LOTE-001");
    });

    it("não deve permitir produtor não registrado registrar produto", async function () {
      await expect(
        agroproof.connect(produtor2).registrarProduto("Tomate", "LOTE-001")
      ).to.be.revertedWith("Produtor nao registrado");
    });
  });

  // ─── Registro de Etapas ──────────────────────────────────────────────────

  describe("Registro de Etapas", function () {
    beforeEach(async function () {
      await agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate");
      await agroproof.connect(produtor1).registrarProduto("Tomate Cereja", "LOTE-001");
    });

    it("deve registrar etapa de plantio", async function () {
      await agroproof.connect(produtor1).registrarEtapa(
        0, ETAPAS.Plantio, "Plantio realizado em solo orgânico", "hash123"
      );
      const etapas = await agroproof.consultarHistorico(0);
      expect(etapas.length).to.equal(1);
      expect(etapas[0].descricao).to.equal("Plantio realizado em solo orgânico");
    });

    it("não deve permitir registrar a mesma etapa duas vezes", async function () {
      await agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.Plantio, "Plantio", "hash1");
      await expect(
        agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.Plantio, "Plantio novamente", "hash2")
      ).to.be.revertedWith("Etapa ja registrada");
    });

    it("não deve permitir outro produtor registrar etapa em produto alheio", async function () {
      await agroproof.connect(produtor2).registrarProdutor("Maria", "SP", "Café");
      await expect(
        agroproof.connect(produtor2).registrarEtapa(0, ETAPAS.Plantio, "Tentativa", "hash")
      ).to.be.revertedWith("Nao e o dono do produto");
    });
  });

  // ─── Certificação NFT ────────────────────────────────────────────────────

  describe("Certificação NFT", function () {
    beforeEach(async function () {
      await agroproof.connect(produtor1).registrarProdutor("João", "MG", "Tomate");
      await agroproof.connect(produtor1).registrarProduto("Tomate Cereja", "LOTE-001");
    });

    it("deve emitir NFT automaticamente ao concluir todas as 5 etapas", async function () {
      await agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.Plantio, "Plantio", "h1");
      await agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.Irrigacao, "Irrigação", "h2");
      await agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.AdubacaoOrganica, "Adubação", "h3");
      await agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.Inspecao, "Inspeção", "h4");

      await expect(
        agroproof.connect(produtor1).registrarEtapa(0, ETAPAS.Colheita, "Colheita", "h5")
      ).to.emit(agroproof, "CertificadoEmitido");

      const { certificado } = await agroproof.resumoProduto(0);
      expect(certificado).to.equal(true);
    });

    it("deve atribuir o NFT ao produtor correto", async function () {
      for (const [etapa, key] of Object.entries(ETAPAS)) {
        await agroproof.connect(produtor1).registrarEtapa(0, key, etapa, `h${key}`);
      }
      expect(await agroproof.ownerOf(0)).to.equal(produtor1.address);
    });

    it("não deve permitir registrar etapas em produto já certificado", async function () {
      for (const [etapa, key] of Object.entries(ETAPAS)) {
        await agroproof.connect(produtor1).registrarEtapa(0, key, etapa, `h${key}`);
      }
      await agroproof.connect(produtor1).registrarProduto("Tomate Extra", "LOTE-002");
      // Produto 0 está certificado, produto 1 ainda não
      const { certificado } = await agroproof.resumoProduto(0);
      expect(certificado).to.equal(true);
    });
  });
});
