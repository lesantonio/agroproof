import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Produtor from "./pages/Produtor";
import Produto from "./pages/Produto";
import Verificar from "./pages/Verificar";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produtor" element={<Produtor />} />
            <Route path="/produto" element={<Produto />} />
            <Route path="/verificar/:produtoId?" element={<Verificar />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}
