import nodemailer from "nodemailer";

 


export const  createMailService =async()=>{
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("Mail configuration verified successfully");
  } catch (error) {
    console.error("Mail configuration verification failed:", error);
    throw error;
  }

return transporter;
}
