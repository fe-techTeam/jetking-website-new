/**
 * Shared enquiry-form field definitions, used by every student-facing lead form and by the
 * `/api/enquiry` validator so the option list can never drift between them.
 */
export const QUALIFICATIONS = [
  { value: '10+2', label: '10+2' },
  { value: 'graduate', label: 'Graduate and above' },
] as const;

/** Tuple form for `z.enum`. */
export const QUALIFICATION_VALUES = ['10+2', 'graduate'] as const;
