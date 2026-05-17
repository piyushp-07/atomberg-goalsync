const NotificationLog = require('../models/NotificationLog');

/**
 * Universal Mock Notifier Engine
 * Dispatches simulated emails and Microsoft Teams Adaptive Cards, 
 * persisting them to the database for live UI auditing.
 */
const sendNotification = async ({ recipientEmail, recipientName, type = 'Email', event, subject, content }) => {
  try {
    const formattedContent = content.trim();
    
    // Save simulated dispatch to audit logs
    const log = await NotificationLog.create({
      recipientEmail,
      recipientName,
      type,
      event,
      subject,
      content: formattedContent
    });

    console.log(`\n=================== SIMULATED ${type.toUpperCase()} DISPATCH ===================`);
    console.log(`[Event]: ${event}`);
    console.log(`[To]: ${recipientName} <${recipientEmail}>`);
    console.log(`[Subject]: ${subject}`);
    console.log(`[Body]:\n${formattedContent}`);
    console.log(`=================================================================\n`);

    return log;
  } catch (error) {
    console.error('Failed to register notification log:', error);
  }
};

module.exports = { sendNotification };
