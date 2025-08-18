<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { goto } from '$app/navigation';
  import { signIn } from '@auth/sveltekit/client';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    error = '';
    success = '';

    try {
      const result = await signIn('credentials', {
        email,
        password,
        role: 'admin',
        redirect: false
      });

      if (result?.error) {
        error = result.error;
      } else {
        success = 'Sign in successful! Redirecting to admin dashboard...';
        setTimeout(() => {
          goto('/admin/dashboard');
        }, 1500);
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Handle OAuth sign-in with proper redirection
  async function handleOAuthSignIn(provider: string) {
    try {
      const result = await signIn(provider, {
        callbackUrl: '/admin/dashboard', // Redirect to admin dashboard for OAuth
        redirect: false
      });
      
      if (result?.error) {
        error = result.error;
      } else if (result?.url) {
        // OAuth was successful, redirect to the callback URL
        window.location.href = result.url;
      }
    } catch (err) {
      error = `Failed to sign in with ${provider}. Please try again.`;
    }
  }
</script>

<svelte:head>
  <title>Admin Sign In | Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
  <!-- 3D Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-10 left-5 w-40 h-40 bg-blue-200 rounded-full opacity-15 blur-3xl transform rotate-12"></div>
    <div class="absolute top-20 right-10 w-32 h-32 bg-blue-300 rounded-full opacity-20 blur-2xl transform -rotate-12"></div>
    <div class="absolute bottom-10 left-1/3 w-48 h-48 bg-blue-100 rounded-full opacity-10 blur-3xl transform rotate-45"></div>
    <div class="absolute bottom-20 right-1/4 w-36 h-36 bg-blue-200 rounded-full opacity-15 blur-2xl transform -rotate-30"></div>
  </div>

  <div class="relative z-10 min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="relative inline-block mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full opacity-60"></div>
        </div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent mb-2">
          Admin Sign In
        </h1>
        <p class="text-xl text-blue-700 font-medium">
          Access the admin dashboard
        </p>
      </div>

      <!-- Sign In Form -->
      <div class="relative group">
        <div class="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-3xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500"></div>
        <div class="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-blue-200/50">
          {#if error}
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center backdrop-blur-sm" role="alert">
              <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p>{error}</p>
            </div>
          {/if}

          {#if success}
            <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center backdrop-blur-sm" role="alert">
              <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p>{success}</p>
            </div>
          {/if}

          <form method="POST" on:submit={handleSubmit}>
            <div class="space-y-6">
              <!-- OAuth Sign-in Section -->
              <div class="space-y-4">
                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-white/90 text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 gap-4">
                  <!-- Google Sign-in Button -->
                  <Button
                    onClick={() => handleOAuthSignIn('google')}
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

                  <!-- GitHub Sign-in Button -->
                  <Button
                    onClick={() => handleOAuthSignIn('github')}
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
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                required
                fullWidth
                class="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                bind:value={email}
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                required
                fullWidth
                class="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                bind:value={password}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                class="bg-sky-400 text-slate-50 border-sky-300 hover:bg-sky-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-2"
              >
                Sign In as Admin
              </Button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Don't have admin access? 
              <a href="/admin/register" class="text-blue-600 hover:text-blue-700 font-medium">
                Register as Admin
              </a>
            </p>
          </div>

          <div class="mt-4 text-center">
            <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
