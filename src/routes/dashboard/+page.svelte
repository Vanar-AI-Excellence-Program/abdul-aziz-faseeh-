<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';
  import { signOut } from '@auth/sveltekit/client';

  let { data } = $props();
  let { session } = data;

  function handleProfileClick() {
    goto('/profile');
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
  <title>Client Dashboard | Auth App</title>
  <meta name="description" content="Access your personal dashboard with enhanced security features" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <!-- Header -->
       <div class="flex justify-between items-center mb-8">
         <div>
           <h1 class="text-3xl font-bold text-gray-900">Client Dashboard</h1>
           <p class="text-gray-600 mt-2">Welcome back, {session?.user?.name || 'User'}!</p>
         </div>
         
         <div class="grid grid-cols-1 gap-3 max-w-lg">
           <!-- Profile Button - Blue -->
           <Button 
             onClick={handleProfileClick}
             variant="outline"
             class="group relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-500 hover:text-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-4 py-2 font-semibold text-sm"
           >
             <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
             <div class="relative flex items-center gap-2 justify-center">
               <svg class="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
               <span>Profile</span>
             </div>
           </Button>
         </div>
       </div>

      

             <!-- Dashboard Content -->
       <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <!-- Account Information Card -->
         <Card>
           <div class="p-6">
             <h3 class="text-xl font-semibold mb-4">Account Information</h3>
             <div class="space-y-4">
               <div class="flex justify-between items-center py-2 border-b border-gray-200">
                 <span class="text-gray-600 font-medium">Name:</span>
                 <span class="text-gray-900 font-semibold">{session?.user?.name || 'N/A'}</span>
               </div>
               <div class="flex justify-between items-center py-2 border-b border-gray-200">
                 <span class="text-gray-600 font-medium">Email:</span>
                 <span class="text-gray-900 font-semibold">{session?.user?.email || 'N/A'}</span>
               </div>
               <div class="flex justify-between items-center py-2">
                 <span class="text-gray-600 font-medium">Role:</span>
                 <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                   {session?.user?.role || 'client'}
                 </span>
               </div>
             </div>
           </div>
         </Card>

         <!-- Quick Actions Card -->
         <Card>
           <div class="p-6">
             <h3 class="text-xl font-semibold mb-4">Quick Actions</h3>
            
            <!-- Main Features -->
            <div class="mb-8">
              <h4 class="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Main Features
              </h4>
              <div class="grid grid-cols-1 gap-4">
                <!-- AI Chatbot Button - Blue -->
                <Button 
                  onClick={() => goto('/dashboard/chatbot')}
                  variant="outline"
                  class="group relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-500 hover:text-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-lg px-6 py-4 font-semibold text-lg"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div class="relative flex items-center gap-3 justify-center">
                    <svg class="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Start AI Chatbot</span>
                  </div>
                </Button>
              </div>
            </div>

            <!-- Account Settings -->
            <div class="mb-8">
              <h4 class="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Account Settings
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Edit Profile Button - Blue -->
                <Button 
                  onClick={handleProfileClick}
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
                  onClick={() => goto('/profile#password')}
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
          </div>
        </Card>
      </div>
    </div>
  </div>