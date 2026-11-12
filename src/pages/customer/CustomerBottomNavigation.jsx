import { House, PackageCheck, ShoppingCart, Store, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import "./Home.css";

const items = [
  { id: "Home", icon: House, href: "/" },
  { id: "Stores", icon: Store, href: "/stores" },
  { id: "Cart", icon: ShoppingCart, href: "/cart" },
  { id: "Orders", icon: PackageCheck, href: "/orders" },
  { id: "Profile", icon: UserRound, href: "/login" },
];

export default function CustomerBottomNavigation() {
  const { pathname } = useLocation();
  const { cart } = useAppState();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const active = pathname === "/"
    ? "Home"
    : pathname === "/cart"
      ? "Cart"
      : pathname === "/orders"
        ? "Orders"
        : pathname === "/login"
          ? "Profile"
          : pathname.startsWith("/stores")
            ? "Stores"
            : "";

  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {items.map(({ id, icon: Icon, href }) => (
        <Link
          key={id}
          to={href}
          className={`nav-item ${active === id ? "active" : ""}`}
          aria-current={active === id ? "page" : undefined}
        >
          <span className="nav-icon-wrap">
            <Icon size={20} strokeWidth={active === id ? 2.4 : 1.9} />
            {id === "Cart" && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </span>
          <span>{id}</span>
        </Link>
      ))}
    </nav>
  );
}
