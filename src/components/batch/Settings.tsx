import { Box, Divider, Stack, Typography } from "@mui/material";
import React from "react";
import { Control, Controller } from "react-hook-form";
import { FaRandom } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa6";
import { GiCardRandom } from "react-icons/gi";
import { RiScreenshot2Fill } from "react-icons/ri";
import CustomSwitch from "../CustomSwitch";

type SettingsProps = {
  control: Control<any>;
};

const Settings: React.FC<SettingsProps> = ({ control }) => {
  return (
    <>
      <Typography variant="h5" fontWeight={600}>
        Settings
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Configure the settings for the batch.
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "650px",
          }}
        >
          <Typography variant="h6" fontWeight={600} mt={2}>
            Proctoring
          </Typography>
          {/* <Box sx={{ border: "1px solid", padding: "8px" }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
              sx={{ px: 2 }}
            >
              <Stack>
                <FaMicrophone fontSize="26px" />
              </Stack>
              <Stack sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Enable Audio
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enable audio proctoring for the batch.
                </Typography>
              </Stack>
              <Stack>
                <Controller
                  name="is_mic"
                  control={control}
                  render={({ field }) => (
                    <CustomSwitch
                      value={field.value}
                      onChange={(checked) => field.onChange(checked)}
                    />
                  )}
                />
              </Stack>
            </Stack>
          </Box> */}
          {/* <Box sx={{ border: "1px solid", padding: "8px", mt: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
              sx={{ px: 2 }}
            >
              <Stack>
                <RiScreenshot2Fill fontSize="26px" />
              </Stack>
              <Stack sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Enable Screenshot
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enable screenshot proctoring for the batch
                </Typography>
              </Stack>
              <Stack>
                <Controller
                  name="is_screenshot"
                  control={control}
                  render={({ field }) => (
                    <CustomSwitch
                      value={field.value}
                      onChange={(checked) => field.onChange(checked)}
                    />
                  )}
                />
              </Stack>
            </Stack>
          </Box> */}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "650px",
          }}
        >
          <Typography variant="h6" fontWeight={600} mt={2}>
            Settings
          </Typography>
          <Box sx={{ border: "1px solid", padding: "8px" }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
              sx={{ px: 2 }}
            >
              <Stack>
                <GiCardRandom fontSize="26px" />
              </Stack>
              <Stack sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Randomize Series Order
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Randomize the order of series for the batch.
                </Typography>
              </Stack>
              <Stack>
                <CustomSwitch onChange={() => {}} />
              </Stack>
            </Stack>
          </Box>
          <Box sx={{ border: "1px solid", padding: "8px", mt: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
              sx={{ px: 2 }}
            >
              <Stack>
                <FaRandom fontSize="26px" />
              </Stack>
              <Stack sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Randomize Question Order
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Randomize the order of questions for the batch.
                </Typography>
              </Stack>
              <Stack>
                <CustomSwitch onChange={() => {}} />
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </>
  );
};
export default Settings;
