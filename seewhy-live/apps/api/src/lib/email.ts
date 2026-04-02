// src/lib/email.ts
// Email delivery via Nodemailer (Postmark SMTP)

import nodemailer from 'nodemailer';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.postmarkapp.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.EMAIL_FROM || 'hello@seewhylive.com';
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `SeeWhy LIVE <${FROM}>`,
    to: email,
    subject: 'Verify your SeeWhy LIVE account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0f; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #8b5cf6; font-size: 28px; margin: 0;">SeeWhy <span style="color: #06b6d4;">LIVE</span></h1>
        </div>
        <h2 style="color: #f1f5f9;">Verify your email address</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          Welcome to SeeWhy LIVE! Click the button below to verify your email and start creating.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Verify Email
          </a>
        </div>
        <p style="color: #475569; font-size: 14px;">
          Link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  });
  logger.info({ email }, 'Verification email sent');
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `SeeWhy LIVE <${FROM}>`,
    to: email,
    subject: 'Reset your SeeWhy LIVE password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0f; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #8b5cf6; font-size: 28px; margin: 0;">SeeWhy <span style="color: #06b6d4;">LIVE</span></h1>
        </div>
        <h2 style="color: #f1f5f9;">Reset your password</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          We received a request to reset your password. Click below to choose a new one.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #475569; font-size: 14px;">
          Link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
  logger.info({ email }, 'Password reset email sent');
}

export async function sendPayoutNotification(
  email: string,
  amount: number,
  currency: string,
): Promise<void> {
  await transporter.sendMail({
    from: `SeeWhy LIVE <${FROM}>`,
    to: email,
    subject: `💰 Payout of ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} initiated`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0f; color: #e2e8f0;">
        <h2 style="color: #10b981;">Payout Initiated! 🎉</h2>
        <p style="color: #94a3b8;">
          Your payout of <strong style="color: #f1f5f9;">${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</strong> 
          has been initiated and will arrive in your bank account within 2-7 business days.
        </p>
        <p style="color: #94a3b8;">Keep creating amazing content!</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, displayName: string): Promise<void> {
  await transporter.sendMail({
    from: `SeeWhy LIVE <${FROM}>`,
    to: email,
    subject: `Welcome to SeeWhy LIVE, ${displayName}! 🎬`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0f; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #8b5cf6; font-size: 28px; margin: 0;">SeeWhy <span style="color: #06b6d4;">LIVE</span></h1>
        </div>
        <h2 style="color: #f1f5f9;">Welcome, ${displayName}! 🎬</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          You're now part of the SeeWhy LIVE creator community. Start your first live stream 
          and earn 90% of all revenue you generate — always.
        </p>
        <div style="background: #1a1a2e; border: 1px solid #8b5cf6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #8b5cf6; margin-top: 0;">Your Creator Benefits</h3>
          <ul style="color: #94a3b8; line-height: 2;">
            <li>🎥 Multi-guest live streams (up to 20 guests)</li>
            <li>💰 90% revenue share — always</li>
            <li>📊 Real-time analytics dashboard</li>
            <li>🤖 AI-powered moderation & transcription</li>
            <li>🌍 Stream to YouTube, Twitch & more simultaneously</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="${BASE_URL}/dashboard" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `,
  });
}
