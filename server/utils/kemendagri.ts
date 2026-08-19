import kemendagriData from '../data/kemendagri.json'

export interface Province {
  id: string
  name: string
}

export interface Regency {
  id: string
  provinceId: string
  name: string
  type: 'KOTA' | 'KABUPATEN'
}

export interface District {
  id: string
  regencyId: string
  name: string
}

export function getKemendagriProvinces(): Province[] {
  return kemendagriData.provinces as Province[]
}

export function getKemendagriRegencies(provinceId?: string): Regency[] {
  const regencies = kemendagriData.regencies as Regency[]
  if (!provinceId) return regencies
  return regencies.filter(r => r.provinceId === provinceId)
}

export function getKemendagriDistricts(regencyId?: string): District[] {
  const districts = kemendagriData.districts as District[]
  if (!regencyId) return districts
  return districts.filter(d => d.regencyId === regencyId)
}

export function resolveKemendagriLocation(provinceId?: string | null, regencyId?: string | null, districtId?: string | null) {
  const prov = provinceId ? (kemendagriData.provinces as Province[]).find(p => p.id === provinceId) : null
  const reg = regencyId ? (kemendagriData.regencies as Regency[]).find(r => r.id === regencyId) : null
  const dist = districtId ? (kemendagriData.districts as District[]).find(d => d.id === districtId) : null

  return {
    province: prov ? prov.name : null,
    regency: reg ? reg.name : null,
    regencyType: reg ? reg.type : null,
    district: dist ? dist.name : null,
    formattedAddress: [dist?.name, reg?.name, prov?.name].filter(Boolean).join(', ') || '-'
  }
}
