import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Customers from "./pages/Customers";
import CustomerLedgerPage from "./pages/CustomerLedger";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import AuthPage from "./pages/Auth";
import { SessionProvider } from "@/hooks/useSession";
import Bills from "./pages/Bills";
import Suppliers from "./pages/Suppliers";
import Collections from "./pages/Collections";

const Profile = lazy(() => import("./pages/Profile"));

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/customers" element={<Customers />} />
              {/* Added route */}
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/customers/:id" element={<CustomerLedgerPage />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/bills" element={<Bills />} />
              {/* Add collections page */}
              <Route path="/collections" element={<Collections />} />
              <Route
                path="/profile"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Profile />
                  </Suspense>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default App;
