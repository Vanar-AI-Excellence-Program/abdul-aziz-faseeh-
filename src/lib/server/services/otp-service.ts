import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from './email-service';

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  userId?: string;
}

export const otpService = {
  /**
   * Generate a random 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Generate and store OTP for a user, then send via email
   */
  async generateAndSendOTP(userId: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Update user with OTP
      await db.update(users)
        .set({
          otpCode: otp,
          otpExpiresAt: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Send OTP email
      await this.sendOTPEmail(email, otp);

      return {
        success: true,
        message: 'OTP sent successfully to your email address'
      };
    } catch (error) {
      console.error('Error generating and sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  },

  /**
   * Verify OTP code for a user
   */
  async verifyOTP(email: string, otpCode: string): Promise<OTPVerificationResult> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user already verified
      if (user.isEmailVerified === 1) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      // Check if OTP exists
      if (!user.otpCode) {
        return {
          success: false,
          message: 'No OTP found. Please request a new one.'
        };
      }

      // Check if OTP is expired
      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      // Check if OTP matches
      if (user.otpCode !== otpCode) {
        return {
          success: false,
          message: 'Invalid OTP. Please check and try again.'
        };
      }

      // OTP is valid, verify the user's email
      await db.update(users)
        .set({
          isEmailVerified: 1,
          emailVerified: new Date(),
          otpCode: null, // Clear OTP after successful verification
          otpExpiresAt: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: 'Email verified successfully! You can now log in.',
        userId: user.id
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'An error occurred during verification. Please try again.'
      };
    }
  },

  /**
   * Resend OTP to user
   */
  async resendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user already verified
      if (user.isEmailVerified === 1) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      // Generate and send new OTP
      return await this.generateAndSendOTP(user.id, email);
    } catch (error) {
      console.error('Error resending OTP:', error);
      return {
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      };
    }
  },

  /**
   * Send OTP via email
   */
  async sendOTPEmail(email: string, otp: string): Promise<void> {
    const emailData = {
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">Email Verification</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Thank you for signing up! Please use the following verification code to complete your registration:
            </p>
            <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This verification code will expire in 10 minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Email Verification
        
        Thank you for signing up! Please use the following verification code to complete your registration:
        
        ${otp}
        
        This verification code will expire in 10 minutes.
        
        If you didn't request this verification, please ignore this email.
      `
    };

    await sendEmail(emailData);
  },

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { isEmailVerified: true }
      });

      return user?.isEmailVerified === 1;
    } catch (error) {
      console.error('Error checking email verification status:', error);
      return false;
    }
  },

  /**
   * Get user verification status by email
   */
  async getVerificationStatusByEmail(email: string): Promise<{ isVerified: boolean; userId?: string }> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, isEmailVerified: true }
      });

      if (!user) {
        return { isVerified: false };
      }

      return {
        isVerified: user.isEmailVerified === 1,
        userId: user.id
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return { isVerified: false };
    }
  }
};
