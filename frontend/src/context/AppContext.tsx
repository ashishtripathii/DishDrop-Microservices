import { createContext } from "react";
import type { IAppContextType } from "../types/types";

export const AppContext = createContext<IAppContextType | undefined>(undefined);
