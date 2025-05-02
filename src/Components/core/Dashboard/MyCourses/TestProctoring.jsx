import React, { useEffect, useRef, useState } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { toast } from 'react-hot-toast';
import { BiRefresh } from 'react-icons/bi';

// Initialize TensorFlow.js
tf.setBackend('webgl').then(() => {
    console.log('WebGL backend initialized');
    tf.ready().then(() => {
        console.log('TensorFlow.js ready');
    });
});

const TestProctoring = ({ onViolation, onFatalViolation }) => {
    const videoRef = useRef();
    const streamRef = useRef();
    const [faceModel, setFaceModel] = useState(null);
    const [objectModel, setObjectModel] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const detectionInterval = useRef();
    const consecutiveNoFaceCount = useRef(0);
    const consecutiveMultiFaceCount = useRef(0);
    const consecutivePhoneCount = useRef(0);
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
            onFatalViolation(errorMessage);
        }
    };

    useEffect(() => {
        const loadModels = async () => {
            try {
                await tf.ready();

                if (tf.getBackend() !== 'webgl') {
                    await tf.setBackend('webgl');
                }

                console.log("TensorFlow.js initialized with backend:", tf.getBackend());

                const [face, object] = await Promise.all([
                    blazeface.load({ maxFaces: 2 }),
                    cocoSsd.load(),
                ]);

                setFaceModel(face);
                setObjectModel(object);
                setModelsLoaded(true);
                console.log("Models loaded successfully");
            } catch (error) {
                console.error("Error loading models:", error);
                onFatalViolation("Failed to initialize proctoring system. Please refresh the page.");
                setCameraError("Failed to load detection models. Please refresh the page.");
            }
        };

        loadModels();
        return cleanup;
    }, []);

    useEffect(() => {
        if (!modelsLoaded || !isActive || !faceModel || !objectModel) return;
        startVideo();
    }, [modelsLoaded, faceModel, objectModel]);

    useEffect(() => {
        if (!stream || !videoRef.current || !isActive || !faceModel || !objectModel) return;

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
                    if (now - lastDetectionTime.current < 300) {
                        return;
                    }
                    lastDetectionTime.current = now;

                    const [facePredictions, objects] = await Promise.all([
                        faceModel.estimateFaces(videoRef.current, { flipHorizontal: false }),
                        objectModel.detect(videoRef.current)
                    ]);

                    if (!isActive) return;

                    if (facePredictions.length === 0) {
                        consecutiveNoFaceCount.current++;
                        consecutiveMultiFaceCount.current = 0;
                        if (consecutiveNoFaceCount.current >= 2) {
                            onViolation("No face detected");
                            consecutiveNoFaceCount.current = 0;
                        }
                    } else if (facePredictions.length > 1) {
                        consecutiveMultiFaceCount.current++;
                        consecutiveNoFaceCount.current = 0;
                        if (consecutiveMultiFaceCount.current >= 2) {
                            onViolation("Multiple faces detected");
                            consecutiveMultiFaceCount.current = 0;
                        }
                    } else {
                        consecutiveNoFaceCount.current = 0;
                        consecutiveMultiFaceCount.current = 0;
                    }

                    const phoneDetections = objects.filter(obj =>
                        ['cell phone', 'mobile phone', 'smartphone', 'phone', 'camera'].includes(obj.class.toLowerCase()) &&
                        obj.score > 0.5
                    );

                    if (phoneDetections.length > 0) {
                        consecutivePhoneCount.current++;
                        if (consecutivePhoneCount.current >= 2) {
                            const phonePositions = phoneDetections.map(detection =>
                                `(${Math.round(detection.bbox[0])}, ${Math.round(detection.bbox[1])})`
                            ).join(', ');
                            onViolation(`Phone detected. Possible attempt to photograph test questions.`);
                            consecutivePhoneCount.current = 0;
                        }
                    } else {
                        consecutivePhoneCount.current = Math.max(0, consecutivePhoneCount.current - 1);
                    }

                } catch (error) {
                    console.error("Detection error:", error);
                }
            }, 500);
        };

        return () => {
            if (detectionInterval.current) {
                clearInterval(detectionInterval.current);
            }
        };
    }, [stream, isActive, faceModel, objectModel]);

    const handleRetry = () => {
        if (!isActive) return;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        consecutiveNoFaceCount.current = 0;
        consecutiveMultiFaceCount.current = 0;
        consecutivePhoneCount.current = 0;
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
