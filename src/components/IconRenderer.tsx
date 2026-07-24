import { HelpOutlineOutlined } from "@mui/icons-material";
import { lazy, useMemo, Suspense } from "react";

const importLazy = (icon: string) => {
  switch (icon) {
    case "Menu":
      return lazy(() => import("@mui/icons-material/Menu"));
    case "AttachEmail":
      return lazy(() => import("@mui/icons-material/AttachEmail"));
    case "Summarize":
      return lazy(() => import("@mui/icons-material/Summarize"));
    case "FormatListBulleted":
      return lazy(() => import("@mui/icons-material/FormatListBulleted"));
    case "Assignment":
      return lazy(() => import("@mui/icons-material/Assignment"));
    case "Checklist":
      return lazy(() => import("@mui/icons-material/Checklist"));
    case "Quiz":
      return lazy(() => import("@mui/icons-material/Quiz"));
    case "Category":
      return lazy(() => import("@mui/icons-material/Category"));
    case "Business":
      return lazy(() => import("@mui/icons-material/Business"));
    case "Policy":
      return lazy(() => import("@mui/icons-material/Policy"));
    case "Subject":
      return lazy(() => import("@mui/icons-material/Subject"));
    case "SportsScore":
      return lazy(() => import("@mui/icons-material/SportsScore"));
    case "QuestionAnswer":
      return lazy(() => import("@mui/icons-material/QuestionAnswer"));
    case "FormatListNumbered":
      return lazy(() => import("@mui/icons-material/FormatListNumbered"));
    case "List":
      return lazy(() => import("@mui/icons-material/List"));
    case "SupervisedUserCircle":
      return lazy(() => import("@mui/icons-material/SupervisedUserCircle"));
    case "Subtitles":
      return lazy(() => import("@mui/icons-material/Subtitles"));
    case "Language":
      return lazy(() => import("@mui/icons-material/Language"));
    case "Link":
      return lazy(() => import("@mui/icons-material/Link"));
    default:
      return HelpOutlineOutlined;
  }
};

export default function IconRenderer({ icon }: { icon: string }) {
  const Icon = useMemo(() => importLazy(icon), [icon]);

  return (
    <Suspense fallback={<HelpOutlineOutlined />}>
      <Icon />
    </Suspense>
  );
}
