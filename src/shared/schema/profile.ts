import { z } from 'zod';
import { idSchema, baseEntitySchema } from './common';
import { uuidv4 } from '@/shared/util/id';

export const locationSchema = z.object({
  address: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zip: z.string().optional(),
});

export const workExperienceSchema = z.object({
  id: idSchema,
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
});

export const educationSchema = z.object({
  id: idSchema,
  school: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});

export const certificationSchema = z.object({
  id: idSchema,
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

export const languageSchema = z.object({
  id: idSchema,
  name: z.string(),
  proficiency: z.string().optional(),
});

export const projectSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
});

export const profileSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  isDefault: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  location: locationSchema,
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  workAuthorization: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  noticePeriodDays: z.number().int().nonnegative().optional(),
  currentCtcAnnual: z.number().nonnegative().optional(),
  expectedCtcAnnual: z.number().nonnegative().optional(),
  desiredStartDate: z.string().optional(),
  headline: z.string(),
  summary: z.string(),
  workExperience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  certifications: z.array(certificationSchema),
  languages: z.array(languageSchema),
  projects: z.array(projectSchema),
  resumeFileId: idSchema.optional(),
  coverLetterFileId: idSchema.optional(),
  coverLetterTemplate: z.string().optional(),
});

export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Profile = z.infer<typeof profileSchema>;

export function createEmptyProfile(name = 'Default'): Profile {
  const now = Date.now();
  return {
    id: uuidv4(),
    name,
    isDefault: true,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: { city: '', state: '', country: '' },
    headline: '',
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    createdAt: now,
    updatedAt: now,
  };
}
