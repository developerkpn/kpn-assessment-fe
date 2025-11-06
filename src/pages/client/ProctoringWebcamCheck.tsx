import { ReactMediaRecorder } from "react-media-recorder";
import { useEffect, useRef, useState } from "react";
import useWebcamStore from "@/hooks/useWebcamStore";
import { Box, Button } from "@mui/material";
import { Check, Close } from "@mui/icons-material";
import { snack } from "@/providers/SnackbarProvider";
import useWebCamCheck from "@/hooks/useWebcamCheck";
import { useTranslation } from "react-i18next";

const VideoPreview = ({ stream }: { stream: MediaStream | null }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  return (
    <video
      style={{ width: "13rem", height: "10rem" }}
      ref={videoRef}
      width={1200}
      height={720}
      autoPlay
    />
  );
};

export default function ProctoringWebcamCheck({
  setAllowed,
}: {
  setAllowed: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const webcam_stream = useWebcamStore(state => state.webcam_stream);
  const allow_webcam = useWebCamCheck(state => state.allowWebcam);
  const setWebcamStream = useWebcamStore(state => state.setWebcamStream);
  const [cameraDisabled, setCameraDisabled] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [onClickWebcam, setOnClickWebcam] = useState(false);
  // Handle re-check button press
  return (
    <ReactMediaRecorder
      video
      audio={false}
      render={({ startRecording, stopRecording, previewStream, error }) => {
        // Setup permission check + recording logic
        useEffect(() => {
          if (error == "media_in_use" || error == "no_specified_media_found") {
            setCameraDisabled(true);
            setAllowed(false);
            setWebcamStream(null);
            stopRecording();
            snack.error(
              "Something wrong with camera, please enable camera and refresh your browser "
            );
          }
        }, [error]);
        useEffect(() => {
          // startRecordingRef.current = startRecording;
          let mounted = true;

          navigator.permissions
            .query({ name: "camera" as PermissionName })
            .then(permissionStatus => {
              const granted = permissionStatus.state === "granted";
              // console.log(permissionStatus.state);
              setAllowed(granted);

              // if (granted && mounted) {
              //   startRecording();
              // }

              permissionStatus.onchange = () => {
                const isGranted = permissionStatus.state === "granted";
                // setAllowed(isGranted);
                // if (isGranted && mounted) {
                //   startRecording();
                // }
              };
            })
            .catch(error => {
              console.error("Permission error:", error);
              setAllowed(false);
            });

          return () => {
            mounted = false;
          };
        }, []);

        // Set webcam stream once
        useEffect(() => {
          if (!previewStream) {
            return;
          }
          console.log("setting webcam global var");
          if (previewStream && !webcam_stream) {
            for (const track of previewStream.getTracks()) {
              if (track.readyState == "ended") {
                return;
              }
            }
            setWebcamStream(previewStream.clone());
            setAllowed(true);
            setCameraDisabled(false);
            // setStopRecording(stopRecording);
          }
          return () => {
            stopRecording();
          };
        }, [previewStream, webcam_stream, setWebcamStream]);

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <VideoPreview stream={webcam_stream} />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {webcam_stream ? (
                <>
                  <h4>{t('passed')}</h4>
                  <Check sx={theme => ({ color: theme.palette.success.main })} />
                </>
              ) : (
                <>
                  <h4>{t('denied')}</h4>
                  <Close sx={theme => ({ color: theme.palette.error.main })} />
                </>
              )}
            </Box>
            <Button
              onClick={() => {
                if (cameraDisabled && !onClickWebcam) {
                  snack.error(
                    "Something wrong with camera, please enable camera and refresh your browser "
                  );
                }
                setWebcamStream(null); // reset
                // setChecking(true);
                navigator.permissions
                  .query({ name: "camera" as PermissionName })
                  .then(permissionStatus => {
                    const granted = permissionStatus.state === "granted";
                    // console.log(permissionStatus.state);
                    // console.log("granted");
                    setAllowed(granted);
                    if (granted) {
                      startRecording();
                      setOnClickWebcam(true);
                    }
                  });
                startRecording();
                setOnClickWebcam(true);
              }}
              size="small"
              variant="contained"
            >
              {t('check_webcam')}
            </Button>
          </Box>
        );
      }}
    />
  );
}
