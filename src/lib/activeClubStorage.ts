const KEY = "fpa.activeClubId";

export const getStoredActiveClubId = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(KEY) || "" : "";
  } catch {
    return "";
  }
};

export const setStoredActiveClubId = (clubId: string) => {
  try {
    if (typeof window === "undefined") return;
    if (!clubId) {
      window.localStorage.removeItem(KEY);
      return;
    }
    window.localStorage.setItem(KEY, clubId);
  } catch {
    // ignore
  }
};
