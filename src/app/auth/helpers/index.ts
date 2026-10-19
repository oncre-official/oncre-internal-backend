export function waitlistSignupContent(email: string): { subject: string; content: string } {
  const subject = `New Waitlist Entry`;

  const content = `
    <p>A new user has joined the waitlist.</p>

    <p><strong>Email:</strong> ${email}</p>

    <p>Please follow up if necessary.</p>
  `;

  return { subject, content };
}
