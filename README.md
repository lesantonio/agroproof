# 🌱 AgroProof — Certificação de Agricultores Orgânicos na Blockchain

> **HackWeb · Residência em TIC 29 · Desafio 3 — ImpactLedger**
> Trilha: Blockchain + Smart Contracts

---

## 📌 Sobre o Projeto

O **AgroProof** é uma plataforma Web3 que registra cada etapa do cultivo orgânico na blockchain Polygon, tornando o histórico de produção **imutável, auditável e verificável publicamente** — sem depender de certificadoras centralizadas.

### O Problema

Produtores orgânicos frequentemente enfrentam:
- Falta de credibilidade por ausência de rastreabilidade confiável
- Dependência de certificadoras centralizadas (processo caro e burocrático)
- Impossibilidade de consumidores verificarem de forma independente a procedência
- Registros em planilhas/documentos físicos — facilmente adulteráveis

### A Solução

O AgroProof transforma o histórico de cultivo em **evidências digitais verificáveis na blockchain**:

1. **Produtor registra** seu perfil na blockchain (imutável)
2. **Cria um lote** para cada safra com código único
3. **Registra 5 etapas**: Plantio → Irrigação → Adubação Orgânica → Inspeção → Colheita
4. Ao concluir todas as etapas, um **NFT de Certificação** é emitido automaticamente
5. **Consumidores e parceiros** verificam a procedência pelo QR Code — sem login, sem intermediários

---

## 🏗️ Arquitetura Técnica

```
Frontend (React + ethers.js)
        │
        ▼
Smart Contract (Solidity + OpenZeppelin ERC721)
        │
        ▼
Blockchain: Polygon Amoy Testnet
```

### Smart Contract: `AgroProof.sol`

- **ERC721** (NFT) para emissão automática do certificado
- Registro imutável de produtores e lotes
- Histórico auditável de etapas com timestamp on-chain
- Verificação pública sem permissão
- Eventos rastreáveis: `ProdutorRegistrado`, `EtapaRegistrada`, `CertificadoEmitido`

### Frontend

- **React** com React Router para navegação SPA
- **ethers.js v6** para comunicação com blockchain
- **MetaMask** para autenticação via carteira
- **QRCode.js** para geração de QR de verificação
- Design system próprio (sem frameworks CSS externos)

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js v18+
- MetaMask instalado no navegador
- MATIC de teste (faucet: https://faucet.polygon.technology/)

### 1. Instalar dependências dos contratos

```bash
cd agroproof
npm install
```

### 2. Compilar e testar o contrato

```bash
npm run compile
npm test
```

### 3. Fazer deploy na testnet

Crie um arquivo `.env` na raiz:

```env
PRIVATE_KEY=sua_chave_privada_aqui
```

```bash
npm run deploy:amoy
```

Copie o endereço do contrato exibido no terminal.

### 4. Instalar e rodar o frontend

```bash
cd frontend
npm install
```

Crie `.env` no diretório `frontend/`:

```env
VITE_CONTRACT_ADDRESS=0x_endereço_do_contrato
```

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## 📋 Funcionalidades

| Funcionalidade | Status |
|---|---|
| Registro de produtor na blockchain | ✅ |
| Registro de lotes de produção | ✅ |
| Registro de 5 etapas do cultivo | ✅ |
| Emissão automática de NFT ao concluir | ✅ |
| Verificação pública sem login | ✅ |
| QR Code de verificação | ✅ |
| Histórico completo auditável | ✅ |
| Conexão MetaMask | ✅ |
| Testes automatizados | ✅ |

---

## ⛓️ Contrato na Testnet

- **Rede**: Polygon Amoy Testnet (ChainID: 80002)
- **Endereço**: `[atualizar após deploy]`
- **Explorer**: https://amoy.polygonscan.com/address/[endereço]

---

## 🌿 Impacto Social

O AgroProof contribui para:

- **Inclusão financeira** de pequenos produtores orgânicos
- **Confiança do consumidor** com rastreabilidade transparente
- **Redução de fraudes** em certificações orgânicas
- **Acesso a mercados** que exigem comprovação de origem
- **ESG verificável** para cadeias de fornecimento

---

## 🧪 Testes

```bash
npm test
```

Cobertura dos testes:
- ✅ Registro de produtor (incluindo validações e erros)
- ✅ Registro de produtos/lotes
- ✅ Registro de etapas
- ✅ Emissão automática de NFT ao completar 5 etapas
- ✅ Controle de acesso (apenas dono do produto)
- ✅ Prevenção de etapas duplicadas

---

## 👤 Desenvolvido por

Projeto desenvolvido para o **HackWeb — Residência em TIC 29**
Desafio 3: **ImpactLedger** — Blockchain + Smart Contracts para Impacto Social

---

## 📄 Licença

MIT
