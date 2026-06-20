export default defineNuxtRouteMiddleware((to, from) => {
  const { data } = useAuth()
  
  const userRole = (data.value?.user as any)?.role
  
  if (userRole === 'operator') {
    return abortNavigation(createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: Operators cannot access this page' 
    }))
  }
})
