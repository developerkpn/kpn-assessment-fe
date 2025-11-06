import { Card, Box, Button, Typography, Chip } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import dayjs from "dayjs";
import "dayjs/locale/id";
import "dayjs/locale/zh";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import moment from "moment";
import { BatchMain } from "@/types/AssessmentTypes";
import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import { snack } from "@/providers/SnackbarProvider";
import useTokenDarwin from "@/hooks/useTokenDarwin";
import { useTranslation } from "react-i18next";

export default function CardOSBatches({ param }: { param: BatchMain }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const is_complete = useAuthExternStore(state => state.is_complete);
  const token_drw = useTokenDarwin(state => state.token_drw);

  const now = moment();
  const startDate = moment(param.start_period);
  const endDate = moment(param.end_period);

  const isBeforeStart = now.isBefore(startDate);
  const isAfterEnd = now.isAfter(endDate);
  const isDisabled = isBeforeStart || isAfterEnd;

  const onClickCard = () => {
    if (!is_complete && !token_drw) {
      snack.error("Please complete identity first");
      return;
    }

    if (isBeforeStart) {
      snack.warning("Batch period has not started yet");
      return;
    }

    if (isAfterEnd) {
      snack.warning("Batch period already ended");
      return;
    }

    navigate(`/client/${param.token}`);
  };

  const formatDate = useCallback(
    (dateString: string) => {
      if (!dateString) return "N/A";
      return dayjs(dateString).locale(i18n.language).format("D MMM YYYY, HH:mm");
    },
    [i18n.language]
  );

  const start_period = useMemo(() => {
    return formatDate(param.start_period);
  }, [param.start_period, formatDate]);

  const end_period = useMemo(() => {
    return formatDate(param.end_period);
  }, [param.end_period, formatDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Not Taken":
      default:
        return "warning";
    }
  };

  return (
    <Card elevation={2} sx={{ borderRadius: 2, p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {param.batch_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({param.batch_code})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {start_period} – {end_period}
          </Typography>
          <Chip
            label={t(param.progress.status)}
            color={getStatusColor(param.progress.status)}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
        <Button
          onClick={onClickCard}
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          disabled={isDisabled}
        >
          {t('start')}
        </Button>
      </Box>
    </Card>
  );
}
