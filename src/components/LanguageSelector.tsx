import useLanguageStore from "@/hooks/useLanguageStore";
import { API } from "@/utils/api";
import { Language } from "@mui/icons-material";
import { FormControl, MenuItem, Select, SelectChangeEvent, Box, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface LanguageSelectorProps {
  variant?: "default" | "light";
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = "default" }) => {
  const { i18n } = useTranslation();
  const { selectedLanguage, availableLanguages, setSelectedLanguage, setAvailableLanguages } =
    useLanguageStore();

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await API.get("/languages/client");
        console.log(response);
        if (response.data?.data) {
          setAvailableLanguages(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch languages:", error);
      }
    };

    if (availableLanguages.length === 0) {
      fetchLanguages();
    }
  }, [availableLanguages.length, setAvailableLanguages]);

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    setSelectedLanguage(event.target.value);
    i18n.changeLanguage(event.target.value);
  };

  if (availableLanguages.length === 0) {
    return null;
  }

  const isLight = variant === "light";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Language fontSize="small" sx={isLight ? { color: "white" } : {}} />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <Select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          displayEmpty
          renderValue={(value) => {
            const selected = availableLanguages.find(lang => lang.language_code === value);
            if (!selected) return null;
            return (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography 
                  variant="body2" 
                  sx={isLight ? { color: "white" } : {}}
                >
                  {selected.language_name}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={isLight ? { color: "white" } : { color: "text.secondary" }}
                >
                  {selected.language_name_native}
                </Typography>
              </Box>
            );
          }}
          sx={{
            ...(isLight && {
              backgroundColor: "rgba(0, 0, 0, 0.12)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.18)",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& .MuiSvgIcon-root": {
                color: "white",
              },
            }),
            "& .MuiSelect-select": {
              py: 1,
            },
          }}
        >
          {availableLanguages.map(lang => (
            <MenuItem key={lang.language_code} value={lang.language_code}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="body2">{lang.language_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang.language_name_native}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;
