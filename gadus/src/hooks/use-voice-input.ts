import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<AnySpeechRecognition>(null);

  useEffect(() => {
    const SR =
      (window as AnySpeechRecognition).SpeechRecognition ||
      (window as AnySpeechRecognition).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startListening = useCallback(() => {
    const SR =
      (window as AnySpeechRecognition).SpeechRecognition ||
      (window as AnySpeechRecognition).webkitSpeechRecognition;
    if (!SR) return;

    const recognition: AnySpeechRecognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: AnySpeechRecognition) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      onTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: AnySpeechRecognition) => {
      if (event.error === "not-allowed") {
        onError?.("Microphone access was denied. Please allow microphone access and try again.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        onError?.("Voice recognition error. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    finalTranscript = "";
  }, [onTranscript, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, toggleListening, stopListening };
}
