import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { RequireAuth } from "./RequireAuth";
import { DashboardLayout } from "../ui/layout/DashboardLayout";
import { LoginPage } from "../ui/pages/LoginPage";
import { UnauthorizedPage } from "../ui/pages/UnauthorizedPage";
import { OverviewPage } from "../ui/pages/OverviewPage";
import { ResultsPage } from "../ui/pages/ResultsPage";
import { BenchmarksPage } from "../ui/pages/BenchmarksPage";
import { LeaderboardPage } from "../ui/pages/LeaderboardPage";
import { AthletesPage } from "../ui/pages/AthletesPage";
import { AthleteProfilePage } from "../ui/pages/AthleteProfilePage";
import { SportsPage } from "../ui/pages/SportsPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <OverviewPage /> },
          { path: "/results", element: <ResultsPage /> },
          { path: "/benchmarks", element: <BenchmarksPage /> },
          { path: "/leaderboard", element: <LeaderboardPage /> },
          { path: "/athletes", element: <AthletesPage /> },
          { path: "/athletes/:userId", element: <AthleteProfilePage /> },
          { path: "/sports", element: <SportsPage /> },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
