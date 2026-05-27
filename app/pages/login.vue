<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated background orbs -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse-soft pointer-events-none" />
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-400/8 rounded-full blur-3xl animate-pulse-soft pointer-events-none" style="animation-delay: 1s" />

    <div class="w-full max-w-md animate-fade-in">
      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-elevated">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">KosManager</h1>
        <p class="text-surface-400 text-sm mt-1">Platform Manajemen Multi-Properti</p>
      </div>

      <!-- Auth Card -->
      <div class="glass-card p-8 border border-surface-700/40">
        <!-- Tab Switcher -->
        <div class="flex rounded-xl bg-surface-800/60 p-1 mb-6">
          <button
            id="tab-login"
            class="flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200"
            :class="activeTab === 'login'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-surface-200'"
            @click="activeTab = 'login'"
          >
            Masuk
          </button>
          <button
            id="tab-register"
            class="flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200"
            :class="activeTab === 'register'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-surface-200'"
            @click="activeTab = 'register'"
          >
            Daftar
          </button>
        </div>

        <!-- Error Alert -->
        <Transition name="fade-slide">
          <div v-if="errorMessage" class="flex items-start gap-3 mb-5 p-3.5 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>

        <!-- LOGIN FORM -->
        <form v-if="activeTab === 'login'" id="login-form" class="space-y-4" novalidate @submit.prevent="handleLogin">
          <div>
            <label class="form-label text-surface-300" for="login-email">Email</label>
            <input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              autocomplete="email"
              placeholder="nama@email.com"
              required
              class="form-input bg-surface-800/80 border-surface-600 text-white placeholder:text-surface-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label class="form-label text-surface-300" for="login-password">Password</label>
            <div class="relative">
              <input
                id="login-password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                required
                class="form-input bg-surface-800/80 border-surface-600 text-white placeholder:text-surface-500 focus:border-brand-500 pr-11"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200 transition-colors"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full mt-2"
          >
            <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{{ isLoading ? 'Memproses...' : 'Masuk' }}</span>
          </button>

          <!-- Divider -->
          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-surface-700" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-surface-800/60 px-3 text-surface-500 backdrop-blur-sm">atau lanjutkan dengan</span>
            </div>
          </div>

          <!-- Google OAuth Button -->
          <button
            id="btn-google-login"
            type="button"
            :disabled="isLoading"
            class="btn-secondary w-full border-surface-600 text-surface-200 hover:bg-surface-700"
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
        </form>

        <!-- REGISTER FORM -->
        <form v-else id="register-form" class="space-y-4" novalidate @submit.prevent="handleRegister">
          <div>
            <label class="form-label text-surface-300" for="reg-name">Nama Lengkap</label>
            <input
              id="reg-name"
              v-model="registerForm.name"
              type="text"
              autocomplete="name"
              placeholder="John Doe"
              required
              class="form-input bg-surface-800/80 border-surface-600 text-white placeholder:text-surface-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label class="form-label text-surface-300" for="reg-email">Email</label>
            <input
              id="reg-email"
              v-model="registerForm.email"
              type="email"
              autocomplete="email"
              placeholder="nama@email.com"
              required
              class="form-input bg-surface-800/80 border-surface-600 text-white placeholder:text-surface-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label class="form-label text-surface-300" for="reg-password">Password</label>
            <input
              id="reg-password"
              v-model="registerForm.password"
              type="password"
              autocomplete="new-password"
              placeholder="Min. 8 karakter, 1 kapital, 1 angka"
              required
              class="form-input bg-surface-800/80 border-surface-600 text-white placeholder:text-surface-500 focus:border-brand-500"
            />
            <p class="text-xs text-surface-500 mt-1">Minimal 8 karakter, 1 huruf kapital, 1 angka</p>
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full mt-2"
          >
            <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{{ isLoading ? 'Memproses...' : 'Buat Akun' }}</span>
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-surface-600 mt-6">
        © {{ new Date().getFullYear() }} KosManager. All rights reserved.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false,
  layout: false,
})

useHead({
  title: 'Login — KosManager',
  meta: [
    { name: 'description', content: 'Masuk ke KosManager untuk mengelola properti kos Anda.' },
  ],
})

const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()

// ─── State ────────────────────────────────────────────────
const activeTab = ref<'login' | 'register'>('login')
const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ name: '', email: '', password: '' })

// Clear error when switching tabs or editing fields
watch(activeTab, () => { errorMessage.value = '' })
watch(loginForm, () => { errorMessage.value = '' })
watch(registerForm, () => { errorMessage.value = '' })

// ─── Handlers ─────────────────────────────────────────────
async function handleLogin() {
  if (!loginForm.email || !loginForm.password) {
    errorMessage.value = 'Email dan password wajib diisi.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await signIn('credentials', {
      email: loginForm.email,
      password: loginForm.password,
      redirect: false,
    })

    if (result?.error) {
      errorMessage.value = result.error === 'CredentialsSignin'
        ? 'Email atau password salah.'
        : result.error
      return
    }

    // Redirect to intended page or dashboard
    const callbackUrl = route.query.callbackUrl as string || '/dashboard'
    await router.push(callbackUrl)
  } catch (err: any) {
    errorMessage.value = err?.message || 'Terjadi kesalahan. Coba lagi.'
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleLogin() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await signIn('google', { callbackUrl: '/dashboard' })
  } catch (err: any) {
    errorMessage.value = 'Gagal masuk dengan Google. Coba lagi.'
    isLoading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.name || !registerForm.email || !registerForm.password) {
    errorMessage.value = 'Semua field wajib diisi.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

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
  } catch (err: any) {
    const detail = err?.data?.data?.details
    if (detail) {
      const firstError = Object.values(detail)[0] as string[]
      errorMessage.value = firstError?.[0] || 'Validasi gagal.'
    } else {
      errorMessage.value = err?.data?.statusMessage || err?.message || 'Pendaftaran gagal.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
