import { useEffect } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ThemeProvider, { useTheme } from "@frontend/auth/context/ThemeContext";
import AuthProvider from "@frontend/auth/context/AuthContext";
import Callback from "./pages/Callback";

const GalleryRedirect = () => {
  useEffect(() => {
    window.location.replace("/gallery");
  }, []);

  return null;
};

const AppContent = () => {
  const { dark } = useTheme();
  document.documentElement.classList.toggle("dark", dark);
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<GalleryRedirect />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
