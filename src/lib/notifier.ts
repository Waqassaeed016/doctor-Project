import { db } from '@/db';
import { connections } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface SendMessageArgs {
  phone: string;
  message: string;
}

export async function sendWhatsAppNotification({ phone, message }: SendMessageArgs): Promise<boolean> {
  try {
    const config = await db.query.connections.findFirst({
      where: eq(connections.id, 'default_config'),
    });

    if (!config || !config.theaibotApiKey || !config.theaibotInstanceName) {
      console.warn('WhatsApp alert skipped: theaibot is not configured in Connections tab.');
      return false;
    }

    const apiUrl = config.theaibotApiUrl || 'https://theaibot.io';
    // Clean phone number (digits only)
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const endpoint = `${apiUrl.replace(/\/$/, '')}/api/v1/send`;
    
    console.log(`Triggering theaibot notification to ${cleanPhone} via endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.theaibotApiKey}`
      },
      body: JSON.stringify({
        instanceName: config.theaibotInstanceName,
        number: cleanPhone,
        type: 'text',
        message: message
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`theaibot api returned error status ${response.status}: ${errText}`);
      return false;
    }

    console.log(`Successfully sent WhatsApp notification via theaibot to ${cleanPhone}`);
    return true;
  } catch (error) {
    console.error('Error in sendWhatsAppNotification:', error);
    return false;
  }
}
