import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
    }
});

export const sendReportEmail = async (
    recipients: string[],
    subject: string,
    text: string,
    attachments: { filename: string; content: any }[] = []
) => {
    if (!recipients || recipients.length === 0) return;

    const mailOptions = {
        from: '"System Reporter" <no-reply@goldentextile.com>',
        to: recipients.join(', '),
        subject,
        text,
        attachments
    };

    return transporter.sendMail(mailOptions);
};
