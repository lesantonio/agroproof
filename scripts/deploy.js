const { ethers } = require("hardhat");

async function main() {
  console.log("🌱 Iniciando deploy do AgroProof...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📬 Deploy realizado pela conta:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Saldo:", ethers.formatEther(balance), "ETH/MATIC\n");

  const AgroProof = await ethers.getContractFactory("AgroProof");
  console.log("📦 Compilando contrato...");

  const agroproof = await AgroProof.deploy();
  await agroproof.waitForDeployment();

  const address = await agroproof.getAddress();
  console.log("✅ AgroProof deployed em:", address);
  console.log("\n🔗 Salve este endereço no arquivo .env do frontend:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  console.log("\n🎉 Deploy concluído com sucesso!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro no deploy:", error);
    process.exit(1);
  });
