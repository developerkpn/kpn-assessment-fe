import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Create } from "@refinedev/mui";
import React, { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FaEdit, FaQuestionCircle, FaRegCheckSquare } from "react-icons/fa";
import { LuImageUp, LuPlus, LuTrash2 } from "react-icons/lu";
import CustomSwitch from "../CustomSwitch";
import PointField from "../forms/PointField";
import AnswerImageUpload from "./AnswerImageUpload";
import useFetch from "@/hooks/useFetch";

type QuestionFormDataType = {
  question: string;
  category_id: string;
  answers: Array<{
    text: string;
    point: number;
    images?: File | undefined;
  }>;
  questionImage?: File | undefined;
};

type CreateQuestionFormProps = {
  onSubmit: (data: QuestionFormDataType) => void;
  id?: string;
};

const CreateQuestionForm: React.FC<CreateQuestionFormProps> = ({
  onSubmit,
  id,
}) => {
  const { control, register, handleSubmit, setValue } = useForm({
    defaultValues: {
      question: "",
      answer_type: "",
      category_id: "",
      answers: [
        { text: "", point: 0, image: undefined as File | undefined },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });
  const { data: categories } = useFetch<any>("/category/active");
  const [questionType, setQuestionType] = useState("multiple-choice");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnswerWithImage, setIsAsnwerWithImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // console.log("Selected Files", selectedFiles);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setPreviewImage(null);
  };

  const handleAddAnswer = () => {
    if (fields.length < 5) {
      append({ text: "", point: 0, image: undefined });
    }
  };
  const addAnswerImage = (index: number, image: File) => {
    setValue(`answers.${index}.image`, image);
    console.log("Image added", image);
  };
  const onSelectImageAnswer = (
    event: React.ChangeEvent<HTMLInputElement>,
    maxFiles: number
  ) => {
    const files = event.target.files;
    if (files) {
      const imagesArray: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          if (readerEvent.target?.result) {
            imagesArray.push(readerEvent.target.result as string);

            if (imagesArray.length === files.length) {
              setSelectedFiles((prev) => {
                // Cegah lebih dari maxFiles
                if (prev.length + imagesArray.length > maxFiles) {
                  const availableSlots = maxFiles - prev.length;
                  return [...prev, ...imagesArray.slice(0, availableSlots)];
                }
                return [...prev, ...imagesArray];
              });
            }
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const handleFormSubmit = (data: QuestionFormDataType) => {
    const formData = {
      ...data,
      questionImage: previewImage
        ? imageInputRef.current?.files?.[0]
        : undefined,
      answers: data.answers.map((answer, index) => {
        if (isAnswerWithImage) {
          return {
            text: "",
            images: selectedFilesRef.current?.files?.[index],
            point: answer.point,
          };
        } else {
          return {
            text: answer.text,
            point: answer.point,
          };
        }
      }),
    };
    console.log("Form data ", formData);
    onSubmit(formData);
  };

  return (
    <form id={id} onSubmit={handleSubmit(handleFormSubmit)}>
      <Create  
        title={
          <Box display="flex" alignItems="center" gap="8px">
            <Typography fontWeight="600">Question Type:</Typography>
            <Select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              size="small"
              sx={{
                backgroundColor: "white",
                "& .MuiSelect-select": {
                  padding: "0",
                },
              }}
            >
              <MenuItem value="multiple-choice" sx={{ padding: "4px" }}>
                <ListItem
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                  }}
                >
                  <ListItemIcon
                    children={<FaRegCheckSquare />}
                    sx={{ minWidth: "8px", mr: "6px" }}
                  />
                  <ListItemText primary="Multiple Choice" />
                </ListItem>
              </MenuItem>
              <MenuItem value="short-answer" sx={{ padding: "4px" }}>
                <ListItem
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                  }}
                >
                  <ListItemIcon
                    children={<FaEdit />}
                    sx={{ minWidth: "8px", mr: "6px" }}
                  />
                  <ListItemText primary="Short Answer" />
                </ListItem>
              </MenuItem>
              <MenuItem value="true-false" sx={{ padding: "4px" }}>
                <ListItem
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 4px",
                  }}
                >
                  <ListItemIcon
                    children={<FaQuestionCircle />}
                    sx={{
                      minWidth: "8px",
                      border: "1px solid blue",
                      mr: "6px",
                    }}
                  />
                  <ListItemText primary="True/False" />
                </ListItem>
              </MenuItem>
            </Select>
            <Typography fontWeight="600">Category:</Typography>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  size="small"
                  sx={{
                    backgroundColor: "white",
                    "& .MuiSelect-select": {
                      padding: "0",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "white",
                      color: "text.primary",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(0, 0, 0, 0.23)",
                      },
                    },
                  }}
                >
                  {categories?.data?.map((category: any) => (
                    <MenuItem
                      key={category.id}
                      value={category.id}
                      sx={{ padding: "4px" }}
                    >
                      <ListItem
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0 8px",
                        }}
                      >
                        <ListItemText
                          primary={category.category_name || "Select Category"}
                        />
                      </ListItem>
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </Box>
        }
        headerProps={{ sx: { backgroundColor: "#E5E7EB" } }}
        goBack
        footerButtons
        headerButtons
      >
        <Box>
          <Typography>Question</Typography>
          <TextField
            {...register("question")}
            variant="filled"
            size="small"
            fullWidth
            multiline
            rows={4}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{ position: "absolute", right: 8, top: 8 }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                  />

                  <IconButton
                    size="small"
                    onClick={() => imageInputRef.current?.click()}
                    sx={{ bgcolor: "white", borderRadius: "8px" }}
                  >
                    <LuImageUp size={20} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {previewImage && (
            <Paper
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "#F0F9FF",
                borderRadius: "12px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "200px",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "white",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: "white",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <LuImageUp size={20} />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: "white",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    onClick={handleDeleteImage}
                  >
                    <LuTrash2 size={20} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mt: 2 }}>
          <Typography>
            Answer<span style={{ color: "red" }}> *</span>
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography>Answer with image</Typography>
          <CustomSwitch onChange={(checked) => setIsAsnwerWithImage(checked)} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {fields.map((field, index) =>
            !isAnswerWithImage ? (
              <Box
                key={field.id}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TextField
                  {...register(`answers.${index}.text`)}
                  variant="outlined"
                  size="small"
                  label={`Answer ${index + 1}`}
                  sx={{ flexGrow: 1 }}
                />
                <PointField name={`answers.${index}.point`} control={control} />
                {fields.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => remove(index)}
                    sx={{
                      color: "error.main",
                      "&:hover": { backgroundColor: "error.lighter" },
                    }}
                  >
                    <LuTrash2 size={20} />
                  </IconButton>
                )}
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <AnswerImageUpload
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  selectFileRef={selectedFilesRef}
                  onSelectImage={(e) => onSelectImageAnswer(e, 5)}
                  maxFiles={5}
                  control={control}
                  name={`answers.${index}.images`}
                  passFile={(file) => addAnswerImage(index, file)}
                />
              </Box>
            )
          )}

          {fields.length < 5 && (
            <Button
              startIcon={<LuPlus />}
              onClick={handleAddAnswer}
              variant="outlined"
              size="small"
              sx={{ alignSelf: "flex-start", mt: 1 }}
            >
              Add Answer
            </Button>
          )}

          {fields.length >= 5 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Maximum number of answers reached (5)
            </Typography>
          )}
        </Box>
      </Create>
    </form>
  );
};
export default CreateQuestionForm;
