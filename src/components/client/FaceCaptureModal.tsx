import { snack } from "@/providers/SnackbarProvider";
import { Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useCallback, useState, useEffect, useRef } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import VideoPreview from "./VideoPreview";
interface FaceCaptureModalProps {
  open: boolean;
  onPhotoCapture: (photoFile: File) => Promise<void>;
  userId: string;
}

export default function FaceCaptureModal({ open, onPhotoCapture, userId }: FaceCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const handleCapture = useCallback(
    async (file: File) => {
      setIsCapturing(true);
      try {
        await onPhotoCapture(file);
      } catch (error) {
        console.error("Error uploading photo:", error);
        snack.error("Failed to upload photo");
      } finally {
        setIsCapturing(false);
      }
    },
    [onPhotoCapture]
  );

  useEffect(() => {
    if (!open) {
      stopRecordingRef.current?.();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      slotProps={{
        paper: {
          sx: { borderRadius: 2 },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="h5" component="div" gutterBottom>
          Capture Your Photo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Take a clear photo of your face, then review and save it. This photo will be used as your
          profile picture.
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
      >
        <ReactMediaRecorder
          video
          render={({ startRecording, stopRecording, previewStream }) => {
            useEffect(() => {
              startRecording();
              stopRecordingRef.current = stopRecording;
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
          Make sure your face is clearly visible and well-lit before capturing. You can review and
          retake the photo if needed.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
