import { ArrowRight, PackageCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomerBottomNavigation from "./CustomerBottomNavigation";
import "./Home.css";
import "./StoreShopping.css";

export default function OrdersPage() {
  const navigate = useNavigate();
  return (
    <div className="store-shopping-page">
      <header className="app-header">
        <a className="brand-lockup" href="/" aria-label="Apna Mart home">
          <span className="brand-mark"><PackageCheck size={19} /></span>
          <span className="brand-copy"><strong>APNA <b>MART</b></strong><small>Apni Dukaan, Ab Aapke Paas.</small></span>
        </a>
      </header>
      <main className="shopping-main shopping-orders-page">
        <span className="shopping-section-kicker">YOUR SHOPPING</span>
        <h1>Your orders</h1>
        <div className="shopping-state-panel">
          <span><PackageCheck size={25} /></span>
          <h2>No orders yet</h2>
          <p>Your orders will appear here after checkout is connected.</p>
          <button type="button" onClick={() => navigate("/stores")}>Browse nearby stores <ArrowRight size={15} /></button>
        </div>
      </main>
      <CustomerBottomNavigation />
    </div>
  );
}
