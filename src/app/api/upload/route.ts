import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, medicalFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateFolder, uploadToDrive } from '@/lib/gdrive';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const patientId = formData.get('patientId') as string;
    const file = formData.get('file') as File;

    if (!patientId || !file) {
      return NextResponse.json(
        { error: 'Missing required inputs: patientId and file are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch patient details to name the Google Drive folder
    const patientRecord = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    });

    if (!patientRecord) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // 2. Create/get patient folder on Google Drive
    let driveFolderId: string | undefined;
    try {
      const folderName = `${patientRecord.name} (${patientRecord.phone})`;
      driveFolderId = await getOrCreateFolder(folderName);
    } catch (driveErr) {
      console.error('Google Drive folder setup failed:', driveErr);
    }

    // 3. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to Google Drive
    const uploadResult = await uploadToDrive(
      file.name,
      file.type,
      buffer,
      driveFolderId
    );

    // 5. Store metadata in database
    const [savedFile] = await db.insert(medicalFiles)
      .values({
        patientId: patientId,
        fileName: file.name,
        fileUrl: uploadResult.webViewLink,
        fileType: file.type,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: savedFile,
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
