import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, patients, doctors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppNotification } from '@/lib/notifier';

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

    // Trigger WhatsApp notification if status changes
    if (status) {
      try {
        const [details] = await db.select({
          patientName: patients.name,
          phone: patients.phone,
          doctorName: doctors.name,
          appointmentTime: appointments.appointmentTime
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .where(eq(appointments.id, appointmentId));

        if (details) {
          let message = '';
          if (status === 'approved') {
            const timeStr = details.appointmentTime 
              ? new Date(details.appointmentTime).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'TBD';
            message = `Assalam-o-Alaikum ${details.patientName}! Your appointment with ${details.doctorName || 'Doctor'} has been approved for ${timeStr}.`;
          } else if (status === 'completed') {
            message = `Dear ${details.patientName}, your consultation is now completed. Thank you!`;
          } else if (status === 'cancelled') {
            message = `Dear ${details.patientName}, your appointment has been cancelled. Please contact us for details.`;
          }

          if (message) {
            sendWhatsAppNotification({
              phone: details.phone,
              message: message
            }).catch(err => console.error('Background WhatsApp alert failed:', err));
          }
        }
      } catch (detailsErr) {
        console.error('Failed to fetch appointment details for notification:', detailsErr);
      }
    }

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
