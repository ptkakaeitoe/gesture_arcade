import type { CameraOption } from "../types";

export const DEFAULT_CAMERA_ID = "default";

const fallbackCamera: CameraOption = {
  id: DEFAULT_CAMERA_ID,
  label: "Default Camera",
};

const cameraLabel = (label: string | undefined, index: number) =>
  label && label.trim().length > 0 ? label : `Camera ${index + 1}`;

const hasMediaAPIs = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.enumerateDevices);

const ensurePermission = async () => {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
};

export const detectCameraOptions = async (): Promise<CameraOption[]> => {
  if (!hasMediaAPIs()) {
    return [fallbackCamera];
  }

  await ensurePermission();

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput",
    );

    if (videoDevices.length === 0) {
      return [fallbackCamera];
    }

    return videoDevices.map((device, index) => ({
      id: device.deviceId || `${DEFAULT_CAMERA_ID}-${index}`,
      label: cameraLabel(device.label, index),
    }));
  } catch {
    return [fallbackCamera];
  }
};
