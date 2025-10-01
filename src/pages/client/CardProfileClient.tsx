import DatePickerCtrl from "@/components/forms/DatePicker";
import SelectCtrl from "@/components/forms/Select";
import TextFieldCtrl from "@/components/forms/TextField";
import useAPI from "@/hooks/useAPIExt";
import useAuthDarwinStore from "@/hooks/useAuthDarwinStore";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import useTokenAssessee from "@/hooks/useTokenAssessee";
import { snack } from "@/providers/SnackbarProvider";
import { ResponseDataEmpExt } from "@/types/AssessmentTypes";
import { Avatar, Box, Button, Card, MenuItem, Skeleton } from "@mui/material";
import { AxiosResponse, isAxiosError } from "axios";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import SettingsToolbar, { SettingsToolbarRef } from "./SettingsToolbar";
import FaceCaptureModal from "@/components/client/FaceCaptureModal";

const Gender = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export default function CardProfileClient() {
  const api = useAPI();
  const darwin_sess = useAuthDarwinStore(state => state.darwin_sess);
  const type = useTokenAssessee(state => state.type);
  const id = darwin_sess?.employee_id;
  const data_ext = useAuthExternStore(state => state.ext_sess);
  const setExternStore = useAuthExternStore(state => state.setExternStore);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showFaceCaptureModal, setShowFaceCaptureModal] = useState(false);
  const [isCheckingPhoto, setIsCheckingPhoto] = useState(true);
  const {
    control,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      date_of_birth: "",
      date_of_birth_1: dayjs(),
      institution: "",
      education: "",
      phone: "",
      date_join: "",
      comp_payroll: "",
      role_name: "",
      email: "",
      degree: "",
      gender: "",
    },
  });
  const settingsRef = useRef<SettingsToolbarRef | null>(null);
  const [edit_mode, setEditMode] = useState(false);
  const data_emp = useAuthDarwinStore(state => state.darwin_sess);

  const userId = useMemo(() => {
    if (data_emp && data_emp.employee_id) {
      return data_emp.employee_id;
    } else if (data_ext && data_ext.id) {
      return data_ext.id;
    }
    return "";
  }, [data_emp, data_ext]);

  const checkAndLoadProfilePhoto = async () => {
    if (!userId) return;

    try {
      // Try to access the photo - if it exists, set the URL
      await api.get(`/assessee/profile-photo/${userId}`);
      const photoUrl = `${api.defaults.baseURL}/assessee/profile-photo/${userId}`;
      setProfilePhotoUrl(photoUrl);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Photo doesn't exist, show capture modal
        setShowFaceCaptureModal(true);
        setProfilePhotoUrl(null);
      } else {
        console.error("Error loading profile photo:", error);
        setProfilePhotoUrl(null);
      }
    } finally {
      setIsCheckingPhoto(false);
    }
  };

  const handlePhotoCapture = async (photoFile: File) => {
    try {
      const formData = new FormData();
      formData.append("profile_photo", photoFile);
      formData.append("user_id", userId);

      await api.post("/assessee/upload-profile-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      snack.success("Profile photo captured successfully!");
      setShowFaceCaptureModal(false);

      const photoUrl = `${api.defaults.baseURL}/assessee/profile-photo/${userId}`;
      setProfilePhotoUrl(photoUrl);
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      snack.error("Failed to upload profile photo. Please try again.");
      throw error;
    }
  };
  useEffect(() => {
    console.log("data_emp", data_emp);
    console.log("data_ext", data_ext);
    if (data_emp) {
      reset({
        date_of_birth: data_emp?.date_of_birth,
        institution: data_emp?.education_details.slice(-1)[0].institution_name,
        phone: data_emp?.personal_mobile_no,
        comp_payroll: data_emp?.contribution_level,
        role_name: data_emp?.designation_name,
        email: data_emp?.company_email_id,
        degree: data_emp?.education_details.slice(-1)[0].education_category,
        education: data_emp?.education_details.slice(-1)[0].field_of_study,
      });
    } else if (data_ext) {
      reset({
        date_of_birth: data_ext?.date_of_birth,
        date_of_birth_1: dayjs(data_ext?.date_of_birth),
        institution: data_ext?.institution,
        education: data_ext?.education,
        phone: data_ext?.phone,
        email: data_ext?.email,
        gender: data_ext?.gender,
      });
    }
  }, [data_emp, data_ext]);

  useEffect(() => {
    if (userId && isCheckingPhoto) {
      checkAndLoadProfilePhoto();
    }
  }, [userId, isCheckingPhoto]);

  const onSubmit = async (values: {
    date_of_birth_1: Dayjs | null;
    institution: string;
    phone: string;
    email: string;
    gender: string;
    education: string;
  }) => {
    console.log(values);
    let payload = {
      name: data_ext?.name,
      date_of_birth: values.date_of_birth_1?.format("YYYY-MM-DD"),
      phone: values.phone,
      institution: values.institution,
      gender: values.gender,
      education: values.education,
    };
    try {
      const { data } = await api.patch("/assessee/profile", payload);
      snack.success("Profile Updated");
      const { data: user_profile }: AxiosResponse<{ message: string; data: ResponseDataEmpExt }> =
        await api.get("/assessee/profile");
      setExternStore(user_profile.data);
      setEditMode(false);
    } catch (error) {
      console.error(error);
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      } else {
        snack.error((error as Error).message);
      }
    }
  };
  return (
    <Card
      sx={theme => ({
        borderRadius: "30px",
        [theme.breakpoints.up("sm")]: {
          width: "30rem",
        },
        [theme.breakpoints.down("sm")]: {
          width: "80%",
        },
      })}
      variant="outlined"
    >
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
          p: 4,
          height: "100%",
        })}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <SettingsToolbar ref={settingsRef} setEditMode={setEditMode} />
        </Box>
        {edit_mode && (
          <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                setEditMode(false);
              }}
            >
              Cancel
            </Button>
            <Button
              color="secondary"
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
            >
              Save
            </Button>
          </Box>
        )}
        <Avatar
          src={profilePhotoUrl || undefined}
          sx={theme => ({
            [theme.breakpoints.down("sm")]: {
              width: 50,
              height: 50,
            },
            width: 100,
            height: 100,
          })}
        >
        </Avatar>
        {data_emp && !data_ext && (
          <>
            {data_emp ? (
              <h3 style={{ margin: "0 0 0 0" }}>{data_emp.full_name}</h3>
            ) : (
              <Skeleton variant="text" sx={{ fontSize: "14pt", maxWidth: "15rem" }} />
            )}
            {data_emp ? (
              <p>({id})</p>
            ) : (
              <Skeleton variant="text" sx={{ fontSize: "14pt", maxWidth: "12rem" }} />
            )}
          </>
        )}
        {!data_emp && data_ext && (
          <>
            {data_ext ? (
              <h3 style={{ margin: "0 0 0 0" }}>{data_ext.name}</h3>
            ) : (
              <Skeleton variant="text" sx={{ fontSize: "14pt", maxWidth: "15rem" }} />
            )}
          </>
        )}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, width: "100%" }}>
          <TextFieldCtrl
            noMargin
            readOnly
            control={control}
            name="email"
            label="Email"
            size="small"
            sx={{ width: "20rem" }}
          />
          {!data_emp && data_ext && (
            <SelectCtrl
              control={control}
              name="gender"
              label="Gender"
              size="small"
              sx={{ width: "20rem" }}
              readOnly={!edit_mode}
            >
              {Gender.map(value => (
                <MenuItem key={value.value} value={value.value}>
                  {value.label}
                </MenuItem>
              ))}
            </SelectCtrl>
          )}
          {!edit_mode && data_ext && (
            <TextFieldCtrl
              noMargin
              readOnly
              control={control}
              name="date_of_birth"
              label="Date of Birth"
              size="small"
              sx={{ width: "20rem" }}
            />
          )}
          {edit_mode && !data_emp && data_ext && (
            <DatePickerCtrl
              control={control}
              name="date_of_birth_1"
              label="Date of Birth"
              size="small"
              sx={{ width: "14rem" }}
              format="YYYY-MM-DD"
              rules={{ required: "Please insert this field" }}
            />
          )}
          {data_emp && !data_ext && (
            <TextFieldCtrl
              noMargin
              readOnly
              control={control}
              name="comp_payroll"
              label="Business Unit"
              size="small"
              multiline={true}
              sx={{ width: "auto", minWidth: "20rem" }}
            />
          )}

          {data_emp && !data_ext && (
            <TextFieldCtrl
              readOnly
              control={control}
              name="role_name"
              label="Role"
              size="small"
              multiline={true}
              sx={{ width: "auto", minWidth: "20rem" }}
            />
          )}
          <TextFieldCtrl
            noMargin
            readOnly={!edit_mode && !data_ext}
            control={control}
            name="education"
            label="Education"
            size="small"
            multiline={true}
            sx={{ width: "auto", minWidth: "20rem" }}
          />
          <TextFieldCtrl
            noMargin
            readOnly={!edit_mode && !data_ext}
            control={control}
            name="institution"
            label="Institution"
            size="small"
            multiline={true}
            sx={{ width: "auto", minWidth: "20rem" }}
          />
          {data_emp && !data_ext && (
            <TextFieldCtrl
              readOnly
              control={control}
              name="degree"
              label="Degree"
              size="small"
              sx={{ width: "20rem" }}
            />
          )}
        </Box>
      </Box>

      <FaceCaptureModal
        open={showFaceCaptureModal}
        onPhotoCapture={handlePhotoCapture}
        userId={userId}
      />
    </Card>
  );
}
