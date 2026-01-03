import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface SecurityContextType {
  isLocked: boolean;
  hasPin: boolean;
  unlock: (pin: string) => boolean;
  setPin: (pin: string) => void;
  removePin: () => void;
  lock: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);

  // Load PIN from storage on mount
  useEffect(() => {
    const storedPin = localStorage.getItem("app_pin");
    if (storedPin) {
      setPinHash(storedPin);
      setHasPin(true);
      setIsLocked(true); // Lock by default if PIN exists
    }
  }, []);

  // Auto-lock when app goes to background (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasPin) {
        setIsLocked(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasPin]);

  // Simple hash function for basic security
  const hashPin = (pin: string) => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  const unlock = (pin: string) => {
    if (!pinHash) return true;
    if (hashPin(pin) === pinHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setPin = (pin: string) => {
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    const hashed = hashPin(pin);
    localStorage.setItem("app_pin", hashed);
    setPinHash(hashed);
    setHasPin(true);
    toast.success("App lock enabled");
  };

  const removePin = () => {
    localStorage.removeItem("app_pin");
    setPinHash(null);
    setHasPin(false);
    setIsLocked(false);
    toast.success("App lock disabled");
  };

  const lock = () => {
    if (hasPin) {
      setIsLocked(true);
    }
  };

  return (
    <SecurityContext.Provider value={{ isLocked, hasPin, unlock, setPin, removePin, lock }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
