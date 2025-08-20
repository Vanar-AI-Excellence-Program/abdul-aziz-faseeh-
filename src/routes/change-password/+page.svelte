<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { goto } from '$app/navigation';

  let { data } = $props();
  let { session } = data;

  // Password change state
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  let success = '';

  async function handlePasswordChange(e) {
    e.preventDefault();
    loading = true;
    error = '';
    success = '';

    // Validate passwords
    if (newPassword !== confirmPassword) {
      error = 'New passwords do not match';
      loading = false;
      return;
    }

    if (newPassword.length < 6) {
      error = 'New password must be at least 6 characters long';
      loading = false;
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success = 'Password changed successfully!';
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
      } else {
        error = data.error || 'Failed to change password';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Change Password | Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
  <!-- Enhanced 3D Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-10 left-5 w-40 h-40 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full opacity-10 blur-3xl transform rotate-12 animate-pulse"></div>
    <div class="absolute top-20 right-10 w-32 h-32 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full opacity-8 blur-2xl transform -rotate-12 animate-pulse delay-1000"></div>
    <div class="absolute bottom-10 left-1/3 w-48 h-48 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-6 blur-3xl transform rotate-45 animate-pulse delay-2000"></div>
    <div class="absolute bottom-20 right-1/4 w-36 h-36 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-8 blur-2xl transform -rotate-30 animate-pulse delay-1500"></div>
    <div class="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-4 blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
  </div>

  <div class="relative z-10 min-h-screen">
    <div class="max-w-4xl mx-auto px-8 py-12">
      <!-- Enhanced Header Section -->
      <div class="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 mb-12 transform hover:scale-[1.02] transition-transform duration-500">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-6">
            <div class="relative">
              <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div class="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full opacity-80 animate-pulse"></div>
            </div>
            <div>
              <h1 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                Change Password
              </h1>
              <p class="text-xl text-gray-600 font-medium">
                Update your account security and credentials
              </p>
            </div>
          </div>
          <div class="flex space-x-3">
            <Button 
              onClick={() => goto('/dashboard')}
              variant="outline"
              class="group relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-500 hover:text-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div class="relative flex items-center gap-2 justify-center">
                <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </div>
            </Button>
            <Button 
              onClick={() => goto('/profile')}
              variant="outline"
              class="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-300 hover:from-gray-100 hover:to-gray-200 hover:border-gray-500 hover:text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div class="relative flex items-center gap-2 justify-center">
                <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Back to Profile</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      <!-- Enhanced Change Password Form -->
      <div class="relative group">
        <div class="absolute inset-0 bg-gradient-to-br from-white/90 to-green-50/90 rounded-3xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-500 shadow-2xl"></div>
        <div class="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div class="flex items-center mb-8">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Security Settings</h3>
          </div>

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

          <form onsubmit={handlePasswordChange}>
            <div class="space-y-6">
              <Input
                id="currentPassword"
                type="password"
                label="Current Password"
                placeholder="Enter your current password"
                required
                bind:value={currentPassword}
                fullWidth
                class="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />

              <Input
                id="newPassword"
                type="password"
                label="New Password"
                placeholder="Enter your new password"
                required
                bind:value={newPassword}
                fullWidth
                class="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="Confirm your new password"
                required
                bind:value={confirmPassword}
                fullWidth
                class="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />

              <div class="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  class="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-6 py-3 font-semibold"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-white to-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div class="relative flex items-center gap-2 justify-center">
                    <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update Password</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goto('/profile')}
                  class="group relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-300 hover:from-gray-100 hover:to-gray-200 hover:border-gray-500 hover:text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-6 py-3 font-semibold"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div class="relative flex items-center gap-2 justify-center">
                    <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </div>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
