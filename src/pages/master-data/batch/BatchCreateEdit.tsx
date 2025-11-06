import AddGroupTest from "@/components/batch/AddGroupTest";
import Assignment from "@/components/batch/Assignment";
import AssignmentTime from "@/components/batch/AssignmentTime";
import BatchOverview from "@/components/batch/BatchOverview";
import ChooseEmail from "@/components/batch/ChooseEmail";
import Settings from "@/components/batch/Settings";
import LanguageControls from "@/components/forms/LanguageControls";
import useAPI from "@/hooks/useAPI";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Tab, Tabs, styled } from "@mui/material";
import { Create } from "@refinedev/mui";
import { isAxiosError } from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import React, { useEffect, useState, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

interface BatchFormData {
  batch_name: string;
  batch_code: string;
  description:
    | string
    | Array<{
        language_id: string;
        description: string;
        language_type: "main" | "sub";
      }>; // Simplified to use array for both main and sub languages
  temp_description?: string; // For create mode RTE field
  grouptest_id: string;
  grouptest: any[];
  bu_id: string;
  bu_name: string;
  fm_id: string;
  fm_name: string;
  assign_for: string;
  assessees: any[];
  deleted_assessees: any[];
  excel_file: File | null;
  external_assessee_name: string;
  external_assessee_email: string;
  external_assessee: any[];
  external_assessees_file: File | null;
  start_date: Date | null;
  end_date: Date | null;
  start_time: Date | null;
  end_time: Date | null;
  email_template_id: string;
  role_id: string[];
  email_cc_input: string;
  email_cc: string[];
  email_detail: any[];
  is_mic: boolean;
  is_screenshot: boolean;
  deleted_roles: any[];
  deleted_emails: any[];
  language_id: string;
  language_type: string;
}

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  "& .MuiTabs-indicator": {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

export const StyledTab = styled(Tab)<{ completed?: boolean }>(({ theme, completed }) => ({
  textTransform: "none",
  fontSize: theme.typography.pxToRem(15),
  marginRight: theme.spacing(1),
  color: completed ? theme.palette.success.main : theme.palette.text.primary,
  "&.Mui-selected": {
    color: theme.palette.primary.main,
    fontWeight: "bold",
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`batch-tabpanel-${index}`}
      aria-labelledby={`batch-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const BatchCreateEdit: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const { showLoading, hideLoading } = useLoading();
  const API = useAPI();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [savedLanguages, setSavedLanguages] = useState<Set<string>>(new Set());
  const [isAutoUpdatingForm, setIsAutoUpdatingForm] = useState(false);
  const [isSwitchingLanguageType, setIsSwitchingLanguageType] = useState(false);
  const [translationState, setTranslationState] = useState<{
    exists: boolean | null;
    isChecking: boolean;
    isGenerating: boolean;
  }>({
    exists: null,
    isChecking: false,
    isGenerating: false,
  });

  const { data: languages } = useFetch<any>("/languages");
  const { data: languagesWithStatus } = useFetch<any>(
    isEdit && id ? `/batch/${id}/translation-status` : null
  );

  const methods = useForm<BatchFormData>({
    mode: "onChange",
    defaultValues: {
      batch_name: "",
      batch_code: "",
      description: isEdit ? "" : [], // Changed to array structure for simplicity
      temp_description: "", // For create mode RTE field
      grouptest_id: "",
      grouptest: [],
      bu_id: "",
      bu_name: "",
      fm_id: "",
      fm_name: "",
      assign_for: "",
      assessees: [],
      deleted_assessees: [],
      excel_file: null,
      external_assessee: [],
      external_assessees_file: null,
      external_assessee_name: "",
      external_assessee_email: "",
      start_date: null,
      end_date: null,
      start_time: null,
      end_time: null,
      email_template_id: "",
      role_id: [],
      email_cc_input: "",
      email_cc: [],
      email_detail: [],
      is_mic: false,
      is_screenshot: false,
      deleted_roles: [],
      deleted_emails: [],
      language_id: "id",
      language_type: "main",
    },
    context: { activeTab, completedSteps },
  });

  const languageType = methods.watch("language_type");
  const selectedLanguageId = methods.watch("language_id");

  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);
  const [initialCcEmails, setInitialCcEmails] = useState<string[]>([]);

  // Helper functions for handling description in create mode
  const getDescriptionValue = () => {
    const description = methods.watch("description");
    if (isEdit) {
      return description as string;
    } else {
      const descArray = description as Array<{
        language_id: string;
        description: string;
        language_type: "main" | "sub";
      }>;

      // Ensure the array structure exists
      if (!Array.isArray(descArray)) {
        return "";
      }

      const languageType = methods.getValues("language_type");
      const languageId = methods.getValues("language_id");

      if (languageType && languageId) {
        const langEntry = descArray.find(
          entry => entry.language_type === languageType && entry.language_id === languageId
        );
        return langEntry?.description || "";
      }
      return "";
    }
  };

  const setDescriptionValue = (value: string) => {
    if (isEdit) {
      methods.setValue("description", value);
    } else {
      let description = methods.getValues("description") as Array<{
        language_id: string;
        description: string;
        language_type: "main" | "sub";
      }>;

      // Initialize the array structure if it doesn't exist
      if (!Array.isArray(description)) {
        description = [];
      }

      const languageType = methods.getValues("language_type");
      const languageId = methods.getValues("language_id");

      if (languageType && languageId) {
        let existingIndex = 0;
        if (languageType == "main") {
          existingIndex = description.findIndex(entry => entry.language_type === languageType);
        } else {
          existingIndex = description.findIndex(
            entry => entry.language_type === languageType && entry.language_id === languageId
          );
        }

        if (existingIndex >= 0) {
          // Update existing entry
          description[existingIndex].description = value;
        } else {
          // Add new entry
          description.push({
            language_id: languageId,
            description: value,
            language_type: languageType as "main" | "sub",
          });
        }
      }

      methods.setValue("description", description);
    }
  };

  // Save current language data locally
  const saveCurrentLanguage = () => {
    const currentDescription = methods.getValues("temp_description");
    if (currentDescription) {
      const languageId = methods.watch("language_id");
      const languageType = methods.watch("language_type");

      // Prevent duplicate language entries (check if same language_id with different type already exists)
      if (languageType === "sub") {
        const currentDescArray = methods.getValues("description") as Array<{
          language_id: string;
          description: string;
          language_type: "main" | "sub";
        }>;
        console.log(currentDescArray);
        if (Array.isArray(currentDescArray)) {
          const mainLanguageEntry = currentDescArray.find(
            entry => entry.language_type === "main" && entry.language_id === languageId
          );
          if (mainLanguageEntry) {
            snack.error(
              "Cannot save main language as sub-language. Please select a different language."
            );
            return;
          }
        }
      }

      setDescriptionValue(currentDescription);
      const languageKey = `${languageType}-${languageId}`;
      setSavedLanguages(prev => new Set(prev).add(languageKey));

      snack.success(`${languageType === "main" ? "Main" : "Sub"} language saved locally!`);
    }
  };

  // Check if current language is saved
  const isCurrentLanguageSaved = useCallback(() => {
    const currentValues = methods.getValues();
    const languageId = currentValues.language_id;
    const languageType = currentValues.language_type;
    const languageKey = `${languageType}-${languageId}`;
    return savedLanguages.has(languageKey);
  }, [savedLanguages]);

  // Check if current language has content that can be saved
  const hasContentToSave = useCallback(() => {
    const tempDescription = methods.getValues("temp_description");
    const languageId = methods.getValues("language_id");

    // Has content to save if there's content and current language is not already saved
    return (
      tempDescription && tempDescription.trim() !== "" && languageId && !isCurrentLanguageSaved()
    );
  }, [isCurrentLanguageSaved, methods]);

  // Get the saved main language ID to filter it out from sub-language options
  const getSavedMainLanguageId = useCallback(() => {
    // For the new array structure, look in the description array for main language entry
    if (!isEdit) {
      const descriptionArray = methods.getValues("description") as Array<{
        language_id: string;
        description: string;
        language_type: "main" | "sub";
      }>;

      if (Array.isArray(descriptionArray)) {
        const mainEntry = descriptionArray.find(entry => entry.language_type === "main");
        return mainEntry?.language_id || null;
      }
    }

    // Fallback to checking savedLanguages for main language key
    for (const savedKey of savedLanguages) {
      if (savedKey.startsWith("main-")) {
        return savedKey.replace("main-", "");
      }
    }
    return null;
  }, [savedLanguages]);

  const {
    formState: { errors },
  } = methods;

  const tabs: Array<{
    label: string;
    Component: React.FC<any>;
    fields: (keyof BatchFormData)[];
  }> = [
    {
      label: "Batch Overview",
      Component: BatchOverview,
      fields: ["batch_name", "description"],
      // fields: [],
    },
    {
      label: "Add Group Test",
      Component: AddGroupTest,
      fields: ["grouptest_id"],
      // fields: [],
    },
    {
      label: "Assignment",
      Component: Assignment,
      fields: ["bu_id", "fm_id"],
      // fields: [],
    },
    {
      label: "Assignment Time",
      Component: AssignmentTime,
      fields: ["start_date", "end_date", "start_time", "end_time"],
      // fields: [],
    },
    {
      label: "Choose Email",
      Component: ChooseEmail,
      fields: ["email_template_id"],
    },
    {
      label: "Settings",
      Component: Settings,
      fields: [],
    },
  ];

  const isStepCompleted = (stepIndex: number) => {
    const stepFields = tabs[stepIndex].fields;
    // Jika tidak ada field yang divalidasi, anggap step selesai
    if (stepFields.length === 0) return true;

    return stepFields.every(field => {
      // Jika field adalah array (grouptest atau assessees)
      if (field === "grouptest" || field === "assessees") {
        return methods.watch(field)?.length > 0;
      }

      // Untuk field biasa, cek apakah ada value dan tidak ada error
      const value = methods.watch(field);
      return !!value && !errors[field];
    });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (completedSteps[newValue - 1] || newValue <= activeTab) {
      setActiveTab(newValue);
    }
  };

  const handleNext = () => {
    if (isStepCompleted(activeTab)) {
      setCompletedSteps({ ...completedSteps, [activeTab]: true });
      if (activeTab < tabs.length - 1) {
        setActiveTab(activeTab + 1);
      }
    }
  };

  const handleSave = () => {
    methods.handleSubmit(data => onSubmit(data, false))();
  };

  const handleSaveAndPublish = () => {
    methods.handleSubmit(data => onSubmit(data, true))();
  };

  const handleBack = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // TODO: Implement fetch and set data for edit

  useEffect(() => {
    const fetchAndSetData = async () => {
      if (id) {
        showLoading();
        try {
          const { data: batch } = await API.get(`/batch/${id}`);
          const { data: assessee } = await API.get(`/batch/${id}/assessee`);
          const uniqueRoleIds: string[] = [];
          const ccEmails: string[] = [];

          batch.data.cc_email.forEach((item: any) => {
            if (item.role_id) {
              if (!uniqueRoleIds.includes(item.role_id)) {
                uniqueRoleIds.push(item.role_id);
              }
            } else {
              ccEmails.push(item.cc_email);
            }
          });

          const fetchedAssessees = assessee.data.map((item: any) => ({
            ...item,
            fromDB: true,
          }));

          const previewRes = await API.get(`/batch/preview`);
          let previewTemplate = previewRes.data.template
            .replace("{{batch_name}}", batch.data.batch.batch_name)
            .replace("{{batch_code}}", batch.data.batch.batch_code)
            .replace("{{bu_name}}", batch.data.batch.bu_name)
            .replace("{{fm_name}}", batch.data.batch.fm_name)
            .replace(
              "{{start_period}}",
              batch.data.batch.start_period
                ? dayjs(batch.data.batch.start_period).format("DD MMMM YYYY HH:mm")
                : "-"
            )
            .replace(
              "{{end_period}}",
              batch.data.batch.end_period
                ? dayjs(batch.data.batch.end_period).format("DD MMMM YYYY HH:mm")
                : "-"
            )
            .replace("{{{subject}}}", batch.data.batch.email.subject)
            .replace("{{title}}", batch.data.batch.email.title)
            .replace("{{{header}}}", batch.data.batch.email.header)
            .replace("{{{footer}}}", batch.data.batch.email.footer);

          methods.reset({
            ...batch.data.batch,
            assign_for: batch.data.batch.type,
            fm_id: batch.data.batch.function_id,
            start_date: batch.data.batch.start_period ? dayjs(batch.data.batch.start_period) : null,
            end_date: batch.data.batch.end_period ? dayjs(batch.data.batch.end_period) : null,
            start_time: batch.data.batch.start_period ? dayjs(batch.data.batch.start_period) : null,
            end_time: batch.data.batch.end_period ? dayjs(batch.data.batch.end_period) : null,
            role_id: uniqueRoleIds,
            email_template_id: batch.data.batch.template_email_id,
            email_cc: ccEmails,
            [batch.data.batch.type === "internal" ? "assessees" : "external_assessee"]:
              fetchedAssessees,
            email_detail: {
              subject: batch.data.batch.email.subject,
              template: previewTemplate,
            },
            language_id: batch.data.batch.language_id || "id",
            language_type: "main", // Default to main for existing batches
          });

          setInitialRoleIds(uniqueRoleIds);
          setInitialCcEmails(ccEmails);
          // methods.setValue("assessees", fetchedAssessees);
        } catch (error) {
          if (isAxiosError(error)) {
            snack.error(error.response?.data?.message || "Failed to fetch batch data");
          } else {
            console.error("Error", error);
            snack.error("Failed to fetch batch data");
          }
        } finally {
          hideLoading();
        }
      }
    };
    fetchAndSetData();
  }, [id]);

  // Effect to reset translation state when language type changes
  useEffect(() => {
    setTranslationState({
      exists: null,
      isChecking: false,
      isGenerating: false,
    });
  }, [languageType, isEdit]);

  // Handle language type switching for edit mode
  useEffect(() => {
    if (isEdit && id && languageType && languagesWithStatus?.data) {
      setTranslationState(prev => ({
        ...prev,
        exists: null,
        isChecking: false,
      }));

      const handleLanguageTypeSwitch = async () => {
        try {
          setIsAutoUpdatingForm(true);
          setIsSwitchingLanguageType(true);

          if (languageType === "main") {
            // Find and set the main language ID
            if (languagesWithStatus?.data) {
              const mainLanguage = languagesWithStatus.data.find(
                (lang: any) => lang.translation_status === "main"
              );
              if (mainLanguage) {
                methods.setValue("language_id", mainLanguage.language_code, {
                  shouldDirty: false,
                  shouldTouch: false,
                });
              }
            }

            const { data: batch } = await API.get(`/batch/${id}`);
            methods.setValue("description", batch.data.batch.description || "");
            setTranslationState({ exists: null, isChecking: false, isGenerating: false });
          } else if (languageType === "sub") {
            if (languagesWithStatus?.data) {
              // Filter out main language to get available sub-languages
              const availableSubLanguages = languagesWithStatus.data.filter(
                (lang: any) => lang.translation_status !== "main"
              );

              if (availableSubLanguages.length > 0) {
                // Simply select the first available language for simplicity
                const targetLanguage = availableSubLanguages[0];

                methods.setValue("language_id", targetLanguage.language_code, {
                  shouldDirty: false,
                  shouldTouch: false,
                });

                // Load translation data and determine actual state
                let descriptionToSet = "";
                let actualTranslationExists = false;

                if (targetLanguage.translation_status === "translation_exists") {
                  const response = await API.get(
                    `/batch/${id}/language/${targetLanguage.language_code}`
                  );
                  const translationData = response.data.data;

                  if (translationData.has_translation) {
                    descriptionToSet = translationData.description || "";
                    actualTranslationExists = true;
                  }
                }

                // If no translation data was found, use main language data as fallback
                if (!descriptionToSet) {
                  const { data: batch } = await API.get(`/batch/${id}`);
                  descriptionToSet = batch.data.batch.description || "";
                }

                // Update state based on actual results
                setTranslationState(prev => ({
                  ...prev,
                  exists: actualTranslationExists,
                  isChecking: false,
                }));

                methods.setValue("description", descriptionToSet);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching language and translation:", error);
          setTranslationState(prev => ({
            ...prev,
            exists: null,
            isChecking: false,
          }));
        } finally {
          setIsAutoUpdatingForm(false);
          setIsSwitchingLanguageType(false);
        }
      };

      handleLanguageTypeSwitch();
    }
  }, [isEdit, id, languageType, languagesWithStatus?.data]);

  // Handle specific language selection for sub-language mode in edit mode
  useEffect(() => {
    if (
      isEdit &&
      languageType === "sub" &&
      selectedLanguageId &&
      !isSwitchingLanguageType &&
      !isAutoUpdatingForm
    ) {
      setTranslationState(prev => ({
        ...prev,
        isChecking: true,
      }));

      const fetchTranslationForSelectedLanguage = async () => {
        try {
          const response = await API.get(`/batch/${id}/language/${selectedLanguageId}`);
          const translationData = response.data.data;

          setTranslationState(prev => ({
            ...prev,
            exists: true,
            isChecking: false,
          }));

          methods.setValue("description", translationData.description || "");
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            // Translation doesn't exist - populate with main language data as default
            setTranslationState(prev => ({
              ...prev,
              exists: false,
              isChecking: false,
            }));

            // Pre-fill with main language data
            const { data: batch } = await API.get(`/batch/${id}`);
            methods.setValue("description", batch.data.batch.description || "");
          } else {
            console.error("Error fetching translation data:", error);
            setTranslationState(prev => ({
              ...prev,
              exists: null,
              isChecking: false,
            }));
          }
        }
      };

      fetchTranslationForSelectedLanguage();
    }
  }, [isEdit, languageType, selectedLanguageId, isSwitchingLanguageType, isAutoUpdatingForm]);

  // Handle create mode language switching
  useEffect(() => {
    if (!isEdit && !isAutoUpdatingForm) {
      const handleCreateModeLanguageChange = async () => {
        try {
          setIsAutoUpdatingForm(true);

          // Auto-select saved main language when switching to main language type
          if (languageType === "main" && !selectedLanguageId) {
            const savedMainLanguageId = getSavedMainLanguageId();
            if (savedMainLanguageId) {
              methods.setValue("language_id", savedMainLanguageId, {
                shouldDirty: false,
                shouldTouch: false,
              });
              // Don't continue execution - let the effect re-run with the new selectedLanguageId
              setIsAutoUpdatingForm(false);
              return;
            }
          }

          // Auto-select sub-language when switching to sub-language type
          if (languageType === "sub" && !selectedLanguageId && languages?.data) {
            // Get sub-languages (exclude main language if any is saved)
            const savedMainLanguageId = getSavedMainLanguageId();
            let availableSubLanguages = languages.data;

            if (savedMainLanguageId) {
              availableSubLanguages = languages.data.filter(
                (lang: any) => lang.language_code !== savedMainLanguageId
              );
            }

            let targetLanguageId = null;
            if (availableSubLanguages.length > 0) {
              targetLanguageId = availableSubLanguages[0].language_code;
            }

            if (targetLanguageId) {
              methods.setValue("language_id", targetLanguageId, {
                shouldDirty: false,
                shouldTouch: false,
              });
              // Don't continue execution - let the effect re-run with the new selectedLanguageId
              setIsAutoUpdatingForm(false);
              return;
            }
          }

          // Only load content if user has manually selected a language or auto-selection occurred
          if (selectedLanguageId && languageType) {
            const descriptionArray = methods.getValues("description") as Array<{
              language_id: string;
              description: string;
              language_type: "main" | "sub";
            }>;
            let savedContent = "";

            if (Array.isArray(descriptionArray)) {
              const langEntry = descriptionArray.find(
                entry =>
                  entry.language_type === languageType && entry.language_id === selectedLanguageId
              );

              if (langEntry?.description) {
                // Language entry exists - use it
                savedContent = langEntry.description;
              } else if (languageType === "sub") {
                // No sub-language translation - use main language content as fallback
                const mainEntry = descriptionArray.find(entry => entry.language_type === "main");
                if (mainEntry?.description) {
                  savedContent = mainEntry.description;
                }
              }
            }

            const currentTempDesc = methods.getValues("temp_description");
            if (currentTempDesc !== savedContent) {
              methods.setValue("temp_description", savedContent, {
                shouldDirty: false,
                shouldTouch: false,
              });
            }
          }
        } catch (error) {
          console.error("Create mode language change error:", error);
        } finally {
          setIsAutoUpdatingForm(false);
        }
      };

      handleCreateModeLanguageChange();
    }
  }, [
    isEdit,
    languageType,
    selectedLanguageId,
    isAutoUpdatingForm,
    languages?.data,
    savedLanguages,
  ]);

  // Clear language selection when language type changes (create mode only)
  useEffect(() => {
    if (!isEdit) {
      // Clear language selection and reset states for create mode
      methods.setValue("language_id", "id", { shouldDirty: false, shouldTouch: false });
      methods.setValue("temp_description", "", { shouldDirty: false, shouldTouch: false });
      setTranslationState({ exists: null, isChecking: false, isGenerating: false });

      // Reset the programmatically updating flag so auto-selection can run
      setIsAutoUpdatingForm(false);
    }
  }, [languageType, isEdit]);

  // Generate translation function
  const generateTranslation = async (fieldsToTranslate: string[]) => {
    if (!selectedLanguageId || !fieldsToTranslate.length) return;

    setTranslationState(prev => ({
      ...prev,
      isGenerating: true,
      // Ensure checking state is cleared while generating to avoid label flicker
      isChecking: false,
    }));

    try {
      if (isEdit && id) {
        // Edit mode - use the existing batch-specific endpoint
        const response = await API.post(`/batch/${id}/language/${selectedLanguageId}/generate`, {
          fields: fieldsToTranslate,
        });
        const translationData = response.data.data;

        // Populate form with generated translation data (only for requested fields)
        fieldsToTranslate.forEach(field => {
          if (translationData[field]) {
            if (field === "description") {
              methods.setValue("description", translationData[field]);
            }
          }
        });

        setTranslationState(prev => ({
          ...prev,
          exists: true,
          isGenerating: false,
        }));

        snack.success(`Translation generated successfully!`);
      } else {
        // Create mode - use the generic translation endpoint
        const mainLanguageId = getSavedMainLanguageId();
        if (!mainLanguageId) {
          snack.error("Please save the main language first before generating translations");
          return;
        }

        // Get the main language description from the saved data
        const descriptionArray = methods.getValues("description") as Array<{
          language_id: string;
          description: string;
          language_type: "main" | "sub";
        }>;
        let sourceContent = "";

        if (Array.isArray(descriptionArray)) {
          const mainEntry = descriptionArray.find(entry => entry.language_type === "main");
          sourceContent = mainEntry?.description || "";
        }

        if (!sourceContent.trim()) {
          snack.error("No content available in main language to translate");
          return;
        }

        // Prepare the fields object for translation
        const fieldsToTranslateObj: Record<string, string> = {};
        fieldsToTranslate.forEach(field => {
          if (field === "description") {
            fieldsToTranslateObj.description = sourceContent;
          }
        });

        // Use the generic translation endpoint
        const response = await API.post("/translation/translate", {
          fieldsToTranslate: fieldsToTranslateObj,
          sourceLanguage: mainLanguageId,
          targetLanguage: selectedLanguageId,
        });

        const translatedData = response.data.data;

        // Preview the generated translation in temp_description
        if (translatedData.description) {
          methods.setValue("temp_description", translatedData.description);

          // Also update the description structure for consistency
          setDescriptionValue(translatedData.description);
        }

        setTranslationState(prev => ({
          ...prev,
          exists: false, // Still not saved to database, just previewed
          isGenerating: false,
        }));

        snack.success(`Translation generated as preview! Save to confirm the changes.`);
      }
    } catch (error) {
      console.error("Error generating translation:", error);
      setTranslationState(prev => ({
        ...prev,
        isGenerating: false,
      }));

      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data?.message || "Failed to generate translation");
      } else {
        snack.error("Failed to generate translation");
      }
    }
  };

  // Get language options function
  const getLanguageOptions = useCallback(() => {
    let availableLanguages = [];

    if (isEdit && languagesWithStatus?.data) {
      availableLanguages = languagesWithStatus.data;
    } else {
      availableLanguages = languages?.data || [];
    }

    if (isEdit && languageType) {
      if (languageType === "sub") {
        // For sub-languages in edit mode, show languages with status information
        if (languagesWithStatus?.data) {
          // Show all languages except main, with their translation status
          availableLanguages = languagesWithStatus.data.filter(
            (lang: any) => lang.translation_status !== "main"
          );
        }
      } else if (languageType === "main") {
        // In edit mode, main language is fixed - only show the existing main language
        availableLanguages =
          languagesWithStatus?.data?.filter((lang: any) => lang.translation_status === "main") ||
          [];
      }
    }

    return availableLanguages;
  }, [isEdit, languageType, languages?.data, languagesWithStatus?.data]);

  // TODO: Implement onSubmit edit

  const onSubmit = async (data: BatchFormData, publish: boolean) => {
    showLoading();
    try {
      let assesseesPayload: any;

      if (!id) {
        // Create mode: kirim array biasa
        const selected_assessees =
          data.assign_for === "internal" ? data.assessees : data.external_assessee;
        assesseesPayload = selected_assessees.map(a => ({
          assessee_nik: a.assessee_nik,
          assessee_name: a.assessee_name,
          assessee_email: a.assessee_email,
        }));
      } else {
        // Edit mode: kirim object dengan deleted & selected
        const deleted_assessees = Array.isArray(data.deleted_assessees)
          ? data.deleted_assessees.map(item => ({ id: item.id }))
          : [];
        const selected_assessees = (
          data.assign_for === "internal" ? data.assessees : data.external_assessee
        )
          .filter(a => !a.fromDB)
          .map(a => ({
            assessee_nik: a.assessee_nik,
            assessee_name: a.assessee_name,
            assessee_email: a.assessee_email,
          }));
        assesseesPayload = { deleted_assessees, selected_assessees };
      }

      let ccPayload: any;
      if (!id) {
        ccPayload = {
          roles: data.role_id.map(role_id => ({ role_id })),
          emails: data.email_cc.map(cc_email => ({ cc_email })),
        };
      } else {
        const deleted_roles = initialRoleIds
          .filter(r => !data.role_id.includes(r))
          .map(role_id => ({ role_id }));
        const selected_roles = data.role_id
          .filter(r => !initialRoleIds.includes(r))
          .map(role_id => ({ role_id }));

        const deleted_emails = initialCcEmails
          .filter(e => !data.email_cc.includes(e))
          .map(cc_email => ({ cc_email }));
        const selected_emails = data.email_cc
          .filter(e => !initialCcEmails.includes(e))
          .map(cc_email => ({ cc_email }));

        ccPayload = {
          roles: { deleted_roles, selected_roles },
          emails: { deleted_emails, selected_emails },
        };
      }

      const payloadBatch = {
        batch_name: data.batch_name,
        batch_code: data.batch_code,
        description: id ? data.description : data.description, // Keep original structure - backend will handle it
        grouptest_id: data.grouptest_id,
        type: data.assign_for,
        bu_id: data.bu_id,
        function_id: data.fm_id,
        template_email_id: data.email_template_id,
        is_mic: data.is_mic,
        is_screenshot: data.is_screenshot,
        cc_email: ccPayload,
        assessees: assesseesPayload,
        language_type: data.language_type,
        language_id: data.language_id,
        start_period:
          data.start_date && data.start_time
            ? dayjs(data.start_date)
                .hour(dayjs(data.start_time).hour())
                .minute(dayjs(data.start_time).minute())
                .second(0)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss z")
            : null,
        end_period:
          data.end_date && data.end_time
            ? dayjs(data.end_date)
                .hour(dayjs(data.end_time).hour())
                .minute(dayjs(data.end_time).minute())
                .second(0)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss z")
            : null,
      };

      if (id) {
        // Update existing batch (handles both main language and sub-language translations)
        await API.patch(`/batch/${id}`, payloadBatch);

        // Hanya publish jika parameter publish = true
        if (publish) {
          await API.post(`/batch/${id}/published`);
        }

        const successMessage =
          data.language_type === "sub"
            ? "Batch translation saved successfully"
            : "Batch updated successfully";
        snack.success(successMessage);
        navigate(-1);
        return;
      }

      // Jika mode create
      const { data: res_batch } = await API.post("/batch", payloadBatch);
      const batch_id = res_batch.data.batch_id;
      // Tambah semua assessee
      // if (payloadAssessee.length > 0) {
      //   await API.post(`/batch/${batch_id}/assessee`, payloadAssessee);
      // }

      // Hanya publish jika parameter publish = true
      if (publish) {
        await API.post(`/batch/${batch_id}/published`);
      }

      snack.success("Batch created successfully");
      navigate(-1);
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Failed to create or update batch");
      } else {
        console.error("Error", error);
        snack.error("Failed to create or update batch");
      }
    } finally {
      hideLoading();
    }
  };

  const isNextDisabled = !isStepCompleted(activeTab);

  return (
    <FormProvider {...methods}>
      <Create
        title={
          <Box sx={{ width: "100%" }}>
            <StyledTabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="batch creation tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab, index) => (
                <StyledTab
                  key={index}
                  label={tab.label}
                  id={`batch-tab-${index}`}
                  aria-controls={`batch-tabpanel-${index}`}
                  completed={completedSteps[index]}
                />
              ))}
            </StyledTabs>
          </Box>
        }
        footerButtons={
          <Stack direction="row" justifyContent="space-between" width="100%">
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBack />}
              disabled={activeTab === 0}
            >
              Back
            </Button>
            {activeTab < tabs.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={isNextDisabled}
              >
                Next
              </Button>
            ) : (
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" color="success" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="contained" color="success" onClick={handleSaveAndPublish}>
                  Save & Publish
                </Button>
              </Stack>
            )}
          </Stack>
        }
        goBack={<IconButton children={<ArrowBack />} onClick={() => navigate(-1)} />}
      >
        {(!isEdit || languageType !== "sub" || languages?.data) && (
          <>
            <TabPanel value={activeTab} index={0}>
              {/* Language Controls and Save Button Container */}

              <Box sx={{ display: "flex", gap: 2, mb: 2, px: 6, flexWrap: "wrap" }}>
                {/* Language Controls - inline without padding */}
                <Box>
                  <LanguageControls
                    isEdit={isEdit}
                    languagesWithStatus={languagesWithStatus}
                    languages={languages}
                    methods={methods}
                    getLanguageOptions={getLanguageOptions}
                    generateTranslation={generateTranslation}
                    translationState={translationState}
                    selectedLanguageId={selectedLanguageId}
                    languageType={languageType}
                    fieldsToTranslate={["description"]}
                    containerSx={{
                      px: 0, // Remove padding since we're handling it in parent
                      mb: 0, // Remove margin since we're handling spacing in parent
                    }}
                  />
                </Box>

                {/* Batch-specific Save Button for Create Mode - aligned horizontally */}
                {!isEdit && selectedLanguageId && (
                  <Box sx={{ mb: 2 }}>
                    {" "}
                    {/* Match the mb: 2 from LanguageControls inner container */}
                    <Button
                      variant="outlined"
                      color={hasContentToSave() ? "warning" : "success"}
                      onClick={saveCurrentLanguage}
                      disabled={!selectedLanguageId}
                      sx={{
                        px: 3,
                        py: 1.5,
                        minWidth: 120,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(() => {
                        if (hasContentToSave()) {
                          return "Save";
                        } else if (isCurrentLanguageSaved?.()) {
                          return "Saved ✓";
                        } else {
                          return "Save";
                        }
                      })()}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ px: 6 }}>
                <BatchOverview
                  control={methods.control}
                  isEdit={isEdit}
                  getDescriptionValue={getDescriptionValue}
                  setDescriptionValue={setDescriptionValue}
                />
              </Box>
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <AddGroupTest control={methods.control} batchData={methods.getValues()} />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <Assignment control={methods.control} />
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              <AssignmentTime control={methods.control} />
            </TabPanel>
            <TabPanel value={activeTab} index={4}>
              <ChooseEmail
                control={methods.control}
                batchData={methods.getValues()}
                initialCcEmails={initialCcEmails}
                initialRoleIds={initialRoleIds}
              />
            </TabPanel>
            <TabPanel value={activeTab} index={5}>
              <Settings control={methods.control} />
            </TabPanel>
          </>
        )}
      </Create>
    </FormProvider>
  );
};
export default BatchCreateEdit;
