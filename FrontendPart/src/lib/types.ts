export interface CitizenProfile {
  // Step 1
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'married' | 'widowed' | 'divorced';
  state: string;
  preferred_language: string;

  // Step 2
  income: number;
  occupation: 'farmer' | 'daily_wage' | 'self_employed' | 'student' | 'unemployed' | 'other';
  caste: 'general' | 'obc' | 'sc' | 'st' | 'ews';
  ration_card_type: 'none' | 'bpl' | 'aay' | 'apl' | null;
  has_bank_account: boolean;
  has_disability: boolean;

  // Step 3
  family_size: number;
  land_acres: number;

  // Disability conditional
  disability_type?: string;
  disability_percentage?: string;
  disability_certificate?: boolean;

  // Gender/marital conditional
  has_children?: boolean;
  youngest_child_age?: number;

  // Farmer fields
  land_ownership?: string;
  crop_type?: string;
  irrigation_type?: string;
  kisan_credit_card?: boolean;
  soil_health_card?: boolean;

  // Student fields
  education_level?: string;
  institution_type?: string;
  course_type?: string;
  previous_scholarship?: boolean;
  hosteller?: string;

  // Daily wage fields
  work_type?: string;
  eshram_registered?: boolean;
  has_epfo?: boolean;

  // Self employed fields
  business_type?: string;
  existing_mudra_loan?: boolean;
  udyam_registered?: boolean;

  // Unemployed fields
  job_seeker_registered?: boolean;
  seeking_skill_training?: boolean;
}

export interface SchemeRecord {
  id: string;
  scheme_id: string;
  name: string;
  name_hi?: string;
  name_mr?: string;
  ministry: string;
  ministry_logo_url?: string;
  category: SchemeCategory;
  benefit_amount?: number;
  benefit_frequency?: 'one_time' | 'monthly' | 'quarterly' | 'annual';
  benefit_description: string;
  eligibility_criteria: EligibilityCriterion[];
  documents_required: string[];
  application_url: string;
  portal_url?: string;
  last_updated: string;
  beneficiary_count?: number;
  is_central: boolean;
  state?: string;
  warning_tag?: string;
}

export type SchemeCategory =
  'agriculture' | 'education' | 'health' | 'housing' |
  'employment' | 'women' | 'disability' | 'senior' | 'other';

export interface EligibilityCriterion {
  criterion: string;
  met: boolean | null;
  explanation?: string;
}

export interface DocumentRecord {
  type: 'aadhaar' | 'pan' | 'ration_card' | 'land_record' | 'income_cert' | 'caste_cert' | 'bank_passbook' | 'other';
  uploaded: boolean;
  verified: boolean;
  file_url?: string;
  extracted_data?: Record<string, string>;
}

export interface AgentStep {
  step: number;
  agent_name: string;
  status: 'idle' | 'queued' | 'running' | 'complete' | 'error';
  message: string;
  logs: string[];
  started_at?: string;
  completed_at?: string;
  result_summary?: string;
}

export interface SSEEvent {
  agent: string;
  step: number;
  status: AgentStep['status'];
  message: string;
  timestamp: string;
}
