<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let success = $state(false);
  let error = $state('');
  let token = $state('');
  let email = $state('');
  let userRole = $state('');

  // Get token and email from URL parameters
  $effect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token') || '';
    email = urlParams.get('email') || '';
    
    console.log('🔗 URL params - token:', token?.substring(0, 10) + '...', 'email:', email);
    
    // Fetch user role when email is available
    if (email) {
      fetchUserRole();
    }
  });

  // Function to fetch user role based on email
  async function fetchUserRole() {
    if (!email) return;
    
    console.log('🔍 Fetching user role for email:', email);
    
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        userRole = data.role || '';
        console.log('✅ User role fetched:', userRole);
      } else {
        console.log('❌ Failed to fetch user role, response:', response.status);
      }
    } catch (err) {
      console.log('❌ Error fetching user role:', err);
      console.log('Could not fetch user role, defaulting to regular login');
    }
  }

  async function handleSubmit() {
    if (!password) {
      error = 'Please enter a new password';
      return;
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters long';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          email, 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success = true;
        // Get user role from response to determine correct login page
        userRole = data.userRole || '';
        console.log('✅ Password reset successful, userRole:', userRole);
      } else {
        error = data.error || 'Failed to reset password';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    console.log('🚀 goToLogin called, userRole:', userRole, 'email:', email);
    
    try {
      // If user role is not available, try to determine from email domain or default to regular login
      if (!userRole) {
        console.log('⚠️ User role not available, defaulting to regular login');
        goto('/login');
        return;
      }
      
      // Redirect to appropriate login page based on user role
      if (userRole === 'admin') {
        console.log('➡️ Redirecting to admin signin');
        goto('/admin/signin');
      } else {
        console.log('➡️ Redirecting to regular login (role:', userRole, ')');
        goto('/login');
      }
    } catch (error) {
      console.error('❌ Redirect error:', error);
      // Fallback to window.location
      try {
        if (userRole === 'admin') {
          window.location.href = '/admin/signin';
        } else {
          window.location.href = '/login';
        }
      } catch (fallbackError) {
        console.error('❌ Fallback redirect also failed:', fallbackError);
      }
    }
  }
</script>

<svelte:head>
  <title>Reset Password - Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <Card>
      <div class="text-center space-y-6">
        <!-- Header -->
        <div class="space-y-2">
          <h1 class="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p class="text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {#if success}
          <!-- Success Message -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-green-800">Password reset successful!</h3>
                <p class="text-sm text-green-700 mt-1">
                  Your password has been updated. You can now log in with your new password.
                </p>
              </div>
            </div>
          </div>

          <button 
            on:click={() => {
              console.log('🔘 Success button clicked!');
              goToLogin();
            }}
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Login
          </button>
          
          <!-- Test button for debugging -->
          <button 
            on:click={() => {
              console.log('🧪 Test button clicked!');
              window.location.href = '/login';
            }}
            class="mt-2 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Test Redirect (Direct)
          </button>
        {:else if !token || !email}
          <!-- Invalid Link -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-medium text-red-800">Invalid reset link</h3>
                <p class="text-sm text-red-700 mt-1">
                  This password reset link is invalid or has expired.
                </p>
              </div>
            </div>
          </div>

          <button 
            on:click={() => {
              console.log('🔘 Invalid link button clicked!');
              goToLogin();
            }}
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Login
          </button>
        {:else}
          <!-- Reset Password Form -->
          <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                bind:value={password}
                placeholder="Enter new password"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                bind:value={confirmPassword}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
            </div>

            {#if error}
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-700">{error}</p>
              </div>
            {/if}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <!-- Back to Login -->
          <div class="text-center">
            <button
              on:click={() => {
                console.log('🔘 Back to Login button clicked!');
                goToLogin();
              }}
              class="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to Login
            </button>
          </div>
        {/if}
      </div>
    </Card>
  </div>
</div>