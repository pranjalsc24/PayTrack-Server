const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE, // The email service (e.g., 'gmail')
  auth: {
    user: process.env.SMTP_EMAIL, // Your email address
    pass: process.env.SMTP_PASS, // Your email password or app password
  },
});

exports.sendEmail = async (to, subject, text, filename, filePath) => {
  // Create the base mail options
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to,
    subject,
    text,
  };

  // If a file path is provided, add the attachment to the mail options
  if (filePath && filename) {
    mailOptions.attachments = [
      {
        filename: filename, // The name you want the file to have in the email
        path: filePath, // The path to the file on your server
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // MIME type for Excel files
      },
    ];
  }

  try {
    // Send the email and await the result
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info.response;
  } catch (error) {
    console.log("Error in mail sending: " + error);
  }
};
