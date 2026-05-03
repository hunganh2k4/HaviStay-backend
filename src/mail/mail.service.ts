import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  constructor() {
    console.log('MailService initialized');
    console.log('MAIL USER EXISTS:', !!process.env.MAIL_USER);
    console.log('MAIL PASS EXISTS:', !!process.env.MAIL_PASS);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

    try {
      console.log('Sending verification email to:', email);
      console.log('Verify link:', verifyLink);

      const info = await this.transporter.sendMail({
        from: `"HaviStay" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Verify your HaviStay account',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to HaviStay 🏡</h2>

            <p>Thanks for registering.</p>

            <p>Click below to verify your email:</p>

            <a href="${verifyLink}" 
               style="
                 display:inline-block;
                 padding:12px 20px;
                 background:black;
                 color:white;
                 text-decoration:none;
                 border-radius:8px;
                 margin:10px 0;
               ">
               Verify Email
            </a>

            <p>If the button doesn't work, copy this link:</p>

            <p>${verifyLink}</p>

            <p>This link expires in 1 hour.</p>
          </div>
        `,
      });

      console.log('MAIL SENT SUCCESS:', info.messageId);

      return info;
    } catch (error) {
      console.error('NODEMAILER ERROR:', error);
      throw error;
    }
  }

  async sendHostVerificationStatusEmail(email: string, status: string, reviewNote?: string) {
    const isApproved = status === 'APPROVED';
    const subject = isApproved ? 'HaviStay: Host Application Approved! 🎉' : 'HaviStay: Host Application Update';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello from HaviStay! 🏡</h2>
        <p>Your request to become a Host has been <strong>${isApproved ? 'Approved' : 'Rejected'}</strong>.</p>
        ${reviewNote ? `<p><strong>Admin Note:</strong> ${reviewNote}</p>` : ''}
        ${isApproved ? `<p>You can now start adding properties and managing them from your Host Dashboard.</p>` : `<p>Please review the feedback and try again or contact support.</p>`}
        <p>Best regards,<br>The HaviStay Team</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"HaviStay" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      return info;
    } catch (error) {
      console.error('NODEMAILER ERROR:', error);
    }
  }

  async sendPropertyVerificationStatusEmail(email: string, propertyName: string, status: string, reviewNote?: string) {
    const isApproved = status === 'APPROVED';
    const subject = isApproved ? `HaviStay: Property "${propertyName}" Approved! 🎉` : `HaviStay: Property "${propertyName}" Update`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello from HaviStay! 🏡</h2>
        <p>Your property <strong>${propertyName}</strong> has been <strong>${isApproved ? 'Approved' : 'Rejected'}</strong>.</p>
        ${reviewNote ? `<p><strong>Admin Note:</strong> ${reviewNote}</p>` : ''}
        ${isApproved ? `<p>Your property is now published and visible to guests!</p>` : `<p>Please review the feedback, update your property details, and submit for verification again.</p>`}
        <p>Best regards,<br>The HaviStay Team</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"HaviStay" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      return info;
    } catch (error) {
      console.error('NODEMAILER ERROR:', error);
    }
  }
}