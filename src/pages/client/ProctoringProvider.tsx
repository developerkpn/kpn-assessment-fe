import useAPI from "@/hooks/useAPI";
import useAuthDarwinStore from "@/hooks/useAuthDarwinStore";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import useCheckFocus from "@/hooks/useCheckUnfocus";
import useClientEnvStore from "@/hooks/useClientEnvStore";
import useQNAIdentityStore from "@/hooks/useQNAIdentityStore";
import useScreenShareStore from "@/hooks/useScreenShareStore";
import useWebcamStore from "@/hooks/useWebcamStore";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { Detector } from "detector-js";
import { createContext, ReactNode, useContext, useEffect, useRef, useState, useMemo } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import { useNavigate, useParams } from "react-router-dom";

const VideoProctoringContext = createContext<{
  status_active: boolean;
  image_captured: File | null;
}>({
  status_active: false,
  image_captured: null,
});

const VideoPreview = ({
  stream,
  setImageSrc,
  user_id,
  canvasRef,
  hide,
  setHide,
  isskip,
}: {
  stream: MediaStream | null;
  setImageSrc: (value: File) => void;
  user_id: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hide: boolean;
  setHide: (value: boolean | ((x: boolean) => boolean)) => void;
  isskip: boolean;
}) => {
  function dataURItoBlob(dataURI: string, user_id: string) {
    return new Promise<File>((resolve, reject) => {
      try {
        var byteString = atob(dataURI.split(",")[1]);

        var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        resolve(new File([blob], `prctr_${user_id}`));
      } catch (error) {
        reject(error);
      }
    });
  }
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const buttonRefPos = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const { id: subtest_id, token } = useParams();
  const batch_id = useQNAIdentityStore(state => state.batch_id);

  const mediaQuery = useMediaQuery(theme => theme.breakpoints.down("lg"));
  const screen_stream = useScreenShareStore(state => state.screen_stream);
  const { isPageVisible, isFocused } = useCheckFocus();
  useEffect(() => {
    if (videoRef.current && stream) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = stream;

        buttonRefPos.current.width = videoRef.current.clientWidth;
        buttonRefPos.current.height = videoRef.current.clientHeight;
      }
    }
  }, [stream]);

  useEffect(() => {
    if (screenRef.current && screen_stream) {
      if (!screenRef.current.srcObject) {
        screenRef.current.srcObject = screen_stream;
      }
    }
  }, [screen_stream]);

  const api = useAPI();

  const getScreenShot = async () => {
    try {
      const fd = new FormData();
      if (canvasRef.current === null) {
        return;
      }
      canvasRef.current.width = videoRef.current?.videoWidth || 100;
      canvasRef.current.height = videoRef.current?.videoHeight || 100;
      if (videoRef.current) {
        canvasRef.current.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        const image = canvasRef.current.toDataURL("image/png");
        const File = await dataURItoBlob(image, user_id);
        fd.append("webcam", File);
      }

      canvasRef.current.width = screenRef.current?.videoWidth || 100;
      canvasRef.current.height = screenRef.current?.videoHeight || 100;
      if (screenRef.current) {
        canvasRef.current.getContext("2d")?.drawImage(screenRef.current, 0, 0);
        const image = canvasRef.current.toDataURL("image/png");
        const File = await dataURItoBlob(image, user_id);
        fd.append("screen", File);
      }
      fd.append("batch_id", batch_id);
      fd.append("subtest_id", subtest_id ?? "");
      fd.append("user_id", user_id);
      api.post("/proctoring/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const sendLogMessage = async (code: string, misc: {} = {}) => {
    try {
      let message = "";
      switch (code) {
        case "1":
          message = "User is changing window / minimize browser";
          break;
      }
      let payload = { log: message, log_code: code };
      const result = await api.post(`/assessment/${token}/subtest/${subtest_id}`, payload);
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!isskip) {
      let interval = setInterval(() => {
        getScreenShot();
      }, 1000 * 3 * 60);

      return () => clearInterval(interval);
    }
  }, [stream]);

  useEffect(() => {
    if (!isFocused && !isskip) {
      getScreenShot();
      const message = sendLogMessage("1");
      console.log(message);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isPageVisible && !isskip) {
      // getScreenShot();
      const message = sendLogMessage("1");
      // console.log(message);
    }
  }, [isPageVisible]);

  useEffect(() => {
    if (mediaQuery) {
      setHide(true);
    }
  }, [mediaQuery]);

  if (!stream) {
    return null;
  }
  return (
    <>
      <Box
        sx={theme => ({
          position: "fixed",
          top: "100px",
          right: 0,
          width: "fit-content",
          display: hide ? "none" : "",
        })}
      >
        <video
          style={{
            width: "13rem",
            height: "10rem",
            borderRadius: "0 0 0 20px",
          }}
          ref={videoRef}
          width={1200}
          height={720}
          autoPlay
        />
        <video ref={screenRef} width={1200} height={720} autoPlay hidden />
      </Box>
      {videoRef.current && (
        <IconButton
          sx={theme => ({
            position: "fixed",
            top: "100px",
            right: hide ? -10 : (buttonRefPos.current?.width || 100) - 20,
            zIndex: 1,
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
          })}
          onClick={() => setHide(prev => !prev)}
        >
          {hide ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      )}
    </>
  );
};

export default function ProctoringProvider({
  children,
  isskip = false,
}: {
  children: ReactNode;
  isskip?: boolean;
}) {
  const [imageSrc, setImageSrc] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(document.createElement("canvas"));
  const [hide, setHide] = useState(false);
  const webcam_stream = useWebcamStore(state => state.webcam_stream);
  const screen_stream = useScreenShareStore(state => state.screen_stream);
  const navigate = useNavigate();
  const { token, id } = useParams();
  const setClientEnv = useClientEnvStore(state => state.setClientEnv);
  const brwsr_app = useClientEnvStore(state => state.brwsr_app);
  const detector = new Detector();
  const darwin_sess = useAuthDarwinStore(state => state.darwin_sess);
  const ext_sess = useAuthExternStore(state => state.ext_sess);

  const user_id: string = useMemo(() => {
    if (darwin_sess && darwin_sess.employee_id) {
      return darwin_sess.employee_id;
    } else if (ext_sess && ext_sess.user_id) {
      return ext_sess.user_id;
    } else {
      return "";
    }
    return "";
  }, [darwin_sess, ext_sess]);
  useEffect(() => {
    if (brwsr_app == "") {
      const browser = detector.browser as unknown as { name: string; version: string };
      setClientEnv({ brwsr_app: `${browser.name} (${browser.version})` });
      console.log(browser);
    }
  }, []);

  useEffect(() => {
    if (!(webcam_stream && screen_stream)) {
      navigate(`/client/assessment/${token}/subtest/${id}/proctor`);
    }
  }, [webcam_stream, screen_stream]);
  return (
    <VideoProctoringContext.Provider value={{ status_active: true, image_captured: imageSrc }}>
      <ReactMediaRecorder
        video
        audio={false}
        render={({ startRecording, previewStream }) => {
          useEffect(() => {
            if (!webcam_stream) startRecording();
          }, []);
          return (
            <VideoPreview
              stream={webcam_stream ?? previewStream}
              setImageSrc={setImageSrc}
              user_id={user_id ?? ""}
              canvasRef={canvasRef}
              hide={hide}
              setHide={setHide}
              isskip={isskip}
            />
          );
        }}
      />

      {children}
    </VideoProctoringContext.Provider>
  );
}

export const useProctoring = () => useContext(VideoProctoringContext);
