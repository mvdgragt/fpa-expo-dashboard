import { useContext } from "react";

import { ActiveClubContext } from "./activeClubContext";

export const useActiveClub = () => useContext(ActiveClubContext);
