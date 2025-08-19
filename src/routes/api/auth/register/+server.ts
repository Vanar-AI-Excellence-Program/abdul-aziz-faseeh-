import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userService } from '$lib/server/services/user-service';
import { otpService } from '$lib/server/services/otp-service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, email, password, role = 'client' } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Validate role
    if (!['client', 'admin'].includes(role)) {
      return json({ message: 'Invalid role' }, { status: 400 });
    }

    // Create user with role
    const user = await userService.createUser({ name, email, password, role });

    // Generate and send OTP for email verification
    const otpResult = await otpService.generateAndSendOTP(user.id, user.email);

    if (!otpResult.success) {
      console.error('Failed to send OTP:', otpResult.message);
      // Still return success for user creation, but note the email issue
      return json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'User registered successfully, but there was an issue sending the verification email. Please contact support.',
        requiresVerification: true
      }, { status: 201 });
    }

    // Return success response without sensitive data
    return json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'User registered successfully. Please check your email for the verification code.',
      requiresVerification: true
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && error.message === 'User with this email already exists') {
      return json({ message: 'Email already in use' }, { status: 409 });
    }

    return json({ message: 'An error occurred during registration' }, { status: 500 });
  }
};