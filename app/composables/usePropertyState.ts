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

  const MACRO_MAP: Record<string, string[]> = {
    manage_rooms: ['rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete'],
    manage_tenants: ['tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete'],
    manage_payments: ['payments:read', 'payments:create', 'payments:update', 'payments:delete'],
    manage_expenses: ['expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete'],
    view_reports: ['reports:read'],
  }

  // Full access for superadmin/owner. For operators, use the permissions array
  const hasPermission = (permission: string) => {
    if (!activeProperty.value) return false
    // If it doesn't have a permissions array, assume they are owner/superadmin with full access
    if (!activeProperty.value.permissions) return true
    
    const perms = (activeProperty.value.permissions as string[]) || []
    if (perms.includes(permission)) return true

    // Check legacy mapping
    for (const [macro, micros] of Object.entries(MACRO_MAP)) {
      if (micros.includes(permission) && perms.includes(macro)) {
        return true
      }
      if (permission === macro && micros.some(m => perms.includes(m))) {
        return true
      }
    }

    return false
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
