<script lang="ts">
  let { 
    show = $bindable(false),
    errorType = '',
    message = '',
    title = 'Error',
    onClose = () => {},
    position = 'center' // 'center' for full screen, 'inline' for form positioning
  } = $props();

  function handleClose() {
    show = false;
    onClose();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  // Auto close after 8 seconds
  $effect(() => {
    if (show) {
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  });

  function getErrorIcon(type: string) {
    switch (type) {
      case 'EMAIL_NOT_FOUND':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />`;
      case 'WRONG_PASSWORD':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />`;
      case 'ADMIN_APPROVAL_PENDING':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`;
      case 'EMAIL_NOT_VERIFIED':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
      default:
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    }
  }

  function getErrorColor(type: string) {
    switch (type) {
      case 'EMAIL_NOT_FOUND':
        return 'blue';
      case 'WRONG_PASSWORD':
        return 'red';
      case 'ADMIN_APPROVAL_PENDING':
        return 'yellow';
      case 'EMAIL_NOT_VERIFIED':
        return 'orange';
      default:
        return 'red';
    }
  }

  function getErrorTitle(type: string) {
    switch (type) {
      case 'EMAIL_NOT_FOUND':
        return 'Email Not Found';
      case 'WRONG_PASSWORD':
        return 'Incorrect Password';
      case 'ADMIN_APPROVAL_PENDING':
        return 'Admin Approval Pending';
      case 'EMAIL_NOT_VERIFIED':
        return 'Email Not Verified';
      default:
        return 'Login Error';
    }
  }
</script>

{#if show}
  {#if position === 'center'}
    <!-- Full Screen Modal -->
    <div 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onclick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full transform scale-100 transition-all duration-300 animate-in zoom-in-95">
        <!-- Header -->
        <div class="bg-gradient-to-r from-{getErrorColor(errorType)}-500 to-{getErrorColor(errorType)}-600 rounded-t-3xl p-6 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12"></div>
          
          <div class="relative z-10 flex items-center space-x-4">
            <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {@html getErrorIcon(errorType)}
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold">{getErrorTitle(errorType)}</h3>
              <p class="text-white/80 text-sm">Please check the details below</p>
            </div>
          </div>
          
          <button 
            onclick={handleClose}
            class="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            aria-label="Close"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <div class="text-gray-700 leading-relaxed">{message}</div>
          
          <!-- Helpful actions -->
          <div class="space-y-3">
            {#if errorType === 'EMAIL_NOT_FOUND'}
              <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p class="text-blue-800 font-medium text-sm mb-2">💡 Helpful Tips:</p>
                <ul class="text-blue-700 text-sm space-y-1">
                  <li>• Double-check your email spelling</li>
                  <li>• Try a different email address</li>
                  <li>• <a href="/signup" class="underline hover:text-blue-900">Create a new account</a></li>
                </ul>
              </div>
            {:else if errorType === 'WRONG_PASSWORD'}
              <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p class="text-red-800 font-medium text-sm mb-2">💡 Helpful Tips:</p>
                <ul class="text-red-700 text-sm space-y-1">
                  <li>• Check your caps lock key</li>
                  <li>• Try typing your password again</li>
                  <li>• <a href="/forgot-password" class="underline hover:text-red-900">Reset your password</a></li>
                </ul>
              </div>
            {:else if errorType === 'ADMIN_APPROVAL_PENDING'}
              <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p class="text-yellow-800 font-medium text-sm mb-2">⏳ What's Next:</p>
                <ul class="text-yellow-700 text-sm space-y-1">
                  <li>• Your admin application is under review</li>
                  <li>• You'll receive email notification when approved</li>
                  <li>• Contact support if you have questions</li>
                </ul>
              </div>
            {:else if errorType === 'EMAIL_NOT_VERIFIED'}
              <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <p class="text-orange-800 font-medium text-sm mb-2">📧 Email Verification Required:</p>
                <ul class="text-orange-700 text-sm space-y-1">
                  <li>• Check your email inbox for verification code</li>
                  <li>• Check spam/junk folder if needed</li>
                  <li>• <a href="/verify-email" class="underline hover:text-orange-900">Enter verification code</a></li>
                </ul>
              </div>
            {/if}
          </div>

          <div class="flex justify-end pt-4">
            <button 
              onclick={handleClose}
              class="bg-gradient-to-r from-{getErrorColor(errorType)}-500 to-{getErrorColor(errorType)}-600 hover:from-{getErrorColor(errorType)}-600 hover:to-{getErrorColor(errorType)}-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Inline Form Popup -->
    <div class="relative z-10 mb-4">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full transform scale-100 transition-all duration-300 animate-in slide-in-from-top-2">
        <!-- Compact Header -->
        <div class="bg-gradient-to-r from-{getErrorColor(errorType)}-500 to-{getErrorColor(errorType)}-600 rounded-t-2xl p-4 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-12 -translate-y-12"></div>
          
          <div class="relative z-10 flex items-center space-x-3">
            <div class="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {@html getErrorIcon(errorType)}
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold">{getErrorTitle(errorType)}</h3>
            </div>
          </div>
          
          <button 
            onclick={handleClose}
            class="absolute top-3 right-3 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            aria-label="Close"
          >
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Compact Content -->
        <div class="p-4 space-y-3">
          <div class="text-gray-700 text-sm leading-relaxed">{message}</div>
          
          <!-- Compact helpful actions -->
          {#if errorType === 'EMAIL_NOT_FOUND'}
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p class="text-blue-800 font-medium text-xs mb-1">💡 Tips:</p>
              <ul class="text-blue-700 text-xs space-y-1">
                <li>• Check email spelling or <a href="/signup" class="underline">sign up</a></li>
              </ul>
            </div>
          {:else if errorType === 'WRONG_PASSWORD'}
            <div class="bg-red-50 border border-red-200 rounded-xl p-3">
              <p class="text-red-800 font-medium text-xs mb-1">💡 Tips:</p>
              <ul class="text-red-700 text-xs space-y-1">
                <li>• Check caps lock or <a href="/forgot-password" class="underline">reset password</a></li>
              </ul>
            </div>
          {:else if errorType === 'ADMIN_APPROVAL_PENDING'}
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p class="text-yellow-800 font-medium text-xs mb-1">⏳ Status:</p>
              <p class="text-yellow-700 text-xs">Your admin application is under review</p>
            </div>
          {:else if errorType === 'EMAIL_NOT_VERIFIED'}
            <div class="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p class="text-orange-800 font-medium text-xs mb-1">📧 Action:</p>
              <p class="text-orange-700 text-xs">Check your email or <a href="/verify-email" class="underline">verify now</a></p>
            </div>
          {/if}

          <div class="flex justify-end pt-2">
            <button 
              onclick={handleClose}
              class="bg-gradient-to-r from-{getErrorColor(errorType)}-500 to-{getErrorColor(errorType)}-600 hover:from-{getErrorColor(errorType)}-600 hover:to-{getErrorColor(errorType)}-700 text-white font-semibold px-4 py-2 text-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  @keyframes animate-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slide-in-from-top {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-in {
    animation: animate-in 0.3s ease-out;
  }

  .slide-in-from-top-2 {
    animation: slide-in-from-top 0.3s ease-out;
  }
</style>