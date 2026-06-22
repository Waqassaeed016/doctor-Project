import { pgTable, uuid, varchar, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// 1. Patients Table
export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age'),
  gender: varchar('gender', { length: 50 }),
  medicalHistory: text('medical_history'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Doctors Table
export const doctors = pgTable('doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  specialization: varchar('specialization', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Appointments Table
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  doctorId: uuid('doctor_id').references(() => doctors.id),
  appointmentTime: timestamp('appointment_time'),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending', 'approved', 'completed', 'cancelled'
  symptoms: text('symptoms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Prescriptions Table
export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  doctorId: uuid('doctor_id').references(() => doctors.id).notNull(),
  diagnosis: text('diagnosis'),
  medicines: jsonb('medicines'), // Array of { name: string, dosage: string, frequency: string, duration: string }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Medical Files Table
export const medicalFiles = pgTable('medical_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  prescriptionId: uuid('prescription_id').references(() => prescriptions.id, { onDelete: 'set null' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(), // Google Drive webViewLink or local upload path
  fileType: varchar('file_type', { length: 50 }), // 'image/jpeg', 'application/pdf', etc.
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});
