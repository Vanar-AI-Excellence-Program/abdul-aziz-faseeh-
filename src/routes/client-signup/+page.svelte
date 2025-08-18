<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { signIn } from '@auth/sveltekit/client';

  let { data } = $props();
  let { session } = data;

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);

  // Redirect if already logged in
  $effect(() => {
    if (session) {
      if (session.user.role === 'admin') {
        goto('/admin');
      } else {
        goto('/dashboard');
      }
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    error = '';
    success = false;

    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      error = 'All fields are required';
      loading = false;
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      loading = false;
      return;
    }

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      loading = false;
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role: 'client' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration successful
      success = true;
      setTimeout(() => {
        goto('/login?role=client');
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'An unexpected error occurred';
      }
    } finally {
      loading = false;
    }
  }

  // Handle OAuth sign-up with proper redirection
  async function handleOAuthSignUp(provider: string) {
    try {
      const result = await signIn(provider, {
        callbackUrl: '/dashboard', // Default redirect for OAuth sign-up
        redirect: false
      });
      
      if (result?.error) {
        error = result.error;
      } else if (result?.url) {
        // OAuth was successful, redirect to the callback URL
        window.location.href = result.url;
      }
    } catch (err) {
      error = `Failed to sign up with ${provider}. Please try again.`;
    }
  }
</script>

<svelte:head>
  <title>Client Registration | Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
  <div class="max-w-md w-full mx-auto px-6">
    <Card>
      <div class="text-center mb-6">
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Create Client Account</h1>
        <p class="text-gray-600">Join our platform as a client user</p>
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      {/if}

      {#if success}
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p>Registration successful! Redirecting to login...</p>
        </div>
      {/if}

      <form onsubmit={handleSubmit}>
        <div class="space-y-4">
          <!-- OAuth Sign-up Section -->
          <div class="space-y-4">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4">
              <!-- Google Sign-up Button -->
              <Button
                onClick={() => handleOAuthSignUp('google')}
                variant="outline"
                fullWidth
                class="relative bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold text-base py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
              >
                <div class="flex items-center justify-center w-full">
                  <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span class="text-gray-700 group-hover:text-gray-900">Continue with Google</span>
                </div>
              </Button>

              <!-- GitHub Sign-up Button -->
              <Button
                onClick={() => handleOAuthSignUp('github')}
                variant="outline"
                fullWidth
                class="relative bg-gray-900 text-white border-2 border-gray-900 hover:bg-gray-800 hover:border-gray-800 font-semibold text-base py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
              >
                <div class="flex items-center justify-center w-full">
                  <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span class="text-white group-hover:text-gray-100">Continue with GitHub</span>
                </div>
              </Button>
            </div>
          </div>

          <Input
            id="name"
            name="name"
            type="text"
            label="Full name"
            placeholder="Enter your full name"
            required
            bind:value={name}
            fullWidth
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="Enter your email"
            required
            bind:value={email}
            fullWidth
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Create a password"
            required
            bind:value={password}
            fullWidth
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm password"
            placeholder="Confirm your password"
            required
            bind:value={confirmPassword}
            fullWidth
          />

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
            class="bg-sky-400 text-slate-50 border-sky-300 hover:bg-sky-500 backdrop-blur-sm font-semibold text-lg py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2"
          >
            Create Client Account
          </Button>

          <div class="text-center mt-6">
            <p class="text-sm text-gray-600">
              Already have an account?
              <a href="/login?role=client" class="font-medium text-blue-600 hover:text-blue-500">Sign in</a>
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Want to register as an admin?
              <a href="/admin/register" class="font-medium text-blue-600 hover:text-blue-500">Admin registration</a>
            </p>
          </div>
        </div>
      </form>
    </Card>
  </div>
</div>
