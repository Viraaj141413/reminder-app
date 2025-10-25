import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  console.log('[Twilio] Getting credentials...');
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  console.log('[Twilio] Hostname:', hostname);
  console.log('[Twilio] Token type:', process.env.REPL_IDENTITY ? 'repl' : process.env.WEB_REPL_RENEWAL ? 'depl' : 'none');

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  console.log('[Twilio] Fetching connection settings...');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  console.log('[Twilio] Connection settings received:', !!connectionSettings);
  console.log('[Twilio] Settings keys:', connectionSettings ? Object.keys(connectionSettings.settings || {}) : 'none');

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    console.error('[Twilio] Missing required settings');
    throw new Error('Twilio not connected');
  }
  
  console.log('[Twilio] Credentials validated successfully');
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendReminderSMS(to: string, title: string, description?: string) {
  try {
    console.log(`[Twilio] Attempting to send SMS to ${to}`);
    
    const client = await getTwilioClient();
    const from = await getTwilioFromPhoneNumber();
    
    console.log(`[Twilio] Using from number: ${from}`);
    
    let message = `QA Reminder: ${title}`;
    if (description) {
      message += `\n\n${description}`;
    }
    
    console.log(`[Twilio] Message content: ${message}`);
    
    const result = await client.messages.create({
      body: message,
      from: from,
      to: to
    });
    
    console.log(`[Twilio] SMS sent successfully with SID: ${result.sid}`);
    return { success: true, messageSid: result.sid };
  } catch (error: any) {
    console.error('[Twilio] Failed to send SMS:', error);
    console.error('[Twilio] Error details:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
    return { success: false, error: error.message };
  }
}
