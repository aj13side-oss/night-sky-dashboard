import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
  open: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  open: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <AuthModalContext.Provider value={{ open, openAuthModal: () => setOpen(true), closeAuthModal: () => setOpen(false) }}>
      {children}
    </AuthModalContext.Provider>
  );
};
