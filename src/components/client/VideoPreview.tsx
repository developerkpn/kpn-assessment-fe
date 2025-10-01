import { snack } from "@/providers/SnackbarProvider";
import { Box, Button, Typography, CircularProgress, Stack } from "@mui/material";
import { useCallback, useRef, useState, useEffect } from "react";

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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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

  // Ensure video restarts when going back from preview mode
  useEffect(() => {
    if (!previewImageUrl && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [previewImageUrl, stream]);

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
      const imageUrl = canvasRef.current.toDataURL("image/jpeg", 0.8);
      const file = await dataURItoBlob(imageUrl, userId);

      // Store the preview image URL and file for preview
      setPreviewImageUrl(imageUrl);
      setPhotoFile(file);
    } catch (error) {
      console.error("Error capturing photo:", error);
      snack.error("Failed to capture photo");
    }
  }, [userId]);

  const handleSavePhoto = useCallback(async () => {
    if (photoFile) {
      await onCapture(photoFile);
      stream?.getTracks().forEach(track => {
        track.stop();
      });
    }
  }, [photoFile, onCapture]);

  const handleRetakePhoto = useCallback(() => {
    setPreviewImageUrl(null);
    setPhotoFile(null);

    // Reset the video stream to ensure it displays properly
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

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
          maxWidth: 380,
          aspectRatio: "4/3",
        }}
      >
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt="Captured photo preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            autoPlay
            muted
          />
        )}
      </Box>

      {previewImageUrl ? (
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={handleRetakePhoto}
            sx={{ minWidth: 120 }}
          >
            Retake
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSavePhoto}
            disabled={isCapturing}
            startIcon={isCapturing ? <CircularProgress size={20} /> : undefined}
            sx={{ minWidth: 120 }}
          >
            {isCapturing ? "Saving..." : "Save Photo"}
          </Button>
        </Stack>
      ) : (
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={capturePhoto}
          sx={{ minWidth: 140 }}
        >
          Capture Photo
        </Button>
      )}
    </Box>
  );
};

export default VideoPreview;
