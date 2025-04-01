
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vaults from "./pages/Vaults.tsx";
import Vault from "./pages/Vault.tsx";
import Streams from "./pages/Streams";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";
import { ApiProvider } from "./context/ApiContext";
import { AptosWalletProvider } from "./context/WalletContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <AptosWalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/vaults" element={<Vaults />} />
                <Route path="/vaults/:id" element={<Vault />} />
                <Route path="/streams" element={<Streams />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AptosWalletProvider>
      </ApiProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
