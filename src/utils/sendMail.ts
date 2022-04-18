import nodemailer from 'nodemailer'

export async function sendMail(to: string, secret: string) {
   let testAccount = await nodemailer.createTestAccount();
   console.log(testAccount)
   let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: process.env.GMAIL,
         pass: process.env.GMAIL_PASSWORD //my pswd
      }
   });

   let info = await transporter.sendMail({
      from: '"REDDIT" <foo@example.com>',
      to: to,
      subject: "Change password",
      text: "Hello world?",
      html: `<a href="${process.env.CLIENT as string}/change-password/${secret}">
         Change password
      </a>`,
   });

   console.log("Message sent: %s", info.messageId);
   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}