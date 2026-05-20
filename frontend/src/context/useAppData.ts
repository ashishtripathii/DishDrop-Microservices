import { useContext } from "react";
import type { IAppContextType } from "../types/types";
import { AppContext } from "./AppContext";

export const useAppData = (): IAppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }

  return context;
};
