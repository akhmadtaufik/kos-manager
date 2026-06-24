export const usePropertyState = () => {
  const properties = useState<any[]>('user_properties', () => [])
  const activePropertyId = useState<string | null>('active_property_id', () => null)
  const isLoaded = useState<boolean>('property_state_loaded', () => false)
  const isLoading = useState<boolean>('property_state_loading', () => false)

  const loadProperties = async (force: boolean = false) => {
    if (isLoaded.value && !force) return
    isLoading.value = true
    try {
      const res = await $fetch<any>('/api/properties')
      if (res.status === 'success') {
        properties.value = res.data?.data || res.data || []
        // Auto-select the first property if none is selected
        if (!activePropertyId.value && properties.value.length > 0) {
          activePropertyId.value = properties.value[0].id
        }
      }
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load properties', e)
    } finally {
      isLoading.value = false
    }
  }

  const setActiveProperty = (id: string | null) => {
    activePropertyId.value = id
  }

  const activeProperty = computed(() => {
    if (!activePropertyId.value) return null
    return properties.value.find(p => p.id === activePropertyId.value) || null
  })

  // Full access for superadmin/owner. For operators, use the permissions array
  const hasPermission = (permission: string) => {
    if (!activeProperty.value) return false
    // If it doesn't have a permissions array, assume they are owner/superadmin with full access
    if (!activeProperty.value.permissions) return true
    return activeProperty.value.permissions.includes(permission)
  }

  return {
    properties,
    activePropertyId,
    activeProperty,
    isLoaded,
    isLoading,
    loadProperties,
    setActiveProperty,
    hasPermission
  }
}
