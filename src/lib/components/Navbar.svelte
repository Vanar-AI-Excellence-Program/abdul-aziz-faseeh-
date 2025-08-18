<script lang="ts">
  import { page } from '$app/stores';
  import Button from './ui/Button.svelte';
  import { signOut } from '@auth/sveltekit/client';

  export let session: App.PageData['session'];

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: '/' });
  }
</script>

<nav class="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="flex items-center space-x-2 group">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Auth App</span>
          </a>
        </div>
        <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
          <a
            href="/"
            class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 {$page.url.pathname === '/' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'} border border-transparent"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Home
          </a>
          {#if session?.user}
            <a
              href="/dashboard"
              class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 {$page.url.pathname === '/dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'} border border-transparent"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Dashboard
            </a>
            {#if session.user.role === 'admin'}
              <a
                href="/admin"
                class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 {$page.url.pathname === '/admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'} border border-transparent"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Admin
              </a>
            {/if}
          {/if}
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        {#if session?.user}
          <div class="flex items-center space-x-4">
            <!-- Navigation Links for Logged In Users -->
            <a 
              href="/profile" 
              class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 {$page.url.pathname === '/profile' ? 'text-blue-600 bg-blue-50' : ''}"
            >
              Profile
            </a>
            
            <a 
              href="/change-password" 
              class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 {$page.url.pathname === '/change-password' ? 'text-blue-600 bg-blue-50' : ''}"
            >
              Settings
            </a>

            <!-- Sign Out Button -->
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              class="bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:border-red-400 hover:text-red-700 font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>

            <!-- User Profile Section -->
            <div class="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-full px-4 py-2 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div class="flex items-center space-x-3">
                {#if session.user.image}
                  <img class="h-8 w-8 rounded-full border-2 border-white shadow-sm" src={session.user.image} alt="Profile" />
                {:else}
                  <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <span class="text-white font-medium text-sm">
                      {session.user.name ? session.user.name[0].toUpperCase() : session.user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                {/if}
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-gray-900">
                    {session.user.name || 'User'}
                  </span>
                  <span class="text-xs text-gray-500">{session.user.email}</span>
                </div>
              </div>
              <!-- Role Badge -->
              <div class="ml-2 px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
                {session.user.role}
              </div>
            </div>
          </div>
        {:else}
          <div class="flex items-center space-x-4">
            <a href="/login" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
              Sign in
            </a>
            <a href="/client-signup">
              <Button variant="primary" size="sm" class="bg-sky-400 text-slate-50 border-sky-300 hover:bg-sky-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-2">Sign up</Button>
            </a>
          </div>
        {/if}
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          aria-expanded="false"
          onclick={toggleMenu}
        >
          <span class="sr-only">Open main menu</span>
          <svg
            class="block h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="sm:hidden {isMenuOpen ? 'block' : 'hidden'} bg-white/95 backdrop-blur-md border-t border-gray-200/50">
    <div class="pt-2 pb-3 space-y-1">
      <!-- Home Link -->
      <a
        href="/"
        class="flex items-center px-4 py-3 text-base font-medium transition-all duration-200 {$page.url.pathname === '/' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} border-r-4 border-transparent"
        onclick={closeMenu}
      >
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        Home
      </a>

      {#if session?.user}
        <!-- Dashboard Link for Logged In Users -->
        <a
          href="/dashboard"
          class="flex items-center px-4 py-3 text-base font-medium transition-all duration-200 {$page.url.pathname === '/dashboard' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} border-r-4 border-transparent"
          onclick={closeMenu}
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Dashboard
        </a>

        <!-- Settings Link for Logged In Users -->
        <a
          href="/change-password"
          class="flex items-center px-4 py-3 text-base font-medium transition-all duration-200 {$page.url.pathname === '/change-password' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} border-r-4 border-transparent"
          onclick={closeMenu}
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Settings
        </a>

        <!-- User Profile Section for Mobile -->
        <div class="px-4 py-3 border-t border-gray-200">
          <div class="flex items-center space-x-3">
            {#if session.user.image}
              <img class="h-10 w-10 rounded-full border-2 border-white shadow-sm" src={session.user.image} alt="Profile" />
            {:else}
              <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span class="text-white font-medium text-sm">
                  {session.user.name ? session.user.name[0].toUpperCase() : session.user.email?.[0].toUpperCase()}
                </span>
              </div>
            {/if}
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-gray-900">
                {session.user.name || 'User'}
              </span>
              <span class="text-xs text-gray-500">{session.user.email}</span>
              <span class="text-xs text-blue-600 font-medium">{session.user.role}</span>
            </div>
          </div>
        </div>

        <!-- Sign Out Button for Mobile -->
        <div class="px-4 py-2">
          <Button
            onClick={handleSignOut}
            variant="outline"
            fullWidth
            class="bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:border-red-400 hover:text-red-700 font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border-2"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Button>
        </div>
      {:else}
        <!-- Sign In Link for Non-Logged In Users -->
        <a
          href="/login"
          class="flex items-center px-4 py-3 text-base font-medium transition-all duration-200 {$page.url.pathname === '/login' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} border-r-4 border-transparent"
          onclick={closeMenu}
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Sign In
        </a>

        <!-- Sign Up Link for Non-Logged In Users -->
        <a
          href="/client-signup"
          class="flex items-center px-4 py-3 text-base font-medium transition-all duration-200 {$page.url.pathname === '/client-signup' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} border-r-4 border-transparent"
          onclick={closeMenu}
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Sign Up
        </a>
      {/if}
    </div>
  </div>
</nav>