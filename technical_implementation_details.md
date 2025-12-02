# Technical Implementation Details

This document answers specific technical questions about the libraries, files, and methods used for the computer vision pipeline.

## 1. How do we get the Video Feed?
We do **not** use an external library for this. We use the native **Browser WebRTC API**.

*   **File**: `src/hooks/useHandTracking.ts`
*   **Method**: `navigator.mediaDevices.getUserMedia()`
*   **How it works**:
    Inside the `startCamera` function, we request video access:
    ```typescript
    // src/hooks/useHandTracking.ts
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        facingMode: "user" // Use the front/selfie camera
      }
    });
    // We then attach this stream to a hidden <video> HTML element
    videoRef.current.srcObject = stream;
    ```

## 2. Which Library is used for AI?
We use **MediaPipe** by Google. Specifically, the Vision Tasks library.

*   **Library Name**: `@mediapipe/tasks-vision`
*   **File**: `src/hooks/useHandTracking.ts`
*   **Import**:
    ```typescript
    import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
    ```

## 3. How do we load the AI Model?
We fetch the "WASM" (WebAssembly) files and the model binary from Google's servers (CDN).

*   **File**: `src/hooks/useHandTracking.ts`
*   **Code**:
    ```typescript
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU" // We request to use the Graphics Card for speed
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    ```

## 4. How do we extract the data (Hand Coordinates)?
We run a continuous loop that passes the video element to the model.

*   **File**: `src/hooks/useHandTracking.ts`
*   **Function**: `predictWebcam()`
*   **Extraction Code**:
    ```typescript
    // Pass the HTMLVideoElement to the model
    const results = handLandmarker.detectForVideo(video, startTimeMs);
    
    // Extract the data
    if (results.landmarks && results.landmarks.length > 0) {
       const landmarks = results.landmarks[0]; // Get the first hand detected
       
       // landmarks[0] is the WRIST
       // landmarks[8] is the INDEX_FINGER_TIP
       
       const y = landmarks[9].y; // We use the middle finger knuckle (9) for stability
       // y is a number between 0.0 (top) and 1.0 (bottom)
    }
    ```

## 5. How do we "send the request" continuously?
We don't send HTTP requests to a server. The processing happens **locally** in the browser. To keep it running, we use the browser's animation loop.

*   **File**: `src/hooks/useHandTracking.ts`
*   **Mechanism**: `requestAnimationFrame`
*   **Code**:
    ```typescript
    function predictWebcam() {
       // 1. Detect
       handLandmarker.detectForVideo(video, performance.now());
       
       // 2. Schedule the next detection immediately
       requestAnimationFrame(predictWebcam);
    }
    ```
