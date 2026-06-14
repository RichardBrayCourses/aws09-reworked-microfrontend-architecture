import ReactDOM from "react-dom/client";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@frontend/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/ui/components/ui/dropdown-menu";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider, { useAuth } from "@frontend/auth/context/AuthContext";
import ThemeProvider, { useTheme } from "@frontend/auth/context/ThemeContext";
import { cn } from "@frontend/ui/lib/utils";
import { Moon, Sun, User } from "lucide-react";
import "./index.css";
import Gallery from "./pages/Gallery";
import Upload from "./pages/Upload";
import {
  checkAdministratorMembership,
  checkPhotosServiceHealth,
} from "@frontend/api-client/services/photosService";

const rootDivElement = document.getElementById("root");

if (!rootDivElement) {
  throw new Error('Could not find root element with id "root"');
}

const GalleryApp = () => {
  const { dark, setDark } = useTheme();
  const { isLoggedIn, login, logout } = useAuth();
  const [photosServiceIsHealthy, setPhotosServiceIsHealthy] = useState<
    boolean | null
  >(null);
  const [isAdministrator, setIsAdministrator] = useState(false);
  document.documentElement.classList.toggle("dark", dark);

  useEffect(() => {
    const checkServices = async () => {
      try {
        const isHealthy = await checkPhotosServiceHealth();
        setPhotosServiceIsHealthy(isHealthy);

        if (!isLoggedIn) {
          setIsAdministrator(false);
          return;
        }

        const administrator = await checkAdministratorMembership();
        setIsAdministrator(administrator);
      } catch {
        setPhotosServiceIsHealthy(false);
        setIsAdministrator(false);
      }
    };

    void checkServices();
  }, [isLoggedIn]);

  const servicesStatus =
    photosServiceIsHealthy === null
      ? "services: checking"
      : photosServiceIsHealthy
        ? "services: ok"
        : "services: photos service down";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-1 px-4 py-3">
        <Button asChild variant="ghost">
          <a href="/gallery">Gallery</a>
        </Button>
        <Button asChild variant="ghost">
          <a href="/gallery/upload">Upload</a>
        </Button>
        <Button
          className="ml-auto"
          variant="ghost"
          size="icon"
          onClick={() => {
            setDark(!dark);
          }}
        >
          {dark ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <User />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isLoggedIn ? (
              <>
                <DropdownMenuItem asChild>
                  <a href="/profile">Profile</a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={login}>Login</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <main className="flex-1 overflow-auto py-4">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </main>
      <footer className="border-t px-4 py-1.5">
        <div className="mx-auto flex max-w-5xl justify-end gap-4">
          {isAdministrator && <span>administrator</span>}
          <span>{servicesStatus}</span>
        </div>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(rootDivElement).render(
  <BrowserRouter basename="/gallery">
    <AuthProvider>
      <ThemeProvider>
        <GalleryApp />
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>,
);
