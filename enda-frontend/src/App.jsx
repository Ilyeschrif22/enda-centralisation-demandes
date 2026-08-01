import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import DemandesPage from "./pages/DemandesPage";
import ProfilePage from "./components/profile-page/profile-page";
import UsersPage from "./pages/UsersPage";
import AgencesPage from "./pages/AgencesPage";
import StatistiquesPage from "./pages/StatistiquesPage";
import NotificationsPage from "./pages/NotificationsPage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" containerStyle={{ zIndex: 999999 }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/demandes" element={<DemandesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/agences" element={<AgencesPage />} />
          <Route path="/statistiques" element={<StatistiquesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;