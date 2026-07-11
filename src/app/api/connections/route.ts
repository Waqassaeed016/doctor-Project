import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { connections } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await db.query.connections.findFirst({
      where: eq(connections.id, 'default_config'),
    });

    if (!config) {
      return NextResponse.json({
        theaibotApiUrl: 'https://theaibot.io',
        theaibotApiKey: '',
        theaibotInstanceName: '',
      });
    }

    // Mask API Key for security when returning to UI
    const maskedKey = config.theaibotApiKey 
      ? `${config.theaibotApiKey.slice(0, 7)}••••••••` 
      : '';

    return NextResponse.json({
      theaibotApiUrl: config.theaibotApiUrl || 'https://theaibot.io',
      theaibotApiKey: maskedKey,
      theaibotInstanceName: config.theaibotInstanceName || '',
      hasKey: !!config.theaibotApiKey
    });
  } catch (error: any) {
    console.error('Failed to get connection config:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teaibotApiUrl, teaibotApiKey, teaibotInstanceName } = body;

    // Check if configuration already exists
    const existing = await db.query.connections.findFirst({
      where: eq(connections.id, 'default_config'),
    });

    const updateData: any = {
      theaibotApiUrl: teaibotApiUrl || 'https://theaibot.io',
      theaibotInstanceName: teaibotInstanceName || '',
      updatedAt: new Date(),
    };

    // Only update key if it is not the masked version (i.e. user entered a new key)
    if (teaibotApiKey && !teaibotApiKey.includes('••••')) {
      updateData.theaibotApiKey = teaibotApiKey;
    }

    if (existing) {
      await db.update(connections)
        .set(updateData)
        .where(eq(connections.id, 'default_config'));
    } else {
      await db.insert(connections)
        .values({
          id: 'default_config',
          ...updateData,
          // If key is empty or placeholder, set as null, otherwise set value
          theaibotApiKey: (teaibotApiKey && !teaibotApiKey.includes('••••')) ? teaibotApiKey : null
        });
    }

    return NextResponse.json({ success: true, message: 'Connection settings successfully updated.' });
  } catch (error: any) {
    console.error('Failed to save connection config:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
