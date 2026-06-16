import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TenantsPage from '../../app/pages/tenants/index.vue'
import { flushPromises } from '@vue/test-utils'

import { ref } from 'vue'

// Mock the state composable
vi.mock('~/composables/usePropertyState', () => ({
  usePropertyState: () => ({
    activePropertyId: ref('prop-1') // Force property ID so form is visible
  })
}))

// Mock fetch globally
global.$fetch = vi.fn() as any

const DUMMY_REGENCIES = [
  { id: '3171', name: 'KOTA JAKARTA PUSAT' },
  { id: '3172', name: 'KOTA JAKARTA UTARA' }
]

const DUMMY_DISTRICTS = [
  { id: '3171010', name: 'GAMBIR' },
  { id: '3171020', name: 'SAWAH BESAR' }
]

describe('TenantsPage.vue - Cascading Demographics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    ;(global.$fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Mock internal APIs
      if (url.includes('/api/tenants')) return Promise.resolve({ success: true, data: [] })
      if (url.includes('/api/rooms')) return Promise.resolve({ success: true, data: [] })
      
      // Mock external Emsifa APIs
      if (url.includes('regencies/31.json')) return Promise.resolve(DUMMY_REGENCIES)
      if (url.includes('districts/3171.json')) return Promise.resolve(DUMMY_DISTRICTS)
      
      return Promise.resolve([])
    })
  })

  it('1. Initial State: Province has options, Regency & District are disabled', async () => {
    const wrapper = await mountSuspended(TenantsPage)
    await flushPromises() // Wait for initial internal fetches

    const provinceSelect = wrapper.find('#province-select')
    const regencySelect = wrapper.find('#regency-select')
    const districtSelect = wrapper.find('#district-select')

    expect(provinceSelect.exists()).toBe(true)
    expect(regencySelect.exists()).toBe(true)
    expect(districtSelect.exists()).toBe(true)

    // Check province has DKI Jakarta and Jawa Barat
    const provinceOptions = provinceSelect.findAll('option')
    expect(provinceOptions.length).toBeGreaterThan(2) // 1 placeholder + 2 provinces
    expect(provinceSelect.text()).toContain('DKI Jakarta')
    
    // Regency and district should be disabled initially
    expect(regencySelect.element.disabled).toBe(true)
    expect(districtSelect.element.disabled).toBe(true)
  })

  it('2. Cascading Interaction: Province -> Regency', async () => {
    const wrapper = await mountSuspended(TenantsPage)
    await flushPromises()

    const provinceSelect = wrapper.find('#province-select')
    
    // Select Province 31 (DKI Jakarta)
    await provinceSelect.setValue('31')
    
    // Wait for the @change handler and $fetch to resolve
    await flushPromises()

    const regencySelect = wrapper.find('#regency-select')
    
    // Regency should now be enabled and populated
    expect(regencySelect.element.disabled).toBe(false)
    expect(regencySelect.text()).toContain('KOTA JAKARTA PUSAT')
    expect(global.$fetch).toHaveBeenCalledWith(expect.stringContaining('regencies/31.json'))
  })

  it('3. Deep Cascading Interaction: Regency -> District', async () => {
    const wrapper = await mountSuspended(TenantsPage)
    await flushPromises()

    // 1. Select Province
    await wrapper.find('#province-select').setValue('31')
    await flushPromises()

    // 2. Select Regency
    const regencySelect = wrapper.find('#regency-select')
    await regencySelect.setValue('3171')
    await flushPromises()

    const districtSelect = wrapper.find('#district-select')
    
    // District should now be enabled and populated
    expect(districtSelect.element.disabled).toBe(false)
    expect(districtSelect.text()).toContain('GAMBIR')
    expect(global.$fetch).toHaveBeenCalledWith(expect.stringContaining('districts/3171.json'))
  })

  it('4. Edit State Pre-loading', async () => {
    const wrapper = await mountSuspended(TenantsPage)
    await flushPromises()
    
    // Call the internal startEdit method directly
    // @ts-ignore
    await wrapper.vm.startEdit({
      id: 'tenant-1',
      roomId: 'room-1',
      name: 'John Doe',
      phone: '123',
      checkIn: '2026-06-01',
      provinceId: '31',
      regencyId: '3171',
      districtId: '3171010'
    })

    await flushPromises()

    const provinceSelect = wrapper.find<HTMLSelectElement>('#province-select')
    const regencySelect = wrapper.find<HTMLSelectElement>('#regency-select')
    const districtSelect = wrapper.find<HTMLSelectElement>('#district-select')

    // Expect $fetch to be called for both regencies and districts sequentially
    expect(global.$fetch).toHaveBeenCalledWith(expect.stringContaining('regencies/31.json'))
    expect(global.$fetch).toHaveBeenCalledWith(expect.stringContaining('districts/3171.json'))

    // Assert the DOM reflects the bound values and they are no longer disabled
    expect(provinceSelect.element.value).toBe('31')
    expect(regencySelect.element.value).toBe('3171')
    expect(districtSelect.element.value).toBe('3171010')

    expect(regencySelect.element.disabled).toBe(false)
    expect(districtSelect.element.disabled).toBe(false)
  })
})
