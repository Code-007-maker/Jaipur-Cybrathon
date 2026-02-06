require('dotenv').config();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

async function diagnose() {
    console.log("--- Starting Mailer Diagnosis ---");
    console.log("From Email:", process.env.FROM_EMAIL);
    console.log("Client Email:", process.env.GOOGLE_CLIENT_EMAIL);

    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey && privateKey.startsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    try {
        console.log("Attempting to get OAuth2 token...");
        const jwtClient = new google.auth.JWT(
            process.env.GOOGLE_CLIENT_EMAIL,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/gmail.send'],
            process.env.FROM_EMAIL
        );

        const tokenData = await jwtClient.getAccessToken();
        console.log("Successfully retrieved token!");

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: process.env.FROM_EMAIL,
                accessToken: tokenData.token
            }
        });

        console.log("Verifying transporter...");
        await transporter.verify();
        console.log("Transporter verified! Authentication succeeded.");

    } catch (err) {
        console.error("\n--- DIAGNOSIS FAILED ---");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);

        if (err.message.includes('unauthorized_client')) {
            console.log("\nROOT CAUSE IDENTIFIED: Impersonation Error.");
            console.log("Service Accounts can only impersonate accounts within a Google Workspace domain with 'Domain-Wide Delegation'.");
            console.log("They CANNOT impersonate personal @gmail.com accounts (like " + process.env.FROM_EMAIL + ").");
            console.log("\nRESOLUTION: Switch to using a standard GMail App Password for best results.");
        }
    }
}

diagnose();
