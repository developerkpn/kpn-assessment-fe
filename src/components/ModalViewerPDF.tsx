import { Document, Page, pdfjs } from "react-pdf";
import useAPI from "@/hooks/useAPIAssesse";
import {
  Skeleton,
  Dialog,
  Box,
  Paper,
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
} from "@mui/material";

import { useEffect, useRef, useState } from "react";
import { snack } from "@/providers/SnackbarProvider";
import { isAxiosError } from "axios";
import useGuidelineReadStore from "@/hooks/useGuidelineReadStore";
import { useTranslation } from "react-i18next";
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

interface ModalViewerPDFInterface {
  open: boolean;
  setOpen: (value: boolean) => void;
}

function ModalViewerPDF({ open, setOpen }: ModalViewerPDFInterface) {
  const { t } = useTranslation();
  const api = useAPI();
  const [pages, setPages] = useState(1);
  const [PDFData, setPDFData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setGuidelineStatus, guideline_status } = useGuidelineReadStore();
  const refTop = useRef<HTMLElement | null>(null);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/guideline/getfile", { responseType: "blob" });
        setPDFData(data);
      } catch (error) {
        if (isAxiosError(error)) {
          snack.error(error?.response?.data.message);
        } else {
          snack.error((error as Error).message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const OnDocumentLoad = ({ numPages }: { numPages: any }) => {
    console.log(numPages);
    setPages(numPages);
  };

  const [pageNum, setPageNum] = useState(1);
  useEffect(() => {
    console.log(pageNum);
  }, [pageNum]);
  return (
    <Dialog open={open} maxWidth="xl">
      <DialogTitle className="top" ref={refTop}>
        <Box className="client" sx={{ display: "flex", flexDirection: "column" }}>
          <h3>{t('user_guideline_title')}</h3>
          <em>{t('user_guideline_subtitle')}</em>
        </Box>
      </DialogTitle>
      <Box sx={{ m: 1 }}>
        {!PDFData && loading && <Skeleton variant="rectangular" width={400} height={300} />}
        {!PDFData && !loading && <h3>Data not found</h3>}
        {PDFData && (
          <Paper sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <Document
              file={PDFData}
              onLoadSuccess={OnDocumentLoad}
              onLoadError={console.error}
              scale={1.5}
            >
              <Page pageNumber={pageNum} />
            </Document>
          </Paper>
        )}
      </Box>

      <DialogActions>
        {pages != pageNum && (
          <>
            <Button
              variant="contained"
              color="warning"
              onClick={e => {
                if (refTop.current) {
                  refTop.current.scrollIntoView();
                }
                setPageNum(pageNum + 1);
              }}
            >
              Next
            </Button>
          </>
        )}
        {pages == pageNum && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={e => {
                setOpen(false);
                setGuidelineStatus({ ...guideline_status, guideline_opened: true });
              }}
            >
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ModalViewerPDF;
