import { Box, Grid2 as Grid } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { Control, useWatch, useFormContext } from "react-hook-form";
import TextFieldCtrl from "../forms/TextField";
import RTEField from "../forms/RTEField";
import useAuthStore from "@/hooks/useAuthStore";

type BatchOverviewProps = {
  control: Control<any>;
  isEdit?: boolean;
  getDescriptionValue?: () => string;
  setDescriptionValue?: (value: string) => void;
};

const BatchOverview: React.FC<BatchOverviewProps> = ({ 
  control, 
  isEdit = true,
  getDescriptionValue,
  setDescriptionValue 
}) => {
  const { setValue } = useFormContext();
  const roleName = useAuthStore(state => state.role_name);
  const isSuperAdmin = roleName === "Super Admin";
  
  // For create mode, we watch a temp field and sync it with the description object
  const tempDescriptionValue = useWatch({ control, name: "temp_description", defaultValue: "" });
  const lastTempValue = useRef<string>("");
  
  // Sync temp description to main description object (user typing)
  useEffect(() => {
    if (!isEdit && setDescriptionValue && tempDescriptionValue !== lastTempValue.current) {
      // Don't overwrite saved content with empty values during language type switches
      // Only sync when user actually types content (not empty or just <p><br></p>)
      const isEmpty = !tempDescriptionValue || tempDescriptionValue === "" || tempDescriptionValue === "<p><br></p>";
      
      if (!isEmpty) {
        lastTempValue.current = tempDescriptionValue;
        setDescriptionValue(tempDescriptionValue);
      }
    }
  }, [tempDescriptionValue, isEdit, setDescriptionValue]);

  // Sync main description to temp field when language changes (but avoid circular updates)
  useEffect(() => {
    if (!isEdit && getDescriptionValue) {
      // Get current language state without causing reactive updates
      const currentValue = getDescriptionValue();
      
      // Only update if the value is different and we're not in the middle of typing
      if (currentValue !== tempDescriptionValue && currentValue !== lastTempValue.current) {
        setValue("temp_description", currentValue);
      }
    }
  }, [isEdit, getDescriptionValue, setValue]); // Removed reactive dependencies

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextFieldCtrl
            control={control}
            label="Batch Name"
            name="batch_name"
            rules={{
              required: "Batch Name is required",
              maxLength: { value: 128, message: "Max 128 characters allowed" },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <RTEField
            control={control}
            label="Instruction"
            placeholder="Write Instruction"
            name={isEdit ? "description" : "temp_description"}
            disabled={!isSuperAdmin}
            sx={{ height: "12rem" }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BatchOverview;
