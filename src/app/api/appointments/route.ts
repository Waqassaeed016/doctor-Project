import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, doctorId, appointmentTime, status } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId.' }, { status: 400 });
    }

    const updateData: any = {};
    if (doctorId !== undefined) updateData.doctorId = doctorId || null;
    if (appointmentTime !== undefined) updateData.appointmentTime = appointmentTime ? new Date(appointmentTime) : null;
    if (status !== undefined) updateData.status = status;

    const [updatedAppointment] = await db.update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error: any) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
