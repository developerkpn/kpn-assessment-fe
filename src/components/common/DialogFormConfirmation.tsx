import { Dialog, DialogActions, Button, DialogTitle, DialogContent } from "@mui/material";
import { useState, useMemo, ReactNode, useRef, useImperativeHandle, forwardRef } from "react";
import { snack } from "@/providers/SnackbarProvider";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

export type RefDialogConfirmation = {
  setOpen: (value: boolean) => void;
};

interface DialogFormConfirmationInterface {
  Content: ReactNode;
  onYes: (values: any) => void | Promise<void>;
  onNo?: () => void;
  Title?: string | ReactNode;
  values?: any;
  i18?: boolean;
}

const DialogFormConfirmation = forwardRef<RefDialogConfirmation, DialogFormConfirmationInterface>(
  (props, ref) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      setOpen,
    }));

    const onYesClick = async () => {
      try {
        setLoading(true);
        await props.onYes(props.values);
      } catch (error) {
        let message = (error as Error).message;
        if (!message && isAxiosError(error)) {
          message = error.response?.data.message;
        }
        snack.error(message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const onNoClick = () => {
      if (props.onNo) {
        props.onNo();
      }
      setOpen(false);
    };

    return (
      <>
        <Dialog open={open} maxWidth="xl">
          <DialogTitle>{props.Title}</DialogTitle>
          <DialogContent>{props.Content}</DialogContent>

          <DialogActions>
            <Button variant="outlined" color="error" onClick={() => onNoClick()}>
              {props.i18 ? t("Cancel") : "Cancel"}
            </Button>
            <Button
              onClick={async () => await onYesClick()}
              color="primary"
              variant="contained"
              loading={loading}
            >
              {props.i18 ? t("Confirm") : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
);

export default DialogFormConfirmation;
