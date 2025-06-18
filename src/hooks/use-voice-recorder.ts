import { useCallback, useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import { useToken } from "@/hooks/auth-hooks"
import { browserEnv } from "@/lib/browser-env"

interface UseVoiceRecorderOptions {
    onTranscript: (text: string) => void
}

export interface VoiceRecorderState {
    isRecording: boolean
    isTranscribing: boolean
    recordingDuration: number
    audioLevel: number
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

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return

        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length
        const normalizedLevel = average / 255

        setState(prev => ({ ...prev, audioLevel: normalizedLevel }))
    }, [])

    const startRecording = useCallback(async () => {
        try {
            // Check for browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Your browser doesn't support audio recording")
            }

            if (!window.MediaRecorder) {
                throw new Error("MediaRecorder not supported in your browser")
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            })

            // Set up audio analysis for waveform
            audioContextRef.current = new AudioContext()
            analyserRef.current = audioContextRef.current.createAnalyser()
            analyserRef.current.fftSize = 256
            
            const source = audioContextRef.current.createMediaStreamSource(stream)
            source.connect(analyserRef.current)
            
            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)

            // Check MediaRecorder support for webm format
            let mimeType = 'audio/webm;codecs=opus'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm'
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4'
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = '' // Let browser choose
                    }
                }
            }

            // Set up MediaRecorder
            mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

            audioChunksRef.current = []
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
                await transcribeAudio(audioBlob)
                
                // Clean up
                stream.getTracks().forEach(track => track.stop())
                audioContextRef.current?.close()
            }

            // Start recording
            mediaRecorderRef.current.start()
            recordingStartTimeRef.current = Date.now()
            
            setState(prev => ({
                ...prev,
                isRecording: true,
                recordingDuration: 0,
                audioLevel: 0
            }))

            // Start duration counter
            durationIntervalRef.current = window.setInterval(() => {
                const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
                setState(prev => ({ ...prev, recordingDuration: duration }))
            }, 1000)

            // Start audio level monitoring
            audioLevelIntervalRef.current = window.setInterval(updateAudioLevel, 100)

        } catch (error) {
            console.error("Error starting recording:", error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Failed to start recording. Please check microphone permissions.")
            }
        }
    }, [updateAudioLevel])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop()
            
            setState(prev => ({
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

    const transcribeAudio = useCallback(async (audioBlob: Blob) => {
        try {
            const formData = new FormData()
            formData.append('audio', audioBlob)

            const response = await fetch(`${browserEnv("VITE_CONVEX_API_URL")}/transcribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Transcription failed')
            }

            const { text } = await response.json()
            
            if (text && text.trim()) {
                onTranscript(text.trim())
            } else {
                toast.error("No speech detected. Please try again.")
            }

        } catch (error) {
            console.error("Transcription error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to transcribe audio")
        } finally {
            setState(prev => ({
                ...prev,
                isTranscribing: false,
                recordingDuration: 0
            }))
        }
    }, [token, onTranscript])

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            // Stop the media recorder without processing
            mediaRecorderRef.current.ondataavailable = null
            mediaRecorderRef.current.onstop = () => {
                // Clean up without transcribing
                audioContextRef.current?.close()
            }
            mediaRecorderRef.current.stop()
            
            setState(prev => ({
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
            audioContextRef.current?.close()
        }
    }, [])

    return {
        state,
        startRecording,
        stopRecording,
        cancelRecording
    }
}