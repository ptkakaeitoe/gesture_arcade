import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { DEFAULT_CAMERA_ID } from "../services/camera";

const VISION_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.13/wasm";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const PROCESS_WIDTH = 480;
const FRAME_THROTTLE_MS = 30;
const LOST_TRACK_HOLD_MS = 120;
const ONE_EURO_DEFAULTS = {
  minCutoff: 1.2,
  beta: 0.025,
  derivativeCutoff: 1.0,
};
const PALM_INDICES = [0, 1, 5, 9, 13, 17]; // wrist + finger bases for palm center

class OneEuroFilter {
  private value: number | null = null;
  private derivative: number | null = null;
  private lastTimestamp: number | null = null;
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly derivativeCutoff: number;

  constructor(minCutoff: number, beta: number, derivativeCutoff: number) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.derivativeCutoff = derivativeCutoff;
  }

  private smoothingFactor(deltaTime: number, cutoff: number) {
    const r = 2 * Math.PI * cutoff * deltaTime;
    return r / (r + 1);
  }

  private exponentialSmooth(alpha: number, value: number, previous: number) {
    return alpha * value + (1 - alpha) * previous;
  }

  filter(value: number, timestamp: number) {
    if (this.lastTimestamp == null || this.value == null) {
      this.value = value;
      this.derivative = 0;
      this.lastTimestamp = timestamp;
      return value;
    }

    const deltaTime = Math.max((timestamp - this.lastTimestamp) / 1000, 1 / 240);
    const derivative = (value - this.value) / deltaTime;
    const alphaDerivative = this.smoothingFactor(
      deltaTime,
      this.derivativeCutoff,
    );
    this.derivative =
      this.derivative == null
        ? derivative
        : this.exponentialSmooth(alphaDerivative, derivative, this.derivative);

    const cutoff = this.minCutoff + this.beta * Math.abs(this.derivative);
    const alpha = this.smoothingFactor(deltaTime, cutoff);
    this.value = this.exponentialSmooth(alpha, value, this.value);
    this.lastTimestamp = timestamp;
    return this.value;
  }

  reset() {
    this.value = null;
    this.derivative = null;
    this.lastTimestamp = null;
  }
}

type VideoFrameRequestCallback = (
  time: DOMHighResTimeStamp,
  metadata: VideoFrameCallbackMetadata
) => void;

type RequestVideoFrame = (callback: VideoFrameRequestCallback) => number;

type CancelVideoFrame = (handle: number) => void;

type HandTrackingResult = {
  x: number | null;
  y: number | null;
  gesture: string | null;
  frame: string | null;
  ready: boolean;
  error: string | null;
};

const initialState: HandTrackingResult = {
  x: null,
  y: null,
  gesture: null,
  frame: null,
  ready: false,
  error: null,
};

let landmarkerPromise: Promise<HandLandmarker> | null = null;

const getLandmarker = async () => {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
      return HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: HAND_MODEL_URL,
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.4,
        minTrackingConfidence: 0.4,
      });
    })();
  }
  return landmarkerPromise;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const supportsCamera = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);

export const useHandTracking = (deviceId?: string | null) => {
  const [state, setState] = useState<HandTrackingResult>(initialState);
  const frameThrottleRef = useRef(0);
  const smoothedX = useRef<number | null>(null);
  const smoothedY = useRef<number | null>(null);
  const xFilter = useRef<OneEuroFilter | null>(null);
  const yFilter = useRef<OneEuroFilter | null>(null);
  const lastDetectionTimestamp = useRef(0);

  useEffect(() => {
    if (!supportsCamera()) {
      setState({
        ...initialState,
        error: "Camera APIs are not available in this browser.",
      });
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let videoCallbackId: number | null = null;
    const video = document.createElement("video");
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    setState(initialState);
    smoothedX.current = null;
    smoothedY.current = null;
    xFilter.current = new OneEuroFilter(
      ONE_EURO_DEFAULTS.minCutoff,
      ONE_EURO_DEFAULTS.beta,
      ONE_EURO_DEFAULTS.derivativeCutoff,
    );
    yFilter.current = new OneEuroFilter(
      ONE_EURO_DEFAULTS.minCutoff,
      ONE_EURO_DEFAULTS.beta,
      ONE_EURO_DEFAULTS.derivativeCutoff,
    );
    lastDetectionTimestamp.current = 0;
    frameThrottleRef.current = 0;

    const start = async () => {
      try {
        const sharedConstraints: MediaTrackConstraints = {
          width: { ideal: 640, max: 960 },
          height: { ideal: 360, max: 720 },
          frameRate: { ideal: 30, max: 60 },
        };
        const videoConstraints: MediaTrackConstraints =
          deviceId && deviceId !== DEFAULT_CAMERA_ID
            ? { ...sharedConstraints, deviceId: { exact: deviceId } }
            : { ...sharedConstraints, facingMode: "user" };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        video.srcObject = stream;
        await video.play();

        setState((prev) => ({
          ...prev,
          ready: true,
          error: null,
        }));

        const landmarker = await getLandmarker();

        const processFrame = (timestamp: number) => {
          if (cancelled) {
            return;
          }

          if (video.readyState < 2) {
            return;
          }

          const width = video.videoWidth || 640;
          const height = video.videoHeight || 480;
          const scale =
            width > PROCESS_WIDTH ? PROCESS_WIDTH / width : 1;
          const processWidth = Math.floor(width * scale);
          const processHeight = Math.floor(height * scale);

          if (canvas.width !== processWidth) {
            canvas.width = processWidth;
          }
          if (canvas.height !== processHeight) {
            canvas.height = processHeight;
          }

          ctx?.save();
          ctx?.scale(-1, 1);
          ctx?.drawImage(video, -processWidth, 0, processWidth, processHeight);
          ctx?.restore();

          let detection: HandLandmarkerResult | null = null;
          try {
            detection = landmarker.detectForVideo(video, timestamp);
          } catch (error) {
            console.warn("HandLandmarker detection failed", error);
          }

          let x: number | null = null;
          let y: number | null = null;
          let gesture: string | null = null;

          if (detection?.landmarks?.length) {
            const hand = detection.landmarks[0];
            const indexFinger = hand[8];

            if (
              indexFinger &&
              typeof indexFinger.x === "number" &&
              typeof indexFinger.y === "number"
            ) {
              x = clamp01(1 - indexFinger.x);
              y = clamp01(indexFinger.y);
              gesture = "point";
            } else {
              // Fallback to palm center if index finger is somehow missing but hand is detected
              const palmPoints = PALM_INDICES.map((idx) => hand[idx]).filter(
                (point): point is NonNullable<typeof hand[0]> =>
                  Boolean(point) &&
                  typeof point.x === "number" &&
                  typeof point.y === "number",
              );

              if (palmPoints.length === PALM_INDICES.length) {
                const sum = palmPoints.reduce(
                  (acc, point) => {
                    acc.x += point.x;
                    acc.y += point.y;
                    return acc;
                  },
                  { x: 0, y: 0 },
                );
                const palmCenterX = sum.x / palmPoints.length;
                const palmCenterY = sum.y / palmPoints.length;
                x = clamp01(1 - palmCenterX);
                y = clamp01(palmCenterY);
                gesture = "palm";
              }
            }
          }

          let frame: string | null = null;

          if (ctx && timestamp - frameThrottleRef.current > FRAME_THROTTLE_MS) {
            try {
              frame = canvas.toDataURL("image/jpeg", 0.5);
              frameThrottleRef.current = timestamp;
            } catch {
              frame = null;
            }
          }

          if (x != null && y != null) {
            lastDetectionTimestamp.current = timestamp;
            smoothedX.current = clamp01(
              xFilter.current?.filter(x, timestamp) ?? x,
            );
            smoothedY.current = clamp01(
              yFilter.current?.filter(y, timestamp) ?? y,
            );
          } else if (
            timestamp - lastDetectionTimestamp.current >
            LOST_TRACK_HOLD_MS
          ) {
            smoothedX.current = null;
            smoothedY.current = null;
            xFilter.current?.reset();
            yFilter.current?.reset();
          }

          setState((prev) => ({
            x: smoothedX.current,
            y: smoothedY.current,
            gesture,
            frame: frame ?? prev.frame,
            ready: true,
            error: null,
          }));
        };

        const videoWithFrame = video as HTMLVideoElement & {
          requestVideoFrameCallback?: RequestVideoFrame;
          cancelVideoFrameCallback?: CancelVideoFrame;
        };
        const hasVideoFrameCallback =
          typeof videoWithFrame.requestVideoFrameCallback === "function";

        if (hasVideoFrameCallback && videoWithFrame.requestVideoFrameCallback) {
          const frameHandler: VideoFrameRequestCallback = (now) => {
            processFrame(now);
            if (!cancelled && videoWithFrame.requestVideoFrameCallback) {
              videoCallbackId = videoWithFrame.requestVideoFrameCallback(
                frameHandler
              );
            }
          };
          videoCallbackId = videoWithFrame.requestVideoFrameCallback(frameHandler);
        } else {
          const loop = () => {
            processFrame(performance.now());
            rafId = requestAnimationFrame(loop);
          };
          rafId = requestAnimationFrame(loop);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            ...initialState,
            error:
              error instanceof Error
                ? error.message
                : "Unable to access the selected camera.",
          });
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (videoCallbackId && "cancelVideoFrameCallback" in video) {
        const videoWithFrame = video as HTMLVideoElement & {
          cancelVideoFrameCallback?: CancelVideoFrame;
        };
        videoWithFrame.cancelVideoFrameCallback?.(videoCallbackId);
      }
      video.pause();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [deviceId]);

  return state;
};

export type { HandTrackingResult };
