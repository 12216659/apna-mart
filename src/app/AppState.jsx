import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppStateContext = createContext(null);
const CART_STORAGE_KEY = "apna-mart-cart";
const LEGACY_CART_STORAGE_KEY = "apna-mart-store-cart";
const LOCATION_STORAGE_KEY = "apna-mart-location";

export const defaultLocation = {
  name: "Home",
  address: "Kukatpally, Hyderabad",
  detail: "Near JNTU Metro Station",
};

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Unable to read ${key} from local storage:`, error);
    return null;
  }
}

function parseCart(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Saved cart must be a list.");
  return parsed.map((item) => {
    if (
      typeof item?.name !== "string" ||
      typeof item?.store !== "string" && typeof item?.storeName !== "string" ||
      !Number.isInteger(item?.quantity) ||
      item.quantity < 1 ||
      !Number.isFinite(item?.price)
    ) {
      throw new Error("Saved cart contains an invalid product.");
    }
    const storeName = item.storeName || item.store;
    return {
      ...item,
      id: item.id || item.name,
      store: storeName,
      storeName,
      storeId: item.storeId || `legacy:${storeName}`,
    };
  });
}

function readCart() {
  const savedCart = readStorage(CART_STORAGE_KEY);
  const savedLegacyCart = readStorage(LEGACY_CART_STORAGE_KEY);
  try {
    return parseCart(savedCart || savedLegacyCart);
  } catch (error) {
    console.error("Unable to restore the saved cart:", error);
    return [];
  }
}

function readLocation() {
  const raw = readStorage(LOCATION_STORAGE_KEY);
  if (!raw) return defaultLocation;
  try {
    const location = JSON.parse(raw);
    if (
      typeof location?.name === "string" &&
      typeof location?.address === "string" &&
      typeof location?.detail === "string"
    ) {
      return location;
    }
    throw new Error("Saved delivery location is invalid.");
  } catch (error) {
    console.error("Unable to restore the saved delivery location:", error);
    return defaultLocation;
  }
}

export function AppStateProvider({ children }) {
  const [cart, setCart] = useState(readCart);
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    } catch (error) {
      console.error("Unable to save the shared cart:", error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error("Unable to save the delivery location:", error);
    }
  }, [location]);

  useEffect(() => {
    const syncStorage = (event) => {
      if (event.key === CART_STORAGE_KEY && event.newValue !== null) {
        try {
          setCart(parseCart(event.newValue));
        } catch (error) {
          console.error("Unable to sync the cart from another tab:", error);
        }
      }
      if (event.key === LOCATION_STORAGE_KEY && event.newValue !== null) {
        try {
          const nextLocation = JSON.parse(event.newValue);
          if (
            typeof nextLocation?.name === "string" &&
            typeof nextLocation?.address === "string" &&
            typeof nextLocation?.detail === "string"
          ) {
            setLocation(nextLocation);
          }
        } catch (error) {
          console.error("Unable to sync the delivery location from another tab:", error);
        }
      }
    };
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  const value = useMemo(() => ({ cart, setCart, location, setLocation }), [cart, location]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider.");
  return context;
}
