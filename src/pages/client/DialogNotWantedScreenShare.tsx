import { Dialog, Button, Box } from "@mui/material";
import { Block } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import { forwardRef, useImperativeHandle, useState } from "react";

export interface DialogNotWantedScreenShareInt {
  setOpen: (value: boolean) => void;
  open: boolean;
}

const DialogNotWantedScreenShare = ({ open, setOpen }: DialogNotWantedScreenShareInt) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Block sx={{ width: "20rem" }} />
        <h2>{t("The selected window cannot be shared")}</h2>
        <h4>{t("Please share your entire screen where the test is being conducted")}</h4>
        <h4>
          <em>{t(`Click "Check Screen Share" again and select "Entire Screen"`)}</em>
        </h4>
        <Button onClick={e => setOpen(false)}>Ok</Button>
      </Box>
    </Dialog>
  );
};

export default DialogNotWantedScreenShare;
