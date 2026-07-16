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
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
  { value: 'great', label: 'Great', status: 'green' as const },
  { value: 'good', label: 'Good', status: 'green' as const },
  { value: 'fair', label: 'Fair', status: 'yellow' as const },
  { value: 'poor', label: 'Poor', status: 'red' as const },
] as const;

export const SURFACE_OPTIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'damp', label: 'Wet' },
  { value: 'muddy', label: 'Muddy' },
] as const;

export const HAZARD_OPTIONS = [
  { value: 'downed-trees', label: 'Downed Trees' },
  { value: 'broken-bridge', label: 'Broken bridge' },
  { value: 'slippery', label: 'Slippery' },
  { value: 'other', label: 'Other' },
] as const;
