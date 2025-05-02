import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { isMobile, isTablet } from 'react-device-detect';
import { toast } from 'react-hot-toast';
import { BiRefresh } from 'react-icons/bi';

const TestProctoring = ({ onViolation, onFatalViolation }) => {
    const videoRef = useRef();
    const streamRef = useRef();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const detectionInterval = useRef();
    const consecutiveNoFaceCount = useRef(0);
    const lastDetectionTime = useRef(Date.now());

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
        }
        setIsActive(false);
    };

    const startVideo = async () => {
        if (!isActive) return;
        
        try {
            setCameraError(null);
            const stream = await navigator.mediaDevices?.getUserMedia({ 
                video: {
                    facingMode: "user",
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                }
            });
            
            if (videoRef.current && isActive) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setStream(stream);
            } else {
                stream.getTracks().forEach(track => track.stop());
            }
        } catch (error) {
            console.error("Error accessing webcam:", error);
            let errorMessage = "Failed to access camera. ";
            
            if (error.name === 'NotFoundError') {
                errorMessage += "No camera detected.";
            } else if (error.name === 'NotAllowedError') {
                errorMessage += "Camera permission denied. Please allow camera access.";
            } else if (error.name === 'NotReadableError') {
                errorMessage += "Camera is in use by another application.";
            } else {
                errorMessage += "Please check camera permissions.";
            }
            
            setCameraError(errorMessage);
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        if (isMobile && !isTablet && !window.navigator.userAgent.includes('Windows') && !window.navigator.userAgent.includes('Macintosh')) {
            onFatalViolation("Mobile devices are not allowed for taking tests");
            return;
        }

        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error("Error loading face detection models:", error);
                onFatalViolation("Failed to initialize proctoring system");
            }
        };
        loadModels();

        return cleanup;
    }, []);

    useEffect(() => {
        if (!modelsLoaded || !isActive) return;
        startVideo();
    }, [modelsLoaded]);

    useEffect(() => {
        if (!stream || !videoRef.current || !isActive) return;

        videoRef.current.onloadedmetadata = () => {
            detectionInterval.current = setInterval(async () => {
                if (!isActive) {
                    cleanup();
                    return;
                }

                try {
                    if (!videoRef.current?.videoWidth || !videoRef.current?.videoHeight) {
                        return;
                    }

                    const now = Date.now();
                    if (now - lastDetectionTime.current < 500) {
                        return;
                    }
                    lastDetectionTime.current = now;

                    const detections = await faceapi.detectAllFaces(
                        videoRef.current,
                        new faceapi.TinyFaceDetectorOptions({
                            inputSize: 320,
                            scoreThreshold: 0.3
                        })
                    );

                    if (!isActive) return;

                    if (detections.length === 0) {
                        consecutiveNoFaceCount.current++;
                        if (consecutiveNoFaceCount.current >= 3) {
                            onViolation("No face detected");
                            consecutiveNoFaceCount.current = 0;
                        }
                    } else if (detections.length > 1) {
                        onViolation("Multiple faces detected");
                        consecutiveNoFaceCount.current = 0;
                    } else {
                        consecutiveNoFaceCount.current = 0;
                    }
                } catch (error) {
                    console.error("Face detection error:", error);
                }
            }, 1000);
        };

        return () => {
            if (detectionInterval.current) {
                clearInterval(detectionInterval.current);
            }
        };
    }, [stream, isActive]);

    const handleRetry = () => {
        if (!isActive) return;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        consecutiveNoFaceCount.current = 0;
        startVideo();
    };

    if (!isActive) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 w-[240px] h-[180px] bg-richblack-800 rounded-lg overflow-hidden border-2 border-richblack-700">
            {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-pink-200 text-sm mb-4">{cameraError}</p>
                    <button 
                        onClick={handleRetry}
                        className="flex items-center gap-2 bg-yellow-50 text-richblack-900 px-3 py-2 rounded-md hover:scale-95 transition-all"
                    >
                        <BiRefresh size={20} />
                        Retry Camera
                    </button>
                </div>
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    );
};

export default TestProctoring;