import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, specialization, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'Doctor name is required.' }, { status: 400 });
    }

    const [newDoctor] = await db.insert(doctors)
      .values({
        name,
        specialization: specialization || 'General Physician',
        phone: phone || null,
        email: email || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newDoctor,
    });
  } catch (error: any) {
    console.error('Failed to create doctor:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
