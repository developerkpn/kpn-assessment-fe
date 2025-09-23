import { snack } from "@/providers/SnackbarProvider";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress
} from "@mui/material";
import { useCallback, useRef, useState, useEffect } from "react";
import { ReactMediaRecorder } from "react-media-recorder";

interface FaceCaptureModalProps {
  open: boolean;
  onPhotoCapture: (photoFile: File) => Promise<void>;
  userId: string;
}

const VideoPreview = ({
  stream,
  onCapture,
  userId,
  isCapturing,
}: {
  stream: MediaStream | null;
  onCapture: (file: File) => Promise<void>;
  userId: string;
  isCapturing: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(document.createElement("canvas"));

  function dataURItoBlob(dataURI: string, userId: string): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      try {
        const byteString = atob(dataURI.split(",")[1]);
        const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        resolve(new File([blob], `profile_${userId}.jpg`, { type: "image/jpeg" }));
      } catch (error) {
        reject(error);
      }
    });
  }

  useEffect(() => {
    if (videoRef.current && stream) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    try {
      if (!canvasRef.current || !videoRef.current) {
        throw new Error("Canvas or video not available");
      }

      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;

      const context = canvasRef.current.getContext("2d");
      if (!context) {
        throw new Error("Could not get canvas context");
      }

      context.drawImage(videoRef.current, 0, 0);
      const image = canvasRef.current.toDataURL("image/jpeg", 0.8);
      const file = await dataURItoBlob(image, userId);

      await onCapture(file);
    } catch (error) {
      console.error("Error capturing photo:", error);
      snack.error("Failed to capture photo");
    }
  }, [onCapture, userId]);

  if (!stream) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Initializing camera...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          border: "2px solid",
          borderColor: "grey.300",
          borderRadius: 2,
          overflow: "hidden",
          width: "100%",
          maxWidth: 480,
          aspectRatio: "4/3"
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
          autoPlay
          muted
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={capturePhoto}
        disabled={isCapturing}
        startIcon={isCapturing ? <CircularProgress size={20} /> : undefined}
        sx={{ minWidth: 140 }}
      >
        {isCapturing ? "Processing..." : "Capture Photo"}
      </Button>
    </Box>
  );
};

export default function FaceCaptureModal({ open, onPhotoCapture, userId }: FaceCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = useCallback(async (file: File) => {
    setIsCapturing(true);
    try {
      await onPhotoCapture(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      snack.error("Failed to upload photo");
    } finally {
      setIsCapturing(false);
    }
  }, [onPhotoCapture]);

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="h5" component="div" gutterBottom>
          Capture Your Photo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please take a clear photo of your face for verification purposes.
          This photo will be used as your profile picture.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <ReactMediaRecorder
          video
          render={({ startRecording, previewStream }) => {
            useEffect(() => {
              startRecording();
            }, []);

            return (
              <VideoPreview
                stream={previewStream}
                onCapture={handleCapture}
                userId={userId}
                isCapturing={isCapturing}
              />
            );
          }}
        />

        <Typography variant="caption" color="text.secondary" textAlign="center">
          Make sure your face is clearly visible and well-lit before capturing.
          This modal cannot be closed until a photo is taken.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}