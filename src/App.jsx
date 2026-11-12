import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/customer/Login";
import Home from "./pages/customer/Home";
import StoreDiscovery from "./pages/customer/StoreDiscovery";
import StoreShopping, { StoreCartPage } from "./pages/customer/StoreShopping";
import OrdersPage from "./pages/customer/OrdersPage";
import { AppStateProvider } from "./app/AppState";
import "./app/RouteTransitions.css";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-transition">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stores" element={<StoreDiscovery />} />
        <Route path="/stores/:storeId" element={<StoreShopping />} />
        <Route path="/cart" element={<StoreCartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <AnimatedRoutes />
      </AppStateProvider>
    </BrowserRouter>
  );
}

export default App;
