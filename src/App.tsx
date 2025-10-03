import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import NavigationBar from "./components/ui/navigation-bar";

// Import all pages
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Home from "./pages/Home";  
import Services from "./pages/Services";
import ItemDetail from "./pages/ItemDetail";
import ServiceDetail from "./pages/ServiceDetail";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Orders from "./pages/Orders";
import Notifications from "./pages/Notifications";
import AddListing from "./pages/AddListing";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentVerification from "./pages/PaymentVerification";
import Gamification from "./pages/Gamification";
import QRScan from "./pages/QRScan";
import OrderQRCode from "./pages/OrderQRCode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/service/:id" element={<ServiceDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:roomId" element={<Chat />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/add-listing" element={<AddListing />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-verification" element={<PaymentVerification />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/qr-scan" element={<QRScan />} />
          <Route path="/orders/:orderId/qr" element={<OrderQRCode />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
            </div>
            {/* Only show navigation on authenticated pages */}
            <NavigationBar />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;