import { useToken } from "@/hooks/auth-hooks"
import { browserEnv } from "@/lib/browser-env"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface UseVoiceRecorderOptions {
    onTranscript: (text: string) => void
}

export interface VoiceRecorderState {
    isRecording: boolean
    isTranscribing: boolean
    recordingDuration: number
    audioLevel: number
}

// Detect if we're on iOS Safari
const isIOSSafari = () => {
    const userAgent = navigator.userAgent
    const isIOS =
        /iPad|iPhone|iPod/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
    return isIOS && isSafari
}

// Check if MediaRecorder is actually usable (not just present)
const isMediaRecorderUsable = (): boolean => {
    if (!window.MediaRecorder) {
        return false
    }

    // On iOS Safari, MediaRecorder might exist but not work properly
    if (isIOSSafari()) {
        try {
            // Try to check if any audio formats are supported
            const formats = ["audio/mp4", "audio/aac", "audio/m4a", "audio/wav"]
            const supported = formats.some((format) => {
                try {
                    return MediaRecorder.isTypeSupported?.(format) ?? false
                } catch {
                    return false
                }
            })

            if (!supported) {
                console.warn("MediaRecorder exists but no audio formats are supported")
                return false
            }
        } catch (error) {
            console.warn("MediaRecorder compatibility check failed:", error)
            return false
        }
    }

    return true
}

// Get the best supported MIME type for the current browser
const getBestSupportedMimeType = (): string => {
    const types = [
        // iOS Safari prefers these formats
        "audio/mp4",
        "audio/aac",
        "audio/m4a",
        // Standard web formats
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        // Fallback
        ""
    ]

    for (const type of types) {
        if (type === "") return ""

        try {
            if (MediaRecorder.isTypeSupported?.(type)) {
                return type
            }
        } catch (error) {
            console.warn(`Error checking support for ${type}:`, error)
        }
    }

    return ""
}

export const useVoiceRecorder = ({ onTranscript }: UseVoiceRecorderOptions) => {
    const { token } = useToken()
    const [state, setState] = useState<VoiceRecorderState>({
        isRecording: false,
        isTranscribing: false,
        recordingDuration: 0,
        audioLevel: 0
    })

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)
    const recordingStartTimeRef = useRef<number>(0)
    const durationIntervalRef = useRef<number | null>(null)
    const audioLevelIntervalRef = useRef<number | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return

        try {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current)
            const average =
                dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length
            const normalizedLevel = average / 255

            setState((prev) => ({ ...prev, audioLevel: normalizedLevel }))
        } catch (error) {
            // Silently fail if audio analysis fails (common on iOS)
            console.warn("Audio level analysis failed:", error)
        }
    }, [])

    const setupAudioAnalysis = useCallback((stream: MediaStream) => {
        try {
            // On iOS, AudioContext creation might fail or be restricted
            audioContextRef.current = new (
                window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
            )()

            // iOS requires AudioContext to be resumed after user gesture
            if (audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume()
            }

            analyserRef.current = audioContextRef.current.createAnalyser()
            analyserRef.current.fftSize = 256
            analyserRef.current.smoothingTimeConstant = 0.8

            const source = audioContextRef.current.createMediaStreamSource(stream)
            source.connect(analyserRef.current)

            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)

            return true
        } catch (error) {
            console.warn(
                "Audio analysis setup failed (this is normal on some iOS versions):",
                error
            )
            // Don't fail the recording if audio analysis fails
            return false
        }
    }, [])

    const startRecording = useCallback(async () => {
        try {
            // Enhanced browser support checks
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(
                    "Your browser doesn't support audio recording. Please try using the latest version of Safari."
                )
            }

            if (!isMediaRecorderUsable()) {
                if (isIOSSafari()) {
                    throw new Error(
                        "Audio recording is not available on this version of iOS Safari. Please update to iOS 14.3 or later, or try using a different browser."
                    )
                }
                throw new Error("MediaRecorder not supported in your browser")
            }

            // iOS Safari specific constraints
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // iOS-specific optimizations
                    ...(isIOSSafari() && {
                        sampleRate: 44100,
                        channelCount: 1
                    })
                }
            }

            console.log("Requesting microphone access...")
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            // Set up audio analysis (may fail on iOS, that's okay)
            const audioAnalysisWorking = setupAudioAnalysis(stream)

            // Get the best supported MIME type
            const mimeType = getBestSupportedMimeType()

            console.log(`Using MIME type: ${mimeType || "browser default"}`)

            // Set up MediaRecorder with iOS-compatible options
            const options: MediaRecorderOptions = {}
            if (mimeType) {
                options.mimeType = mimeType
            }

            // iOS Safari might need specific bitrate settings
            if (isIOSSafari() && mimeType.includes("mp4")) {
                options.audioBitsPerSecond = 128000
            }

            try {
                mediaRecorderRef.current = new MediaRecorder(stream, options)
            } catch (optionsError) {
                console.warn("Failed with options, trying without:", optionsError)
                // Fallback: try without options
                mediaRecorderRef.current = new MediaRecorder(stream)
            }

            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log("Received audio data chunk:", event.data.size, "bytes")
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorderRef.current.onstop = async () => {
                console.log("Recording stopped, processing audio...")
                const actualMimeType = mimeType || "audio/mp4" // iOS Safari fallback
                const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType })
                console.log("Created audio blob:", audioBlob.size, "bytes, type:", actualMimeType)

                await transcribeAudio(audioBlob)

                // Clean up
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                    streamRef.current = null
                }
                if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                    audioContextRef.current.close()
                }
            }

            mediaRecorderRef.current.onerror = (event) => {
                console.error("MediaRecorder error:", event)
                const errorEvent = event as Event & { error?: Error }
                if (errorEvent.error) {
                    toast.error(`Recording failed: ${errorEvent.error.message}`)
                } else {
                    toast.error("Recording failed. Please try again.")
                }
            }

            // Start recording with small chunks for better iOS compatibility
            try {
                mediaRecorderRef.current.start(1000) // 1 second chunks
                console.log("Recording started successfully")
            } catch (startError) {
                console.warn("Failed to start with timeslice, trying without:", startError)
                mediaRecorderRef.current.start() // fallback without timeslice
            }

            recordingStartTimeRef.current = Date.now()

            setState((prev) => ({
                ...prev,
                isRecording: true,
                recordingDuration: 0,
                audioLevel: 0
            }))

            // Start duration counter
            durationIntervalRef.current = window.setInterval(() => {
                const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
                setState((prev) => ({ ...prev, recordingDuration: duration }))
            }, 1000)

            // Start audio level monitoring only if audio analysis is working
            if (audioAnalysisWorking) {
                audioLevelIntervalRef.current = window.setInterval(updateAudioLevel, 100)
            }
        } catch (error) {
            console.error("Error starting recording:", error)

            // Clean up on error
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }

            if (error instanceof Error) {
                if (error.name === "NotAllowedError") {
                    toast.error(
                        "Microphone permission denied. Please allow microphone access in Safari settings and try again."
                    )
                } else if (error.name === "NotFoundError") {
                    toast.error(
                        "No microphone found. Please check your device's microphone and try again."
                    )
                } else if (error.name === "NotSupportedError") {
                    toast.error(
                        "Audio recording is not supported on this device/browser combination."
                    )
                } else if (error.name === "AbortError") {
                    toast.error("Recording was interrupted. Please try again.")
                } else {
                    toast.error(error.message)
                }
            } else {
                toast.error("Failed to start recording. Please check microphone permissions.")
            }
        }
    }, [updateAudioLevel, setupAudioAnalysis])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            console.log("Stopping recording...")
            mediaRecorderRef.current.stop()

            setState((prev) => ({
                ...prev,
                isRecording: false,
                isTranscribing: true,
                audioLevel: 0
            }))

            // Clear intervals
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
                durationIntervalRef.current = null
            }
            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current)
                audioLevelIntervalRef.current = null
            }
        }
    }, [state.isRecording])

    const transcribeAudio = useCallback(
        async (audioBlob: Blob) => {
            try {
                if (audioBlob.size === 0) {
                    throw new Error(
                        "No audio data recorded. Please try speaking closer to the microphone."
                    )
                }

                console.log("Transcribing audio blob:", audioBlob.size, "bytes")
                const formData = new FormData()
                formData.append("audio", audioBlob)

                const response = await fetch(`${browserEnv("VITE_CONVEX_API_URL")}/transcribe`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Transcription failed")
                }

                const { text } = await response.json()

                if (text?.trim()) {
                    console.log("Transcription successful:", text)
                    onTranscript(text.trim())
                } else {
                    toast.error("No speech detected. Please try again and speak clearly.")
                }
            } catch (error) {
                console.error("Transcription error:", error)
                toast.error(error instanceof Error ? error.message : "Failed to transcribe audio")
            } finally {
                setState((prev) => ({
                    ...prev,
                    isTranscribing: false,
                    recordingDuration: 0
                }))
            }
        },
        [token, onTranscript]
    )

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            console.log("Cancelling recording...")
            // Stop the media recorder without processing
            mediaRecorderRef.current.ondataavailable = null
            mediaRecorderRef.current.onstop = () => {
                // Clean up without transcribing
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                    streamRef.current = null
                }
                if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                    audioContextRef.current.close()
                }
            }
            mediaRecorderRef.current.stop()

            setState((prev) => ({
                ...prev,
                isRecording: false,
                isTranscribing: false,
                recordingDuration: 0,
                audioLevel: 0
            }))

            // Clear intervals
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
                durationIntervalRef.current = null
            }
            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current)
                audioLevelIntervalRef.current = null
            }
        }
    }, [state.isRecording])

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
            }
            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current)
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
            }
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close()
            }
        }
    }, [])

    return {
        state,
        startRecording,
        stopRecording,
        cancelRecording
    }
}
