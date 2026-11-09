
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import About from "./pages/About";
import Annuaire from "./pages/Annuaire";
import CertificationDetail from "./pages/CertificationDetail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AdminRoutes from "./admin/routes/AdminRoutes";

import {
  AuthProvider,
  useAuth
} from "./context/AuthContext";


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/register"
        replace
      />
    );
  }

  return children;
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Page d'accueil */}
          <Route
            path="/"
            element={
              <Navigate
                to="/register"
                replace
              />
            }
          />

          {/* Authentification */}
          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/mot-de-passe-oublie"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* Annuaire public */}
          <Route
            path="/annuaire"
            element={<Annuaire />}
          />

          <Route
            path="/certification/:id"
            element={<CertificationDetail />}
          />

          {/* Espace utilisateur */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            }
          />

          {/* Administration */}
          <Route
            path="/admin/*"
            element={<AdminRoutes />}
          />

          {/* Route inconnue */}
          <Route
            path="*"
            element={
              <Navigate
                to="/register"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

