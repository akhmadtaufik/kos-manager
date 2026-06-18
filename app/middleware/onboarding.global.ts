export default defineNuxtRouteMiddleware((to, from) => {
  const { status, data } = useAuth()
  
  if (status.value === 'authenticated' && data.value?.user) {
    const role = (data.value.user as any).role
    
    // Redirect pending users to onboarding (allow access to /api if somehow hit)
    if (role === 'pending' && to.path !== '/onboarding') {
      return navigateTo('/onboarding')
    }
    
    // Prevent already onboarded users from accessing onboarding
    if (role !== 'pending' && to.path === '/onboarding') {
      return navigateTo('/dashboard')
    }
  }
})
