import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RotateCcw, Send, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onAnalysis: (analysis: string, imageDataUrl: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onAnalysis, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      setError(err.message.includes("denied") ? "Camera access denied. Please allow camera permission." : "Could not start camera.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setCaptured(null);
    setCameraReady(false);
    startCamera();
  };

  const analyze = async () => {
    if (!captured) return;
    setIsAnalyzing(true);
    try {
      const base64 = captured.split(",")[1];
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg", question: question.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      onAnalysis(data.analysis, captured);
      onClose();
    } catch {
      setError("Vision analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Vision Capture</h2>
              <p className="text-xs text-muted-foreground">Show Gadus anything — it'll analyze what it sees</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Camera / Capture area */}
        <div className="relative bg-black aspect-video">
          <video ref={videoRef} className={`w-full h-full object-cover ${captured ? "hidden" : "block"}`} playsInline muted />
          {captured && <img src={captured} alt="Captured" className="w-full h-full object-cover" />}
          <canvas ref={canvasRef} className="hidden" />

          {!cameraReady && !captured && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Viewfinder overlay */}
          {cameraReady && !captured && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/80 rounded-tl" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/80 rounded-tr" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/80 rounded-bl" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/80 rounded-br" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {captured && (
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask about this image... (optional)"
              className="w-full bg-muted/50 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={e => { if (e.key === "Enter") analyze(); }}
            />
          )}

          <div className="flex gap-2">
            {!captured ? (
              <Button
                className="flex-1 gap-2"
                onClick={capture}
                disabled={!cameraReady}
              >
                <Camera className="w-4 h-4" />
                Capture
              </Button>
            ) : (
              <>
                <Button variant="outline" className="gap-2" onClick={retake}>
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </Button>
                <Button className="flex-1 gap-2" onClick={analyze} disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isAnalyzing ? "Analyzing…" : "Analyze with Gadus"}
                </Button>
              </>
            )}
          </div>

          {error && captured && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
