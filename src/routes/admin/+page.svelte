<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { signOut } from '@auth/sveltekit/client';
  import { onMount } from 'svelte';

  let { data } = $props();
  let { session } = data;

  let users = $state([]);
  let loading = $state(true);
  let stats = $state({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    clientUsers: 0
  });

  onMount(async () => {
    await loadUsers();
    await loadStats();
  });

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        users = await response.json();
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      loading = false;
    }
  }

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await loadUsers();
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadUsers();
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  async function handleSignOut() {
    try {
      // Use Auth.js signOut function
      const result = await signOut({ 
        callbackUrl: '/',
        redirect: false 
      });
      
      if (result?.url) {
        // Redirect to the callback URL
        window.location.href = result.url;
      } else {
        // Fallback: redirect to home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback: force redirect to home
      window.location.href = '/';
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard | Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-600 mt-2">Welcome back, {session?.user?.name || 'Admin'}!</p>
      </div>
      
      <div class="grid grid-cols-2 gap-3 max-w-lg">
        <!-- Edit Profile Button - Blue -->
        <Button 
          onClick={() => goto('/admin/profile')}
          variant="outline"
          class="group relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-500 hover:text-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div class="relative flex items-center gap-2 justify-center">
            <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Edit Profile</span>
          </div>
        </Button>

        <!-- Change Password Button - Green -->
        <Button 
          onClick={() => goto('/admin/change-password')}
          variant="outline"
          class="group relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 border-2 border-green-300 hover:from-green-100 hover:to-emerald-200 hover:border-green-500 hover:text-green-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div class="relative flex items-center gap-2 justify-center">
            <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>Change Password</span>
          </div>
        </Button>

        <!-- Manage Users Button - Purple -->
        <Button 
          onClick={() => goto('/admin/users')}
          variant="outline"
          class="group relative overflow-hidden bg-gradient-to-r from-purple-50 to-indigo-100 text-purple-700 border-2 border-purple-300 hover:from-purple-100 hover:to-indigo-200 hover:border-purple-500 hover:text-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div class="relative flex items-center gap-2 justify-center">
            <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>Manage Users</span>
          </div>
        </Button>

        <!-- Sign Out Button - Red -->
        <Button 
          onClick={handleSignOut}
          variant="outline"
          class="group relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-100 text-red-700 border-2 border-red-300 hover:from-red-100 hover:to-pink-200 hover:border-red-500 hover:text-red-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div class="relative flex items-center gap-2 justify-center">
            <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </div>
        </Button>
      </div>
    </div>

    <!-- Success Message -->
    <Card class="mb-8">
      <div class="p-6 text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-blue-800 mb-2">Successfully signed in!</h2>
        <p class="text-blue-600">You are now logged in as an administrator.</p>
      </div>
    </Card>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <div class="p-6 text-center">
          <div class="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
          <div class="text-sm text-gray-600">Total Users</div>
        </div>
      </Card>
      
      <Card>
        <div class="p-6 text-center">
          <div class="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
          <div class="text-sm text-gray-600">Active Users</div>
        </div>
      </Card>
      
      <Card>
        <div class="p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">{stats.adminUsers}</div>
          <div class="text-sm text-gray-600">Admin Users</div>
        </div>
      </Card>
      
      <Card>
        <div class="p-6 text-center">
          <div class="text-3xl font-bold text-orange-600">{stats.clientUsers}</div>
          <div class="text-sm text-gray-600">Client Users</div>
        </div>
      </Card>
    </div>

    <!-- User Management -->
    <Card>
      <div class="p-6">
        <h3 class="text-xl font-semibold mb-4">User Management</h3>
        
        {#if loading}
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Loading users...</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each users as user}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-700">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={user.role}
                        onchange={(e) => updateUserRole(user.id, e.target.value)}
                        class="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteUser(user.id)}
                        class="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </Card>
  </div>
</div>
