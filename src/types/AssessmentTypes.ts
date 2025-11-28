import { DarwinStore } from "@/hooks/useAuthDarwinStore";

export type BatchMain = {
  token: string;
  id: string;
  batch_id: string;
  batch_name: string;
  batch_code: string;
  start_period: string;
  end_period: string;
  progress: {
    status: string;
    percentage: number;
  };
};

export type BatchHeadAs = BatchMain & {
  description: string;
  grouptest_id: string;
  is_camera: boolean;
  is_screenshot: boolean;
};

export type ResponseDataEmpDarwin = {
  status: string;
  message: string;
  token: string;
  employee_id: string;
  full_name: string;
  date_of_joining: string;
  group_company: string;
  contribution_level: string;
  work_area_code: string;
  office_area: string;
  designation_code: string;
  designation_name: string;
  job_level: string;
  company_email_id: string;
} & DarwinStore;

export type ResponseDataEmpExt = {
  user_id?: string;
  id?: string;
  name: string;
  email: string;
  age: string;
  gender: string;
  phone: string;
  education: string;
  institution: string;
  date_of_birth: string;
} & DarwinStore;
