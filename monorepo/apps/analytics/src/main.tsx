import ReactDOM from "react-dom/client";
import type { PhotoData } from "@frontend/api-client";
import {
  checkPhotosServiceHealth,
  getPhoto,
} from "@frontend/api-client/services/photosService";
import ThemeProvider, { useTheme } from "@frontend/auth/context/ThemeContext";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import AnalyticsPreview from "./components/AnalyticsPreview";
import "./index.css";

const rootDivElement = document.getElementById("root");

if (!rootDivElement) {
  throw new Error('Could not find root element with id "root"');
}

const AnalyticsApp = () => {
  const { dark } = useTheme();
  const [photosServiceIsHealthy, setPhotosServiceIsHealthy] = useState<
    boolean | null
  >(null);
  document.documentElement.classList.toggle("dark", dark);

  useEffect(() => {
    const checkServices = async () => {
      try {
        const isHealthy = await checkPhotosServiceHealth();
        setPhotosServiceIsHealthy(isHealthy);
      } catch {
        setPhotosServiceIsHealthy(false);
      }
    };

    void checkServices();
  }, []);

  const servicesStatus =
    photosServiceIsHealthy === null
      ? "services: checking"
      : photosServiceIsHealthy
        ? "services: ok"
        : "services: photos service down";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/gallery" replace />} />
          <Route path="/images/:imageId" element={<ImageAnalyticsRoute />} />
        </Routes>
      </main>
      <footer className="border-t px-4 py-1.5">
        <div className="mx-auto flex max-w-5xl justify-end gap-4">
          <span>{servicesStatus}</span>
        </div>
      </footer>
    </div>
  );
};

const ImageAnalyticsRoute = () => {
  const { imageId } = useParams();
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!imageId) {
      setError("Missing image id.");
      return;
    }

    let cancelled = false;
    setPhoto(null);
    setError("");

    getPhoto(imageId)
      .then((nextPhoto) => {
        if (!cancelled) setPhoto(nextPhoto);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load image.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageId]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-4 pt-0">
        <div className="rounded-lg border border-destructive/30 p-6 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <p className="mx-auto max-w-5xl p-4 pt-0 text-sm text-muted-foreground">
        Loading analytics...
      </p>
    );
  }

  return <AnalyticsPreview selectedPhoto={photo} />;
};

ReactDOM.createRoot(rootDivElement).render(
  <BrowserRouter basename="/analytics">
    <ThemeProvider>
      <AnalyticsApp />
    </ThemeProvider>
  </BrowserRouter>,
);
