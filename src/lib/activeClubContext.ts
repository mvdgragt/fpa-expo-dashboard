import { createContext } from "react";

import type { ClubSummary } from "./api/clubs";

export type ActiveClubState = {
  clubId: string;
  isLoading: boolean;
  error: string;
  isAdmin: boolean;
  clubs: ClubSummary[];
  setClubId: (clubId: string) => void;
};

export const ActiveClubContext = createContext<ActiveClubState>({
  clubId: "",
  isLoading: true,
  error: "",
  isAdmin: false,
  clubs: [],
  setClubId: () => {},
});
