import { useEffect, useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ActiveClubContext } from "./activeClubContext";
import { listClubs } from "./api/clubs";
import { getMyClubId } from "./api/me";
import {
  getStoredActiveClubId,
  setStoredActiveClubId,
} from "./activeClubStorage";
import { useAuth } from "./useAuth";

export const ActiveClubProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const qc = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const clubsQuery = useQuery({
    enabled: isAdmin,
    queryKey: ["clubs"],
    queryFn: () => listClubs({ limit: 500 }),
  });

  const staffClubQuery = useQuery({
    enabled: !isAdmin,
    queryKey: ["me", "club_id"],
    queryFn: getMyClubId,
  });

  const [adminClubId, setAdminClubId] = useState(() => getStoredActiveClubId());

  const effectiveAdminClubId = useMemo(() => {
    const clubs = clubsQuery.data || [];
    const stored = adminClubId || getStoredActiveClubId();
    if (!stored) return clubs[0]?.id || "";
    if (clubs.length === 0) return stored;
    return clubs.some((c) => c.id === stored) ? stored : clubs[0]?.id || "";
  }, [adminClubId, clubsQuery.data]);

  useEffect(() => {
    if (!isAdmin) return;
    if (!effectiveAdminClubId) return;

    const stored = getStoredActiveClubId();
    if (stored !== effectiveAdminClubId) {
      setStoredActiveClubId(effectiveAdminClubId);
      qc.invalidateQueries();
    }
  }, [effectiveAdminClubId, isAdmin, qc]);

  const value = useMemo(() => {
    if (isAdmin) {
      return {
        clubId: effectiveAdminClubId,
        isLoading: clubsQuery.isLoading,
        error: clubsQuery.error
          ? clubsQuery.error instanceof Error
            ? clubsQuery.error.message
            : String(clubsQuery.error)
          : "",
        isAdmin: true,
        clubs: clubsQuery.data || [],
        setClubId: (clubId: string) => {
          setAdminClubId(clubId);
          setStoredActiveClubId(clubId);
          qc.invalidateQueries();
        },
      };
    }

    return {
      clubId: staffClubQuery.data || "",
      isLoading: staffClubQuery.isLoading,
      error: staffClubQuery.error
        ? staffClubQuery.error instanceof Error
          ? staffClubQuery.error.message
          : String(staffClubQuery.error)
        : "",
      isAdmin: false,
      clubs: [],
      setClubId: () => {},
    };
  }, [
    clubsQuery.data,
    clubsQuery.error,
    clubsQuery.isLoading,
    effectiveAdminClubId,
    isAdmin,
    qc,
    staffClubQuery.data,
    staffClubQuery.error,
    staffClubQuery.isLoading,
  ]);

  return (
    <ActiveClubContext.Provider value={value}>
      {children}
    </ActiveClubContext.Provider>
  );
};
