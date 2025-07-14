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
import Quotations from "./pages/Quotations";
import AuthPage from "./pages/Auth";
import { SessionProvider } from "@/hooks/useSession";
import Bills from "./pages/Bills";
import Suppliers from "./pages/Suppliers";
import Collections from "./pages/Collections";
import Admin from "./pages/Admin";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Reports from "./pages/Reports";
import OrderDetails from "./pages/OrderDetails";
import QuotationDetails from "./pages/QuotationDetails";

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
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } />
              <Route path="/suppliers" element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              } />
              <Route path="/customers/:id" element={
                <ProtectedRoute>
                  <CustomerLedgerPage />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/bills" element={
                <ProtectedRoute>
                  <Bills />
                </ProtectedRoute>
              } />
              <Route path="/collections" element={
                <ProtectedRoute>
                  <Collections />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Profile />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route path="/quotations" element={
                <ProtectedRoute>
                  <Quotations />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              } />
              <Route path="/quotations/:id" element={
                <ProtectedRoute>
                  <QuotationDetails />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default App;
