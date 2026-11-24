import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Close as CloseIcon, Download as DownloadIcon } from "@mui/icons-material";

interface PdfViewerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  downloadUrl: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  open,
  onClose,
  title,
  fileUrl,
  downloadUrl,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Vendor Assessment Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Download PDF">
            <IconButton
              component="a"
              href={downloadUrl}
              download
              color="primary"
              size="small"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: "78vh", backgroundColor: "#525659" }}>
        {fileUrl ? (
          <iframe
            src={fileUrl}
            title="PDF Preview"
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "white",
            }}
          >
            <Typography>No file URL provided</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          component="a"
          href={downloadUrl}
          download
          variant="contained"
          startIcon={<DownloadIcon />}
        >
          Download Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PdfViewerModal;
