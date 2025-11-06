import useAPI from "@/hooks/useAPIAssesse";
import LanguageSelector from "@/components/LanguageSelector";
import useLanguageStore from "@/hooks/useLanguageStore";
import { API } from "@/utils/api";
import { Box, Button, Container, Divider, Typography } from "@mui/material";
import { AxiosResponse } from "axios";
import parse from "html-react-parser";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const contentStyles = {
  "& h2": {
    fontSize: "1.4rem", 
    marginTop: "16px", 
    marginBottom: "4px", 
    lineHeight: 1.2,
  },
  "& p": {
    marginBlock: "4px",
    lineHeight: 1.5,
  },
};

export default function TermsPPPage() {
  const { t } = useTranslation();
  const api = useAPI();
  const navigate = useNavigate();
  const { id, token } = useParams();
  const selectedLanguage = useLanguageStore(state => state.selectedLanguage);
  const [terms, setTerms] = useState<string>("");
  const [pp, setPP] = useState<string>("");
  const [termsTranslations, setTermsTranslations] = useState<Record<string, any>>({});
  const [ppTranslations, setPPTranslations] = useState<Record<string, any>>({});

  // Fetch main Terms & PP data
  useEffect(() => {
    (async () => {
      try {
        const {
          data,
        }: AxiosResponse<{
          data: { terms: { id: string; name: string }; pp: { id: string; name: string } };
        }> = await api.get(`/assessment/${token}/termspp`);
        setTerms(data.data.terms.name);
        setPP(data.data.pp.name);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [token]);

  // Fetch all Terms translations on mount
  useEffect(() => {
    const fetchTermsTranslations = async () => {
      try {
        const response = await API.get(`/public/termspp/terms/language`);
        if (response.data?.data) {
          setTermsTranslations(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch terms translations:", error);
      }
    };

    fetchTermsTranslations();
  }, []);

  // Fetch all PP translations on mount
  useEffect(() => {
    const fetchPPTranslations = async () => {
      try {
        const response = await API.get(`/public/termspp/pp/language`);
        if (response.data?.data) {
          setPPTranslations(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch PP translations:", error);
      }
    };

    fetchPPTranslations();
  }, []);

  return (
    <Container
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        p: 2,
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <LanguageSelector />
      </Box>
      <Box
        sx={theme => ({ backgroundColor: theme.palette.primary.main, px: 2, borderRadius: "10px" })}
      >
        <Typography
          variant="h1"
          sx={theme => ({ color: theme.palette.primary.contrastText, py: 2 })}
        >
          {t('terms_pp')}
        </Typography>
      </Box>

      <Box sx={contentStyles}>
        {parse(termsTranslations[selectedLanguage]?.name || terms)}
      </Box>
      <Divider sx={{ my: 2, borderBottomWidth: '16px' }} />
      <Box sx={contentStyles}>
        {parse(ppTranslations[selectedLanguage]?.name || pp)}
      </Box>
      <Divider sx={{ mt: 2 }} />
      
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2, gap: 2, alignItems: "center" }}>
        <Typography sx={{ fontSize: "10pt" }}>
          {t('terms_pp_aggr')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            navigate(`/client/assessment/${token}/subtest/${id}/proctor`);
          }}
        >
          {t('next_button')}
        </Button>
      </Box>
    </Container>
  );
}
