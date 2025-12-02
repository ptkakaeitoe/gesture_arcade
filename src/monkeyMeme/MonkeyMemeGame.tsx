import React, { useEffect, useRef, useState } from "react";
import neutralImg from "./images/monkey-neutral.webp";
import pointImg from "./images/monkey-point.jpg";
import thinkImg from "./images/monkey-think.jpeg";

// Types for MediaPipe globals that will be loaded
declare global {
    interface Window {
        Pose: any;
        Camera: any;
        drawConnectors: any;
        drawLandmarks: any;
        POSE_CONNECTIONS: any;
    }
}

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
    });
};

type MonkeyMemeGameProps = {
    onBack?: () => void;
};

const MonkeyMemeGame: React.FC<MonkeyMemeGameProps> = ({ onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [poseLabel, setPoseLabel] = useState("Waiting for camera...");
    const [confidence, setConfidence] = useState("-");
    const [imgSrc, setImgSrc] = useState(neutralImg);
    const [statusText, setStatusText] = useState("Requesting webcam...");
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    const poseImages: Record<string, string> = {
        pointing: pointImg,
        thinking: thinkImg,
        neutral: neutralImg,
    };

    const poseNames: Record<string, string> = {
        pointing: "Arm raised / pointing",
        thinking: "Hand near mouth (thinking)",
        neutral: "Neutral / arms relaxed",
    };

    // Helper functions for geometry
    const distance = (a: any, b: any) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const angleAtJoint = (a: any, b: any, c: any) => {
        const ab = { x: a.x - b.x, y: a.y - b.y };
        const cb = { x: c.x - b.x, y: c.y - b.y };
        const dot = ab.x * cb.x + ab.y * cb.y;
        const mag =
            Math.sqrt(ab.x * ab.x + ab.y * ab.y) *
            Math.sqrt(cb.x * cb.x + cb.y * cb.y);
        if (!mag) return 180;
        return (Math.acos(Math.min(Math.max(dot / mag, -1), 1)) * 180) / Math.PI;
    };

    const classifyPose = (landmarks: any[]) => {
        if (!landmarks || landmarks.length === 0)
            return { label: "Unknown pose", confidence: 0 };

        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const nose = landmarks[0];
        const mouthLeft = landmarks[9] || nose;
        const mouthRight = landmarks[10] || nose;
        const mouth = {
            x: (mouthLeft.x + mouthRight.x) / 2,
            y: (mouthLeft.y + mouthRight.y) / 2,
        };

        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;
        const shoulderSpan = Math.max(
            distance(leftShoulder, rightShoulder),
            0.001
        );
        const torsoLength = Math.max(hipY - shoulderY, 0.15);

        const wristAboveHead =
            (leftWrist.y < nose.y && leftWrist.y < leftElbow.y - 0.02) ||
            (rightWrist.y < nose.y && rightWrist.y < rightElbow.y - 0.02);

        const proximityThreshold = Math.max(shoulderSpan * 0.65, 0.12);
        const verticalAllowance = torsoLength * 0.2;
        const leftElbowAngle = angleAtJoint(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = angleAtJoint(
            rightShoulder,
            rightElbow,
            rightWrist
        );

        const leftHandNearMouth =
            distance(leftWrist, mouth) < proximityThreshold &&
            Math.abs(leftWrist.y - mouth.y) < verticalAllowance &&
            leftWrist.y < shoulderY + torsoLength * 0.15 &&
            leftElbowAngle < 150;
        const rightHandNearMouth =
            distance(rightWrist, mouth) < proximityThreshold &&
            Math.abs(rightWrist.y - mouth.y) < verticalAllowance &&
            rightWrist.y < shoulderY + torsoLength * 0.15 &&
            rightElbowAngle < 150;

        const handNearMouth = leftHandNearMouth || rightHandNearMouth;

        const wristsBelowHips =
            leftWrist.y > hipY + 0.08 && rightWrist.y > hipY + 0.08;
        const wristsBelowShoulders =
            leftWrist.y > shoulderY + 0.04 &&
            rightWrist.y > shoulderY + 0.04 &&
            leftElbow.y > shoulderY - 0.02 &&
            rightElbow.y > shoulderY - 0.02;

        if (wristAboveHead) return { label: "pointing", confidence: 0.9 };
        if (handNearMouth) return { label: "thinking", confidence: 0.92 };
        if (wristsBelowHips || wristsBelowShoulders)
            return { label: "neutral", confidence: 0.7 };

        return { label: "Unknown pose", confidence: 0.3 };
    };

    useEffect(() => {
        // Load MediaPipe scripts dynamically
        const loadScripts = async () => {
            try {
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");
                setScriptsLoaded(true);
            } catch (err) {
                console.error("Failed to load MediaPipe scripts", err);
                setStatusText("Failed to load AI models.");
            }
        };
        loadScripts();
    }, []);

    useEffect(() => {
        if (!scriptsLoaded) return;

        let pose: any;
        let stream: MediaStream | null = null;
        let animationId: number;
        let active = true;

        const onResults = (results: any) => {
            if (!active || !results || !canvasRef.current || !videoRef.current) return;
            const ctx = canvasRef.current.getContext("2d");
            if (!ctx) return;

            if (canvasRef.current.width !== videoRef.current.videoWidth) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
            }

            ctx.save();
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw video
            ctx.drawImage(
                results.image,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );

            // Draw landmarks
            if (results.poseLandmarks) {
                window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
                    color: "#22d3ee",
                    lineWidth: 4,
                });
                window.drawLandmarks(ctx, results.poseLandmarks, {
                    color: "#f97316",
                    lineWidth: 2,
                    radius: 3,
                });
            }
            ctx.restore();

            if (results.poseLandmarks) {
                const { label, confidence } = classifyPose(results.poseLandmarks);
                const pretty = poseNames[label] || label;
                setPoseLabel(pretty);
                setConfidence(`${(confidence * 100).toFixed(0)}%`);
                if (poseImages[label]) setImgSrc(poseImages[label]);
            } else {
                setPoseLabel("No pose found");
                setConfidence("-");
            }
        };

        const setupPose = async () => {
            const videoEl = videoRef.current;
            if (!videoEl) return;

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: "user" },
                    audio: false,
                });
                videoEl.srcObject = stream;
                await videoEl.play();
                setStatusText("Camera on; hold a pose.");
            } catch (err) {
                console.error("getUserMedia error", err);
                setPoseLabel("Camera blocked?");
                setStatusText("Allow webcam access and reload.");
                return;
            }

            try {
                pose = new window.Pose({
                    locateFile: (file: string) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
                });
                pose.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });
                pose.onResults(onResults);

                const loop = async () => {
                    if (!active) return;
                    if (!pose || !videoEl || videoEl.readyState < 2) {
                        animationId = requestAnimationFrame(loop);
                        return;
                    }
                    try {
                        await pose.send({ image: videoEl });
                    } catch (err) {
                        console.error("pose.send error", err);
                    }
                    animationId = requestAnimationFrame(loop);
                };
                loop();
            } catch (err) {
                console.error(err);
                setPoseLabel("Camera blocked?");
                setStatusText("Enable webcam permissions and reload.");
            }
        };

        setupPose();

        return () => {
            active = false;
            try {
                pose && pose.close && pose.close();
            } catch (_) { }
            try {
                if (animationId) cancelAnimationFrame(animationId);
            } catch (_) { }
            try {
                if (stream) {
                    stream.getTracks().forEach((t) => t.stop());
                }
            } catch (_) { }
        };
    }, [scriptsLoaded]);

    return (
        <div className="min-h-screen bg-[#0b1021] text-slate-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[15%] w-[30vw] h-[30vw] bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[15%] w-[30vw] h-[30vw] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-50 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-md rounded-full text-xs font-mono uppercase tracking-widest border border-white/10 transition-colors"
                >
                    ← Back
                </button>
            )}

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10 pb-20 md:pb-0">

                {/* Left Panel: Camera & Info */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs rounded-full font-mono">
                                🎥 MediaPipe Pose
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{statusText}</span>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Monkey Pose Switcher</h1>
                        <p className="text-slate-400 text-sm">
                            Raise your arm to point, bring a hand to your mouth to think, or relax your arms for neutral.
                        </p>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video">
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                            className="absolute inset-0 w-full h-full object-cover opacity-0" // Hide video, show canvas
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover -scale-x-100" // Mirror effect
                        />
                    </div>

                    <div className="flex gap-4 text-xs font-mono text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#22d3ee]" /> Connections
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#f97316]" /> Landmarks
                        </div>
                    </div>
                </div>

                {/* Right Panel: Result & Status */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">

                    {/* Status Card */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-pulse" />
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Current Pose</div>
                                <div className="text-lg font-bold text-white">{poseLabel}</div>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs rounded-full font-mono">
                            Confidence {confidence}
                        </div>
                    </div>

                    {/* Image Display */}
                    <div className="flex-1 bg-black/50 rounded-2xl border border-slate-800 p-4 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                            src={imgSrc}
                            alt="Pose Result"
                            className="w-full h-full object-contain rounded-lg shadow-2xl transition-all duration-500"
                        />
                    </div>

                    {/* Instructions */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Try These Poses</div>
                        <ul className="space-y-2 text-sm text-slate-300 list-disc pl-4">
                            <li>Raise one arm above your head (pointing)</li>
                            <li>Bring a hand near your mouth (thinking)</li>
                            <li>Rest arms down by your sides (neutral)</li>
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default MonkeyMemeGame;
