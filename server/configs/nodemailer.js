import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async ({ to, subject, body }) => {
    console.log("Transporter attempting to send email to:", to);
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: body, // HTML version of the message
        });
        console.log("Transporter sendMail response:", response);
        return response;
    } catch (error) {
        console.error("Transporter sendMail Error:", error);
        throw error;
    }
}

export default sendEmail;