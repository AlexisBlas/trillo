import { z } from 'zod';

// Report form schema
export const reportSchema = z.object({
  status: z.enum(['green', 'yellow', 'red'], {
    required_error: 'Please select a trail status',
  }),
  conditions: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type ReportFormData = z.infer<typeof reportSchema>;

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// Condition options
export const CONDITION_OPTIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'damp', label: 'Damp' },
  { value: 'muddy', label: 'Muddy' },
  { value: 'downed-trees', label: 'Downed Trees' },
  { value: 'slippery', label: 'Slippery' },
  { value: 'other', label: 'Other' },
] as const;

// Report screen taxonomy
export const OVERALL_OPTIONS = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

export type OverallRating = (typeof OVERALL_OPTIONS)[number]['value'];

/** The surface sets the report's status color; the overall rating is shown as text. */
export const SURFACE_OPTIONS = [
  { value: 'dry', label: 'Dry', status: 'green' as const },
  { value: 'damp', label: 'Wet', status: 'yellow' as const },
  { value: 'muddy', label: 'Muddy', status: 'red' as const },
] as const;

/** Overall rating stored on a report's condition tags, if any. */
export function getOverallRating(
  conditions: string[] | null | undefined
): OverallRating | null {
  const match = conditions?.find((c) => OVERALL_OPTIONS.some((o) => o.value === c));
  return (match as OverallRating | undefined) ?? null;
}

export const HAZARD_OPTIONS = [
  { value: 'downed-trees', label: 'Downed Trees' },
  { value: 'broken-bridge', label: 'Broken bridge' },
  { value: 'maintenance', label: 'Needs maintenance' },
  { value: 'slippery', label: 'Slippery' },
  { value: 'other', label: 'Other' },
] as const;
