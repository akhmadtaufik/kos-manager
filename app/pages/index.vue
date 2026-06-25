<template>
  <div class="min-h-[100dvh] flex flex-col md:flex-row bg-surface-50 dark:bg-surface-950 font-sans">
    
    <!-- LEFT: Brand Showcase -->
    <div class="relative hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between p-8 lg:p-12 xl:p-16 bg-surface-950 overflow-hidden text-white">
      <!-- Subtle Background Pattern / Noise -->
      <div class="absolute inset-0 pointer-events-none opacity-20" style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 24px 24px;"></div>
      
      <!-- Brand Top -->
      <div class="relative z-10 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span class="font-bold text-xl tracking-tight font-sans">KosManager</span>
      </div>

      <!-- Hero Message -->
      <div class="relative z-10 max-w-lg mt-auto mb-auto">
        <h1 class="text-4xl lg:text-5xl font-sans tracking-tighter leading-[1.1] mb-6">
          Property management, <span class="text-surface-400">automated and refined.</span>
        </h1>
        <p class="text-surface-400 text-lg leading-relaxed max-w-[45ch]">
          A modern platform to streamline billing, track rooms, and elevate the tenant experience across all your properties.
        </p>
      </div>

      <!-- Bento Grid Minimal (Bottom left) -->
      <div class="relative z-10 grid grid-cols-2 gap-4 max-w-lg mt-auto">
        <div class="p-5 rounded-2xl bg-surface-900 border border-surface-800">
          <div class="text-brand-400 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 class="font-medium text-white mb-1 font-sans">Automated Billing</h3>
          <p class="text-sm text-surface-500">Zero-touch invoicing and payment collection.</p>
        </div>
        <div class="p-5 rounded-2xl bg-surface-900 border border-surface-800">
          <div class="text-brand-400 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 class="font-medium text-white mb-1 font-sans">Room Tracking</h3>
          <p class="text-sm text-surface-500">Real-time occupancy and maintenance status.</p>
        </div>
      </div>
    </div>

    <!-- RIGHT: Auth Panel -->
    <div class="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white dark:bg-surface-950 relative">
      
      <!-- Mobile Logo (Hidden on desktop) -->
      <div class="md:hidden flex items-center justify-center gap-3 mb-10">
        <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span class="font-bold text-xl tracking-tight text-surface-900 dark:text-white font-sans">KosManager</span>
      </div>

      <div class="w-full max-w-[400px] mx-auto">
        <!-- Tab Switcher -->
        <div class="flex gap-6 mb-8 border-b border-surface-200 dark:border-surface-800 pb-px">
          <button
            id="tab-login"
            class="pb-3 text-sm font-medium transition-colors relative font-sans"
            :class="activeTab === 'login' ? 'text-surface-900 dark:text-white' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-300'"
            @click="activeTab = 'login'"
          >
            Sign In
            <div v-if="activeTab === 'login'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-900 dark:bg-white rounded-t-full"></div>
          </button>
          <button
            id="tab-register"
            class="pb-3 text-sm font-medium transition-colors relative font-sans"
            :class="activeTab === 'register' ? 'text-surface-900 dark:text-white' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-300'"
            @click="activeTab = 'register'"
          >
            Create Account
            <div v-if="activeTab === 'register'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-900 dark:bg-white rounded-t-full"></div>
          </button>
        </div>

        <h2 class="text-2xl font-bold tracking-tight text-surface-900 dark:text-white mb-2 font-sans">
          {{ activeTab === 'login' ? 'Welcome back' : 'Start your journey' }}
        </h2>
        <p class="text-surface-500 text-sm mb-8 font-sans">
          {{ activeTab === 'login' ? 'Enter your details to access your dashboard.' : 'Sign up to modernize your property management.' }}
        </p>

        <!-- Error Alert removed, using Toast instead -->

        <!-- LOGIN FORM -->
        <form v-if="activeTab === 'login'" class="space-y-5" novalidate @submit.prevent="handleLogin">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 font-sans" for="login-email">Email</label>
            <input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              required
              class="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow font-sans"
              :class="{ 'border-danger-500 focus:ring-danger-500/20': loginFieldErrors.email && loginForm.email }"
            />
            <p v-if="loginFieldErrors.email && loginForm.email" class="text-xs text-danger-500 font-sans">{{ loginFieldErrors.email }}</p>
          </div>
          
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300 font-sans" for="login-password">Password</label>
              <a href="#" class="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-sans">Forgot?</a>
            </div>
            <div class="relative">
              <input
                id="login-password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                required
                class="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow pr-11 font-sans"
                :class="{ 'border-danger-500 focus:ring-danger-500/20': loginFieldErrors.password && loginForm.password }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
            <p v-if="loginFieldErrors.password && loginForm.password" class="text-xs text-danger-500 font-sans mt-1">{{ loginFieldErrors.password }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-medium hover:bg-surface-800 dark:hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-surface-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 font-sans"
          >
            <svg v-if="isLoading" class="w-4 h-4 animate-spin text-current opacity-70" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form v-else class="space-y-5" novalidate @submit.prevent="handleRegister">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 font-sans" for="reg-name">Full Name</label>
            <input
              id="reg-name"
              v-model="registerForm.name"
              type="text"
              autocomplete="name"
              placeholder="Jane Doe"
              required
              class="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow font-sans"
              :class="{ 'border-danger-500 focus:ring-danger-500/20': registerFieldErrors.name && registerForm.name }"
            />
            <p v-if="registerFieldErrors.name && registerForm.name" class="text-xs text-danger-500 font-sans mt-1">{{ registerFieldErrors.name }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 font-sans" for="reg-email">Email</label>
            <input
              id="reg-email"
              v-model="registerForm.email"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              required
              class="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow font-sans"
              :class="{ 'border-danger-500 focus:ring-danger-500/20': registerFieldErrors.email && registerForm.email }"
            />
            <p v-if="registerFieldErrors.email && registerForm.email" class="text-xs text-danger-500 font-sans mt-1">{{ registerFieldErrors.email }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300 font-sans" for="reg-password">Password</label>
            <input
              id="reg-password"
              v-model="registerForm.password"
              type="password"
              autocomplete="new-password"
              placeholder="Min. 8 characters"
              required
              class="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow font-sans"
              :class="{ 'border-danger-500 focus:ring-danger-500/20': registerFieldErrors.password && registerForm.password }"
            />
            <p v-if="registerFieldErrors.password && registerForm.password" class="text-xs text-danger-500 font-sans mt-1">{{ registerFieldErrors.password }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-medium hover:bg-surface-800 dark:hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-surface-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 font-sans"
          >
            <svg v-if="isLoading" class="w-4 h-4 animate-spin text-current opacity-70" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{{ isLoading ? 'Creating account...' : 'Create Account' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t border-surface-200 dark:border-surface-800"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-surface-950 text-surface-500 font-sans">Or continue with</span>
          </div>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-surface-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 font-sans"
          @click="handleGoogleLogin"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { loginSchema, registerSchema } from '../../utils/validations'

definePageMeta({
  auth: false,
  layout: false,
  middleware: [
    function (to, from) {
      const { status } = useAuth()
      if (status.value === 'authenticated') {
        return navigateTo('/dashboard')
      }
    }
  ]
})

useHead({
  title: 'KosManager — Property Management Automated',
  meta: [
    { name: 'description', content: 'Sign in to KosManager to streamline billing, track rooms, and elevate the tenant experience.' },
  ],
})

const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

// ─── State ────────────────────────────────────────────────
const activeTab = ref<'login' | 'register'>('login')
const isLoading = ref(false)
const showPassword = ref(false)

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ name: '', email: '', password: '' })

const loginFieldErrors = ref<Record<string, string>>({})
const registerFieldErrors = ref<Record<string, string>>({})

// Clear error when switching tabs or editing fields
watch(loginForm, (newVal) => {
  const result = loginSchema.safeParse(newVal)
  if (!result.success) {
    const errs: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      const key = issue.path[0] as string
      if (!errs[key]) errs[key] = issue.message
    })
    loginFieldErrors.value = errs
  } else {
    loginFieldErrors.value = {}
  }
}, { deep: true })

watch(registerForm, (newVal) => {
  const result = registerSchema.safeParse(newVal)
  if (!result.success) {
    const errs: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      const key = issue.path[0] as string
      if (!errs[key]) errs[key] = issue.message
    })
    registerFieldErrors.value = errs
  } else {
    registerFieldErrors.value = {}
  }
}, { deep: true })

// ─── Handlers ─────────────────────────────────────────────
async function handleLogin() {
  const parsed = loginSchema.safeParse(loginForm)
  if (!parsed.success) {
    addToast('Validasi Gagal', 'Please correct the highlighted fields before continuing.', 'error')
    return
  }

  isLoading.value = true

  try {
    const result = await signIn('credentials', {
      email: loginForm.email,
      password: loginForm.password,
      redirect: false,
    })

    if (result?.error) {
      const msg = result.error === 'CredentialsSignin'
        ? 'Invalid email or password.'
        : result.error
      addToast('Gagal', msg, 'error')
      return
    }

    // Redirect to intended page or dashboard
    const callbackUrl = route.query.callbackUrl as string || '/dashboard'
    addToast('Berhasil Login', 'Selamat datang kembali.', 'success')
  } catch (err: any) {
    addToast('Gagal', err?.message || 'An error occurred. Please try again.', 'error')
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleLogin() {
  isLoading.value = true
  try {
    await signIn('google', { callbackUrl: '/dashboard' })
  } catch (err: any) {
    addToast('Gagal', 'Failed to sign in with Google. Please try again.', 'error')
    isLoading.value = false
  }
}

async function handleRegister() {
  const parsed = registerSchema.safeParse(registerForm)
  if (!parsed.success) {
    addToast('Validasi Gagal', 'Please correct the highlighted fields before continuing.', 'error')
    return
  }

  isLoading.value = true

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: registerForm,
    })

    // Auto login after successful registration
    await signIn('credentials', {
      email: registerForm.email,
      password: registerForm.password,
      redirect: false,
    })

    await router.push('/dashboard')
    addToast('Pendaftaran Berhasil', 'Akun Anda telah dibuat.', 'success')
  } catch (err: any) {
    // Universal Error Wrapper nests the validation errors under err.data.errors
    const detail = err?.data?.errors
    if (detail) {
      // Assuming detail is an object of field -> string[] errors
      const firstError = Object.values(detail)[0] as string[]
      addToast('Pendaftaran Gagal', firstError?.[0] || 'Validation failed.', 'error')
    } else {
      addToast('Pendaftaran Gagal', err?.data?.message || err?.message || 'Registration failed.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
