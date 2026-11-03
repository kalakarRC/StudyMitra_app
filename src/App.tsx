// src/App.tsx
import { useAppContext } from "./app/AppContext";

export function App() {
  const {
    currentRoute,
    isLoading,
    error,
  } = useAppContext();

  if (currentRoute === "update") {
    return <div>Update required.</div>;
  }

  if (currentRoute === "boot" || isLoading) {
    return <div>Loading StudyMitra.</div>;
  }

  if (error) {
    return (
      <main>
        <h1>Unable to load StudyMitra</h1>
        <p>{error}</p>
      </main>
    );
  }

  switch (currentRoute) {
    case "/auth":
      return <div>Authentication screen</div>;

    case "/onboarding":
      return <div>Onboarding screen</div>;

    case "/home":
      return <div>Home screen</div>;

    case "/learn":
      return <div>Learn screen</div>;

    case "/viva":
      return <div>Viva screen</div>;

    case "/hub":
      return <div>Hub screen</div>;

    case "/friends":
      return <div>Friends screen</div>;

    case "/bazaar":
      return <div>Bazaar screen</div>;

    case "/profile":
      return <div>Profile screen</div>;

    default:
      return <div>Page not found.</div>;
  }
}
