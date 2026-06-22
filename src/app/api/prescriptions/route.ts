import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { prescriptions } from '@/db/schema';

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
