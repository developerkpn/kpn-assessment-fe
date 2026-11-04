import useAPI from "@/hooks/useAPI";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { isAxiosError } from "axios";
import React, { useState } from "react";
import { Control, useFormContext } from "react-hook-form";
import { FaTrash } from "react-icons/fa";
import { FaCircleChevronRight } from "react-icons/fa6";
import { snack } from "../../providers/SnackbarProvider";
import SelectCtrl from "../forms/Select";
import parse from "html-react-parser";

type AddGroupTestProps = {
  control: Control<any>;
  batchData: any;
};

const AddGroupTest: React.FC<AddGroupTestProps> = ({ control, batchData }) => {
  const API = useAPI();
  const { setValue, watch } = useFormContext();
  const { showLoading, hideLoading } = useLoading();

  // Helper function to get description value - handles both string and object formats
  const getDescriptionForDisplay = () => {
    if (!batchData.description) return "";
    
    // If it's a string (edit mode), return as-is
    if (typeof batchData.description === "string") {
      return batchData.description;
    }
    
    // If it's an object (create mode), try to get current language value
    if (typeof batchData.description === "object") {
      const languageId = watch("language_id");
      const languageType = watch("language_type");
      
      if (languageType === "main" && batchData.description.main_language) {
        return batchData.description.main_language.description || "";
      }
      
      if (languageType === "sub" && languageId && batchData.description.sub_language) {
        const translation = batchData.description.sub_language.find(
          (t: any) => t.language_code === languageId
        );
        return translation?.description || "";
      }
      
      // Fallback: try main language description
      if (batchData.description.main_language?.description) {
        return batchData.description.main_language.description;
      }
    }
    
    return "";
  };
  const [loading, setLoading] = useState(false);
  const { data: grouptests } = useFetch<any>("/grouptest/active");

  const grouptest_id = watch("grouptest_id");
  const groupTest = watch("grouptest") || [];
  console.log("Group Test: ", groupTest);

  const handleSelectGroup = async () => {
    if (!grouptest_id) {
      snack.error("Please select group test first");
      return;
    }
    setLoading(true);
    showLoading();
    try {
      const response = await API.get(`/grouptest/${grouptest_id}`);
      console.log("Group Test: ", response.data.data);
      setValue("grouptest", response.data.data);
    } catch (error) {
      console.error("Error fetching group test", error);
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      } else {
        snack.error("Failed to select group test");
      }
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setValue("grouptest_id", "");
    setValue("grouptest", []);
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" color="textSecondary" fontWeight={600}>
          {batchData.batch_code}
        </Typography>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          {batchData.batch_name}
        </Typography>
        <Box>{parse(getDescriptionForDisplay() || "")}</Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" color="textSecondary" fontWeight={600} gutterBottom>
        Group Test
      </Typography>
      {groupTest.length != 0 ? (
        <Box sx={{ mt: 2 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: "#f0f4f8",
              p: 3,
              borderRadius: 1,
              position: "relative",
            }}
          >
            <Box sx={{ position: "absolute", top: 16, right: 16 }}>
              <IconButton onClick={handleRemove} size="small">
                <FaTrash />
              </IconButton>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {groupTest.grouptest_code}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {groupTest.grouptest_name}
              </Typography>
            </Box>

            {groupTest.tests &&
              groupTest.tests.map((test: any, index: number) => (
                <Paper
                  key={test.id || index}
                  elevation={0}
                  sx={{
                    mb: 1,
                    p: 2,
                    bgcolor: "#ffffff",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {test.test_code}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {test.test_name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(
                        `${location.protocol}//${location.hostname}${
                          import.meta.env.MODE == "development" ? `:${location.port}` : ""
                        }/admin/test/detail/${test.test_id}`
                      );
                    }}
                  >
                    <FaCircleChevronRight />
                  </IconButton>
                </Paper>
              ))}
          </Paper>
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
          <Typography variant="body2" color="textSecondary" fontWeight={600}>
            Select Group Test :
          </Typography>
          <SelectCtrl name="grouptest_id" control={control} label="Group Test">
            {grouptests?.data.map((group: any) => (
              <MenuItem key={group.id} value={group.id}>
                {group.grouptest_name}
              </MenuItem>
            ))}
          </SelectCtrl>
          <Button
            variant="contained"
            disabled={loading || !grouptest_id}
            onClick={handleSelectGroup}
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "#c03852" },
              minWidth: 100,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Select"}
          </Button>
        </Box>
      )}
    </>
  );
};
export default AddGroupTest;
