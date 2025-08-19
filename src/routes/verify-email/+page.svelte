<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let email = $state('');
  let otpCode = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state('');
  let resendLoading = $state(false);
  let resendCooldown = $state(0);

  // Get email from URL params
  onMount(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      email = urlParams.get('email') || '';
      
      // If no email in URL, redirect to signup
      if (!email) {
        goto('/signup');
      }
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    error = '';
    success = '';

    // Validate form
    if (!email || !otpCode) {
      error = 'Email and OTP code are required';
      loading = false;
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      error = 'OTP must be a 6-digit number';
      loading = false;
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otpCode })
      });

      const data = await response.json();

      if (data.success) {
        success = data.message;
        setTimeout(() => {
          goto('/login?verified=true');
        }, 2000);
      } else {
        error = data.message;
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function handleResendOTP() {
    if (resendCooldown > 0) return;
    
    resendLoading = true;
    error = '';
    success = '';

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        success = data.message;
        // Start cooldown (60 seconds)
        resendCooldown = 60;
        const interval = setInterval(() => {
          resendCooldown--;
          if (resendCooldown <= 0) {
            clearInterval(interval);
          }
        }, 1000);
      } else {
        error = data.message;
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      resendLoading = false;
    }
  }

  function formatOTPInput(value: string) {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    otpCode = cleaned;
  }
</script>

<svelte:head>
  <title>Verify Email - Authentication App</title>
</svelte:head>

<!-- Enhanced Background with Gradient and Animation -->
<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
    <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style="animation-delay: 4s;"></div>
  </div>

  <div class="max-w-md w-full mx-auto relative z-10">
    <!-- Enhanced Verification Card -->
    <div class="relative group">
      <div class="absolute inset-0 bg-white rounded-3xl transform rotate-1 group-hover:rotate-0 transition-transform duration-700 shadow-2xl"></div>
      <div class="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20 group-hover:shadow-3xl transition-all duration-500">
        
        <!-- Enhanced Header with Icon -->
        <div class="text-center mb-10">
          <div class="flex justify-center mb-8">
            <div class="relative group">
              <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div class="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full opacity-60 animate-bounce flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Verify Your Email
          </h1>
          
          <p class="text-gray-600 text-lg leading-relaxed mb-2">
            We've sent a 6-digit verification code to
          </p>
          
          <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
            <svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span class="text-blue-700 font-medium text-sm">{email}</span>
          </div>
          
          <div class="flex items-center justify-center space-x-4 mt-6">
            <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span class="text-gray-500 font-medium text-sm">Secure Verification</span>
            <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
        </div>

        <!-- Enhanced Alert Messages -->
        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-start backdrop-blur-sm" role="alert">
            <svg class="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="font-medium">{error}</p>
          </div>
        {/if}

        {#if success}
          <div class="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl mb-8 flex items-center backdrop-blur-sm" role="alert">
            <svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="font-medium">{success}</p>
          </div>
        {/if}

        <!-- Enhanced Verification Form -->
        <form onsubmit={handleSubmit} class="space-y-8">
          <!-- Hidden Email Field -->
          <div class="hidden">
            <Input
              id="email"
              name="email"
              type="email"
              bind:value={email}
              disabled
              class="bg-gray-50"
            />
          </div>

          <!-- Enhanced OTP Input Section -->
          <div class="space-y-4">
            <label for="otpCode" class="block text-lg font-semibold text-gray-800 text-center">
              Enter Verification Code
            </label>
            
            <div class="relative">
              <Input
                id="otpCode"
                name="otpCode"
                type="text"
                value={otpCode}
                oninput={(e) => formatOTPInput(e.target.value)}
                placeholder="000000"
                maxlength="6"
                class="text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md bg-white/50 backdrop-blur-sm"
                autocomplete="one-time-code"
              />
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <p class="text-sm text-gray-500 text-center">
              Code expires in 10 minutes
            </p>
          </div>

          <!-- Enhanced Action Buttons -->
          <div class="space-y-6">
            <Button
              type="submit"
              disabled={loading || !otpCode || otpCode.length !== 6}
              class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
            >
              {#if loading}
                <div class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </div>
              {:else}
                <div class="flex items-center justify-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Verify Email
                </div>
              {/if}
            </Button>

            <!-- Enhanced Resend Section -->
            <div class="text-center space-y-3">
              <p class="text-gray-600 font-medium">
                Didn't receive the code?
              </p>
              
              <button
                type="button"
                onclick={handleResendOTP}
                disabled={resendLoading || resendCooldown > 0}
                class="inline-flex items-center px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
              >
                {#if resendCooldown > 0}
                  <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Resend in {resendCooldown}s
                {:else if resendLoading}
                  <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                {:else}
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Resend Code
                {/if}
              </button>
            </div>
          </div>
        </form>

        <!-- Enhanced Footer -->
        <div class="mt-8 pt-6 border-t border-gray-200 text-center space-y-4">
          <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>Your information is secure and encrypted</span>
          </div>
          
          <a 
            href="/signup" 
            class="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Sign Up
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add some visual styling for the OTP input */
  :global(.otp-input) {
    letter-spacing: 0.5em;
  }
</style>