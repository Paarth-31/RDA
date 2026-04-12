import { useRef, useState, useCallback } from "react";

export const useRecording = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null); // ← fix 1
    const audioContextRef = useRef<AudioContext | null>(null);

    const startRecording = useCallback(async (
        myStream: MediaStream | null,
        remoteStream: MediaStream | null
    ) => {
        if (!myStream && !remoteStream) {
            alert("No active streams to record.");
            return;
        }

        // --- 1. Setup Canvas for Video Mixing ---
        const canvas = document.createElement('canvas'); // ← fix 2: was 'video'
        canvas.width = 2560;
        canvas.height = 720;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d')!; // ← fix 3: now works, canvas has getContext

        // Create video elements to draw from
        const myVideo = document.createElement('video');
        myVideo.srcObject = myStream;
        myVideo.muted = true;
        myVideo.autoplay = true;
        await myVideo.play().catch(() => {});

        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = remoteStream;
        remoteVideo.muted = true;
        remoteVideo.autoplay = true;
        await remoteVideo.play().catch(() => {});

        // Draw both streams side by side on canvas every frame
        const drawFrame = () => {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Left half — my screen
            if (myStream && myVideo.readyState >= 2) {
                ctx.drawImage(myVideo, 0, 0, 1280, 720);
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, 200, 28);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px sans-serif';
                ctx.fillText('My Screen', 8, 18);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, 1280, 720);
                ctx.fillStyle = '#555555';
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('No local stream', 640, 360);
                ctx.textAlign = 'left';
            }

            // Right half — remote screen
            if (remoteStream && remoteVideo.readyState >= 2) {
                ctx.drawImage(remoteVideo, 1280, 0, 1280, 720);
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(1280, 0, 220, 28);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px sans-serif';
                ctx.fillText('Remote Screen', 1288, 18);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(1280, 0, 1280, 720);
                ctx.fillStyle = '#555555';
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('No remote stream', 1920, 360);
                ctx.textAlign = 'left';
            }

            // Timestamp overlay
            const now = new Date().toLocaleTimeString();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(canvas.width - 160, canvas.height - 28, 160, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`REC • ${now}`, canvas.width - 8, canvas.height - 10);
            ctx.textAlign = 'left';

            animationFrameRef.current = requestAnimationFrame(drawFrame);
        };
        drawFrame();

        // --- 2. Setup Audio Mixing via WebAudio API ---
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        if (myStream) {
            const audioTracks = myStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const localSource = audioContext.createMediaStreamSource(
                    new MediaStream(audioTracks)
                );
                const localGain = audioContext.createGain();
                localGain.gain.value = 1.0;
                localSource.connect(localGain);
                localGain.connect(destination);
            }
        }

        if (remoteStream) {
            const audioTracks = remoteStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const remoteSource = audioContext.createMediaStreamSource(
                    new MediaStream(audioTracks)
                );
                const remoteGain = audioContext.createGain();
                remoteGain.gain.value = 1.0;
                remoteSource.connect(remoteGain);
                remoteGain.connect(destination);
            }
        }

        // --- 3. Combine Canvas Video + Mixed Audio ---
        const canvasStream = canvas.captureStream(30); // ← fix 4: now works, canvas has captureStream
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...destination.stream.getAudioTracks(),
        ]);

        // --- 4. Setup MediaRecorder ---
        const mimeType = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
        ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

        const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 8_000_000,
            audioBitsPerSecond: 128_000,
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                await audioContextRef.current.close();
            }

            const blob = new Blob(chunksRef.current, { type: mimeType });
            chunksRef.current = [];

            const buffer = await blob.arrayBuffer();
            const uint8 = new Uint8Array(buffer);
            (window as any).electronAPI?.saveRecording(Array.from(uint8), mimeType);
        };

        mediaRecorder.start(5000);
        setIsRecording(true);

        let seconds = 0;
        timerRef.current = setInterval(() => {
            seconds++;
            setRecordingTime(seconds);
        }, 1000);

        console.log(`Recording started with: ${mimeType}`);

    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTime(0);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            console.log("Recording stopped, saving file...");
        }
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return { startRecording, stopRecording, isRecording, recordingTime, formatTime };
};