
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pools from "./pages/Pools";
import Pool from "./pages/Pool";
import Streams from "./pages/Streams";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";
import { ApiProvider } from "./context/ApiContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pools" element={<Pools />} />
              <Route path="/pools/:id" element={<Pool />} />
              <Route path="/streams" element={<Streams />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ApiProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
