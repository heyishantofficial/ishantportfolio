// Service to handle contact form submissions via Web3Forms
// Deliveries arrive directly in heyishant@gmail.com with Reply-To set to the visitor's email.

export const WEB3FORMS_ACCESS_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WEB3FORMS_ACCESS_KEY) || 
  '4e1dfe22-ff83-4f7f-962a-984212a44d16';

export async function sendContactEmail({ name, email, subject, message }) {
  const trimmedEmail = (email || '').trim();
  const trimmedName = (name || '').trim();
  const trimmedSubject = (subject || '').trim();
  const trimmedMessage = (message || '').trim();

  if (!trimmedEmail) {
    throw new Error('Please provide your email address so Ishant can reply to you.');
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address (e.g. name@example.com).');
  }

  if (!trimmedMessage) {
    throw new Error('Please enter a message before sending.');
  }

  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    name: trimmedName || 'Portfolio Visitor',
    email: trimmedEmail,
    replyto: trimmedEmail,
    subject: trimmedSubject || `Portfolio Inquiry from ${trimmedName || 'Visitor'}`,
    message: trimmedMessage,
    from_name: `${trimmedName || 'Visitor'} via heyishant.com`,
    botcheck: false
  };

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && (data.success || data.message?.toLowerCase().includes('success'))) {
      return {
        success: true,
        message: data.message || 'Message sent successfully!'
      };
    }

    throw new Error(data.message || 'Unable to deliver message right now. Please try again later.');
  } catch (err) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    throw new Error('Network error. Please check your internet connection or email directly at heyishant@gmail.com');
  }
}
