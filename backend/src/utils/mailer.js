import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend API
 * @param {string} to - Receiver email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: 'Help Circle <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (response.error) {
      console.error("Resend API Error:", response.error);
      throw new Error(response.error.message);
    }

    return response;
  } catch (error) {
    console.error('Email sending failed (full):', error);
    throw new Error(error.message); // Keep actual error for now
  }
};
