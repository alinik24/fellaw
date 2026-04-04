/**
 * useVoiceRecording Hook
 * Provides voice recording and speech-to-text functionality using Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecordingOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceRecordingResult {
  transcript: string;
  isRecording: boolean;
  error: string | null;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  confidence: number;
}

/**
 * Custom hook for voice recording and speech-to-text
 *
 * @param options - Configuration options for speech recognition
 * @returns Voice recording controls and state
 *
 * @example
 * ```tsx
 * const {
 *   transcript,
 *   isRecording,
 *   startRecording,
 *   stopRecording,
 *   error
 * } = useVoiceRecording({
 *   language: 'de-DE',
 *   continuous: true
 * });
 * ```
 */
export const useVoiceRecording = (
  options: VoiceRecordingOptions = {}
): VoiceRecordingResult => {
  const {
    language = 'de-DE',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1
  } = options;

  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Configure recognition
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = language;

    // Event handlers
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPart + ' ';
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += transcriptPart;
        }
      }

      setTranscript((prev) => {
        if (finalTranscript) {
          return prev + finalTranscript;
        } else if (interimResults && interimTranscript) {
          // Show interim results but don't add to final transcript
          return prev;
        }
        return prev;
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please ensure your microphone is connected.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions.');
          break;
        case 'network':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }

      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onstart = () => {
      setError(null);
    };
  }, [language, continuous, interimResults, maxAlternatives]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not available');
      return;
    }

    try {
      setError(null);
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        // Already started, just continue
        setIsRecording(true);
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
    }
  }, [isSupported]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
    } catch (err: any) {
      console.error('Error stopping recording:', err);
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    transcript,
    isRecording,
    error,
    isSupported,
    startRecording,
    stopRecording,
    resetTranscript,
    confidence
  };
};

/**
 * Get supported languages for speech recognition
 * @returns List of common language codes supported by Web Speech API
 */
export const getSupportedLanguages = () => {
  return [
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'tr-TR', name: 'Turkish (Turkey)' },
    { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' }
  ];
};
