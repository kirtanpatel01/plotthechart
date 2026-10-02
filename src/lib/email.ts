import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  // If no API key is provided, log the email to the console for local development
  if (!process.env.RESEND_API_KEY) {
    console.log('\n=================== MOCK EMAIL ===================')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body:\n${html}`)
    console.log('==================================================\n')
    return
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'PlotTheChart <hello@kjpatel.me>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

