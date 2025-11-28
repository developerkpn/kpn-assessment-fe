import { ReactNode, useEffect, useRef, useState } from "react";
import { Backdrop, Box, Alert } from "@mui/material";
import { Warning } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

// import { GlobalKeyboardListener } from "node-global-key-listener";

export default function AntiCopyProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // const v = new GlobalKeyboardListener();
  const [is_focus, setIsFocus] = useState(true);
  const backdropRef = useRef<any>(null);
  const mouseleave = () => {
    setIsFocus(false);
  };
  const mouseIn = () => {
    setIsFocus(true);
  };

  // useEffect(() => {
  //   v.addListener(function (e, down) {
  //     console.log(`${e.name} ${e.state == "DOWN" ? "DOWN" : "UP  "} [${e.rawKey._nameRaw}]`);
  //   });
  // }, []);

  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    // Disable PrintScreen and common dev tool shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        e.key === "printscreen" ||
        (e.ctrlKey && ["u", "s", "c"].includes(key)) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        navigator.clipboard.writeText("");
        if (backdropRef.current) {
          backdropRef.current.style.visibility = "";
          backdropRef.current.style.opacity = "1";
        }
        setTimeout(() => {
          alert("Screenshots and inspection are not allowed.");
        }, 500);
      }
      // if (e.metaKey && e.shiftKey) {
      //   if (backdropRef.current) {
      //     backdropRef.current.style.visibility = "";
      //     backdropRef.current.style.opacity = "1";
      //   }
      // }
    };

    // const handleKeyUp = (e: KeyboardEvent) => {
    //   console.log(e);
    //   const key = e.key.toLowerCase();
    //   if (key == "printscreen") {
    //     e.preventDefault();
    //     navigator.clipboard.writeText("");
    //     if (backdropRef.current) {
    //       backdropRef.current.style.visibility = "";
    //       backdropRef.current.style.opacity = "1";
    //     }
    //     setTimeout(() => {
    //       alert("Screenshots and inspection are not allowed.");
    //     }, 500);
    //   }
    // };
    document.addEventListener("keydown", handleKeyDown);
    // document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      // document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  return (
    <Box
      sx={{ width: "100%", height: "100%" }}
      className="anti-copy"
      onMouseLeave={() => {
        mouseleave();
      }}
      onMouseOver={() => {
        mouseIn();
      }}
    >
      <Backdrop
        ref={backdropRef}
        open={!is_focus}
        sx={{ backdropFilter: "blur(10px)", zIndex: "9999999" }}
        onClick={e => {
          if (backdropRef.current) {
            backdropRef.current.style.visibility = "hidden";
            backdropRef.current.style.opacity = "0";
          }
          setIsFocus(true);
        }}
      >
        <Box>
          <Alert severity="warning" icon={false}>
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Warning color="warning" sx={{ width: "40px", height: "40px" }} />
              <h2>
                {t("Please focus on your test, hover back cursor to test area or press any key")}
              </h2>
            </Box>
          </Alert>
        </Box>
      </Backdrop>
      {children}
    </Box>
  );
}
