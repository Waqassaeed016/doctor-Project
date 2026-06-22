import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, appointments, medicalFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateFolder, uploadToDrive } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      phone, 
      name, 
      age, 
      gender, 
      symptoms, 
      medicalHistory,
      attachments 
    } = body;

    // Validate required fields
    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: phone and name are required.' },
        { status: 400 }
      );
    }

    // Clean phone number (remove spaces, symbols)
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    // 1. Find or Create Patient
    let patientRecord = await db.query.patients.findFirst({
      where: eq(patients.phone, cleanPhone)
    });

    const patientData = {
      name: name,
      phone: cleanPhone,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      medicalHistory: medicalHistory || undefined,
      updatedAt: new Date(),
    };

    let patientId: string;

    if (patientRecord) {
      // Update patient profile
      await db.update(patients)
        .set(patientData)
        .where(eq(patients.id, patientRecord.id));
      patientId = patientRecord.id;
    } else {
      // Create new patient
      const [newPatient] = await db.insert(patients)
        .values({
          ...patientData,
          medicalHistory: medicalHistory || 'None reported.',
        })
        .returning();
      patientId = newPatient.id;
    }

    // 2. Create Patient's Google Drive Folder (Folder Name format: "Name (Phone)")
    let driveFolderId: string | undefined;
    try {
      const folderName = `${name} (${cleanPhone})`;
      driveFolderId = await getOrCreateFolder(folderName);
    } catch (driveErr) {
      console.error('Failed to get/create Google Drive folder:', driveErr);
      // We continue even if Drive fails, so patient record is still saved
    }

    // 3. Process Attachments if any
    const uploadedFiles: Array<{ id: string; url: string; name: string }> = [];

    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        const fileUrl = attachment.url;
        const origFileName = attachment.fileName || attachment.filename || `report-${Date.now()}`;
        const mimeType = attachment.mimeType || 'application/octet-stream';

        if (!fileUrl) continue;

        try {
          // Download attachment content
          const fileResponse = await fetch(fileUrl);
          if (!fileResponse.ok) {
            throw new Error(`Failed to download attachment from ${fileUrl}: ${fileResponse.statusText}`);
          }

          const arrayBuffer = await fileResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload to Google Drive folder
          const uploadResult = await uploadToDrive(
            origFileName,
            mimeType,
            buffer,
            driveFolderId
          );

          // Save file record in database
          const [savedFile] = await db.insert(medicalFiles)
            .values({
              patientId: patientId,
              fileName: origFileName,
              fileUrl: uploadResult.webViewLink,
              fileType: mimeType,
            })
            .returning();

          uploadedFiles.push({
            id: savedFile.id,
            url: uploadResult.webViewLink,
            name: origFileName
          });
        } catch (fileErr) {
          console.error(`Failed to process attachment ${origFileName}:`, fileErr);
          // Don't fail the entire request, just skip this file or use mock
        }
      }
    }

    // 4. Create Pending Appointment
    const [appointmentRecord] = await db.insert(appointments)
      .values({
        patientId: patientId,
        symptoms: symptoms || 'No symptoms specified.',
        status: 'pending',
        appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow same time
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Patient details and appointment successfully registered.',
      data: {
        patientId,
        appointmentId: appointmentRecord.id,
        filesCount: uploadedFiles.length,
        files: uploadedFiles
      }
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
