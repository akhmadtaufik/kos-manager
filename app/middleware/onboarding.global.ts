export default defineNuxtRouteMiddleware((to, from) => {
  const { status, data } = useAuth()
  
  if (status.value === 'authenticated' && data.value?.user) {
    const role = (data.value.user as any).role
    
    // Redirect pending users to onboarding (allow access to /login or /api if somehow hit)
    if (role === 'pending' && to.path !== '/onboarding' && to.path !== '/login') {
      return navigateTo('/onboarding')
    }
    
    // Prevent already onboarded users from accessing onboarding
    if (role !== 'pending' && to.path === '/onboarding') {
      return navigateTo('/dashboard')
    }
  }
})
