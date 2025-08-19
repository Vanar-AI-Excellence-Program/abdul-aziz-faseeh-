import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { otpService } from '$lib/server/services/otp-service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, otpCode } = await request.json();

    // Validate input
    if (!email || !otpCode) {
      return json({ message: 'Email and OTP code are required' }, { status: 400 });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return json({ message: 'OTP must be a 6-digit number' }, { status: 400 });
    }

    // Verify OTP
    const result = await otpService.verifyOTP(email, otpCode);

    if (result.success) {
      return json({
        success: true,
        message: result.message,
        userId: result.userId
      }, { status: 200 });
    } else {
      return json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return json({ 
      success: false,
      message: 'An error occurred during verification. Please try again.' 
    }, { status: 500 });
  }
};
