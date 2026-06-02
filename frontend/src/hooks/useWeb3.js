import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, REDE_CONFIG } from "../utils/contract";

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const conectarCarteira = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask não encontrada. Instale em metamask.io");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);

      const network = await _provider.getNetwork();
      setChainId(network.chainId.toString());

      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();

      const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setContract(_contract);
    } catch (e) {
      setError(e.message || "Erro ao conectar carteira");
    } finally {
      setLoading(false);
    }
  }, []);

  const trocarParaRedeCorreta = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: REDE_CONFIG.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [REDE_CONFIG],
        });
      }
    }
  }, []);

  // Escuta mudanças de conta e rede
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setContract(null);
      } else {
        setAccount(accounts[0]);
        conectarCarteira();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [conectarCarteira]);

  const executarTransacao = useCallback(async (fn, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const tx = await fn(...args);
      const receipt = await tx.wait();
      return receipt;
    } catch (e) {
      const msg = e?.reason || e?.message || "Transação falhou";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    provider, signer, contract, account, chainId,
    loading, error, setError,
    conectarCarteira, trocarParaRedeCorreta, executarTransacao,
    conectado: !!account,
  };
}
