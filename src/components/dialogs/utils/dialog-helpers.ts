import { ERROR_MESSAGES } from "@/constants/developer-portal";
import type { Member as DutyMember } from "@/hooks/useOnDutyData";
import { isValidEmail, isValidUrl } from "@/utils/developer-portal-helpers";

interface ValidationResult {
  isValid: boolean;
  errors: {
    fullName?: string;
    email?: string;
    role?: string;
    team?: string;
    avatar?: string;
  };
}

export const validateForm = (form: Partial<DutyMember>): ValidationResult => {
  const errors: ValidationResult['errors'] = {};
  
  // Required field validation
  if (!form.fullName?.trim()) {
    errors.fullName = ERROR_MESSAGES.FULL_NAME_REQUIRED;
  }
  
  if (!form.email?.trim()) {
    errors.email = ERROR_MESSAGES.EMAIL_REQUIRED;
  } else if (!isValidEmail(form.email)) {
    errors.email = ERROR_MESSAGES.EMAIL_INVALID;
  }
 
  
  // Optional but validated fields
  if (form.avatar && !isValidUrl(form.avatar)) {
    errors.avatar = ERROR_MESSAGES.AVATAR_INVALID;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
