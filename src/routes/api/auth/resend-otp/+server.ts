import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { otpService } from '$lib/server/services/otp-service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return json({ message: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ message: 'Please enter a valid email address' }, { status: 400 });
    }

    // Resend OTP
    const result = await otpService.resendOTP(email);

    return json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('OTP resend error:', error);
    return json({ 
      success: false,
      message: 'An error occurred while resending OTP. Please try again.' 
    }, { status: 500 });
  }
};
