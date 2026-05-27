export const usePropertyState = () => {
  const properties = useState<any[]>('user_properties', () => [])
  const activePropertyId = useState<string | null>('active_property_id', () => null)
  const isLoaded = useState<boolean>('property_state_loaded', () => false)

  const loadProperties = async () => {
    if (isLoaded.value) return

    try {
      const res = await $fetch<any>('/api/properties')
      if (res.success) {
        properties.value = res.data
        // Auto-select the first property if none is selected
        if (!activePropertyId.value && res.data.length > 0) {
          activePropertyId.value = res.data[0].id
        }
      }
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load properties', e)
    }
  }

  const setActiveProperty = (id: string | null) => {
    activePropertyId.value = id
  }

  const activeProperty = computed(() => {
    if (!activePropertyId.value) return null
    return properties.value.find(p => p.id === activePropertyId.value) || null
  })

  return {
    properties,
    activePropertyId,
    activeProperty,
    isLoaded,
    loadProperties,
    setActiveProperty
  }
}
