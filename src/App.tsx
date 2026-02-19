import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AuthProvider } from "./lib/AuthProvider";
import { ActiveClubProvider } from "./lib/ActiveClubProvider";
import { envIsConfigured } from "./lib/env";
import { queryClient } from "./lib/queryClient";
import { AppRouter } from "./routes/AppRouter";
import { SetupPage } from "./ui/pages/SetupPage";

function App() {
  if (!envIsConfigured) {
    return <SetupPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveClubProvider>
          <AppRouter />
        </ActiveClubProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
