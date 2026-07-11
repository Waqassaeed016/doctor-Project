import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { prescriptions, patients, doctors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppNotification } from '@/lib/notifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, doctorId, diagnosis, medicines } = body;

    if (!patientId || !doctorId || !diagnosis) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, doctorId, and diagnosis are required.' },
        { status: 400 }
      );
    }

    // Insert prescription into database
    const [newPrescription] = await db.insert(prescriptions)
      .values({
        patientId,
        doctorId,
        diagnosis,
        medicines: medicines || [],
      })
      .returning();

    // Trigger WhatsApp notification with prescription details
    try {
      const [details] = await db.select({
        patientName: patients.name,
        phone: patients.phone,
        doctorName: doctors.name
      })
      .from(patients)
      .innerJoin(doctors, eq(doctors.id, doctorId))
      .where(eq(patients.id, patientId));

      if (details) {
        let medicinesList = '';
        if (medicines && Array.isArray(medicines)) {
          medicinesList = medicines.map((m: any) => `- ${m.name}: ${m.dosage || ''} (${m.frequency || ''}) for ${m.duration || ''}`).join('\n');
        }

        const message = `Assalam-o-Alaikum ${details.patientName}! Dr. ${details.doctorName} has issued your prescription.\n\nDiagnosis: ${diagnosis}\n\nMedicines:\n${medicinesList || 'No medicines listed.'}\n\nPlease click on your profile to view full details.`;

        sendWhatsAppNotification({
          phone: details.phone,
          message: message
        }).catch(err => console.error('Background prescription alert failed:', err));
      }
    } catch (notifyErr) {
      console.error('Failed to send prescription WhatsApp notification:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      data: newPrescription,
    });
  } catch (error: any) {
    console.error('Failed to create prescription:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
