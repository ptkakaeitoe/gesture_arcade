import { useEffect, useState } from "react";
import "./styles/App.css";
import Game from "./Pong/Game";
import DinoSurferGame from "./dino-surfer-3d/DinoSurferGame";
import GameDashboard from "./views/GameDashboard";
import IntroView from "./views/IntroView";
import type { CameraOption, PlayableGameId } from "./types";
import CyberSliceGame from "./gesture-arcade_-cyberslice/CyberSliceGame";
import FlappyGame from "./flappy/FlappyGame";
import {
  DEFAULT_CAMERA_ID,
  detectCameraOptions,
} from "./services/camera";

type View = "intro" | "dashboard" | PlayableGameId;

const STORAGE_KEY = "gesture-arcade-camera";

const readStoredCamera = () => {
  if (typeof window === "undefined") {
    return DEFAULT_CAMERA_ID;
  }
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CAMERA_ID;
};

const persistCameraSelection = (value: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value.toString());
};

function App() {
  const [view, setView] = useState<View>("intro");
  const [cameraOptions, setCameraOptions] = useState<CameraOption[]>([
    { id: DEFAULT_CAMERA_ID, label: "Default Camera" },
  ]);
  const [selectedCamera, setSelectedCamera] = useState<string>(() =>
    readStoredCamera()
  );

  useEffect(() => {
    let cancelled = false;
    const fetchCameras = async () => {
      try {
        const devices = await detectCameraOptions();
        if (cancelled) return;
        setCameraOptions(devices);
        setSelectedCamera((previous) => {
          if (devices.some((device) => device.id === previous)) {
            return previous;
          }
          const fallbackId = devices[0]?.id ?? DEFAULT_CAMERA_ID;
          persistCameraSelection(fallbackId);
          return fallbackId;
        });
      } catch {
        if (cancelled) return;
        const fallback: CameraOption[] = [
          { id: DEFAULT_CAMERA_ID, label: "Default Camera" },
        ];
        setCameraOptions(fallback);
        persistCameraSelection(DEFAULT_CAMERA_ID);
        setSelectedCamera(DEFAULT_CAMERA_ID);
      }
    };

    fetchCameras();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBackToDashboard = () => setView("dashboard");
  const ensureValidCameraSelection = () => {
    const isValid = cameraOptions.some((cam) => cam.id === selectedCamera);
    const fallbackId = cameraOptions[0]?.id ?? DEFAULT_CAMERA_ID;
    if (!isValid && fallbackId !== selectedCamera) {
      setSelectedCamera(fallbackId);
      persistCameraSelection(fallbackId);
    }
    return isValid ? selectedCamera : fallbackId;
  };
  const handleCameraFailure = () => {
    const fallbackId = cameraOptions[0]?.id ?? DEFAULT_CAMERA_ID;
    if (fallbackId !== selectedCamera) {
      setSelectedCamera(fallbackId);
      persistCameraSelection(fallbackId);
    }
  };
  const handleLaunchGame = (gameId: PlayableGameId) => {
    ensureValidCameraSelection();
    setView(gameId);
  };
  const handleEnterDashboard = () => setView("dashboard");
  const handleSelectCamera = (id: string) => {
    setSelectedCamera(id);
    persistCameraSelection(id);
  };

  const activeCamera = cameraOptions.find((cam) => cam.id === selectedCamera);
  const activeCameraLabel = activeCamera?.label ?? (cameraOptions[0]?.label ?? "Default Camera");

  if (view === "intro") {
    return <IntroView onEnter={handleEnterDashboard} />;
  }

  if (view === "pong") {
    return (
      <Game onBack={handleBackToDashboard} cameraId={selectedCamera} />
    );
  }

  if (view === "flappy") {
    return (
      <FlappyGame
        onBack={handleBackToDashboard}
        cameraId={selectedCamera}
        cameraLabel={activeCameraLabel}
      />
    );
  }

  if (view === "surfer") {
    return (
      <DinoSurferGame
        onBack={handleBackToDashboard}
        cameraId={selectedCamera}
        cameraLabel={activeCameraLabel}
      />
    );
  }

  if (view === "cyberslice") {
    return (
      <CyberSliceGame
        onBack={handleBackToDashboard}
        cameraId={selectedCamera}
        cameraLabel={activeCameraLabel}
        onCameraError={handleCameraFailure}
      />
    );
  }

  return (
    <GameDashboard
      onLaunchGame={handleLaunchGame}
      cameraOptions={cameraOptions}
      selectedCamera={selectedCamera}
      selectedCameraLabel={activeCameraLabel}
      onSelectCamera={handleSelectCamera}
    />
  );
}

export default App;
