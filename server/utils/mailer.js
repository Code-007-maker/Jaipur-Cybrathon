const nodemailer = require('nodemailer');

/**
 * Mailer utility using SMTP (Standard Email/Password)
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        // Robust environment variable parsing (stripping quotes)
        const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/"/g, '');
        const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
        const smtpUser = (process.env.SMTP_USER || '').replace(/"/g, '');
        const smtpPass = (process.env.SMTP_PASS || '').replace(/"/g, '');
        const fromName = (process.env.FROM_NAME || 'CareGrid').replace(/"/g, '');
        const fromEmail = (process.env.FROM_EMAIL || smtpUser).replace(/"/g, '');

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort == 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            }
        });

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            text,
            html
        };

        console.log(`\n--- Sending SOS Email ---`);
        console.log(`To: ${to}`);
        console.log(`From: ${mailOptions.from}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML Body Length: ${html ? html.length : 0}`);
        console.log(`Text Body Length: ${text ? text.length : 0}`);

        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully: ${result.messageId}`);
        return result;
    } catch (error) {
        console.error('--- SOS EMAIL ERROR (SMTP) ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        return null;
    }
};

module.exports = { sendEmail };
