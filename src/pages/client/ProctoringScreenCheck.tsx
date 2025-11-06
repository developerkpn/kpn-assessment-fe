import { ReactMediaRecorder } from "react-media-recorder";
import useScreenShareStore from "@/hooks/useScreenShareStore";
import { useEffect, useRef, useState } from "react";
import { Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DialogNotWantedScreenShare from "./DialogNotWantedScreenShare";
import { Check, Close } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const VideoPreview = ({ stream }: { stream: MediaStream | null }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video
      style={{
        width: "13rem",
        height: "10rem",
      }}
      ref={videoRef}
      width={1200}
      height={720}
      autoPlay
    />
  );
};

export default function ProctoringScreenCheck({
  setAllowed,
}: {
  setAllowed: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setScreenStream = useScreenShareStore(state => state.setScreenStream);
  const screen_stream = useScreenShareStore(state => state.screen_stream);
  const [openDialog, setOpenDialog] = useState(false);
  return (
    <ReactMediaRecorder
      screen={true}
      audio={false}
      render={({ status, startRecording, stopRecording, previewStream }) => {
        const [track, setTrack] = useState<MediaStreamTrack | null>(null);
        useEffect(() => {
          (async () => {
            if ((status == "recording" && previewStream) || screen_stream) {
              setAllowed(true);
              setScreenStream(previewStream ?? screen_stream);
            } else {
              setAllowed(false);
            }
          })();
        }, [status]);
        useEffect(() => {
          if (previewStream && screen_stream) {
            const track = screen_stream?.getVideoTracks()[0];
            if (!track.label.match("screen") && !openDialog && screen_stream.active) {
              stopRecording();
              setScreenStream(null);
              setOpenDialog(true);
            }
            if (track) {
              track.onended = () => {
                setScreenStream(null);
              };
            }
          }
        }, [previewStream, screen_stream]);
        useEffect(() => {
          console.log(previewStream);
          if (previewStream && !screen_stream && previewStream.active) {
            for (const track of previewStream.getTracks()) {
              if (track.readyState == "ended") {
                return;
              }
            }
            setScreenStream(previewStream.clone());
          }
          return () => {
            if (screen_stream) {
              stopRecording();
            }
          };
        }, [previewStream, screen_stream]);
        // console.log(screen_stream);
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <VideoPreview stream={screen_stream} />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {screen_stream ? (
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
                startRecording();
              }}
              size="small"
              variant="contained"
            >
              {t('check_screen_share')}
            </Button>
            <DialogNotWantedScreenShare open={openDialog} setOpen={setOpenDialog} />
          </Box>
        );
      }}
    />
  );
}
