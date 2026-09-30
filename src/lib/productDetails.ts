export interface ProductDetails {
  summary: string
  about?: string
  traditional_use?: string
  suitable_for?: string
  material?: string
  type_variety?: string
  origin?: string
  bead_size?: string
  mukhi?: string
  colour?: string
  grade?: string
  certification?: string
  care_instructions?: string
  wholesale_notes?: string
}

export function parseProductDetails(description: string | null | undefined): ProductDetails {
  if (!description) {
    return { summary: '' }
  }

  const trimmed = description.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          summary: parsed.summary || parsed.about || '',
          about: parsed.about || '',
          traditional_use: parsed.traditional_use || '',
          suitable_for: parsed.suitable_for || '',
          material: parsed.material || '',
          type_variety: parsed.type_variety || '',
          origin: parsed.origin || '',
          bead_size: parsed.bead_size || '',
          mukhi: parsed.mukhi || '',
          colour: parsed.colour || '',
          grade: parsed.grade || '',
          certification: parsed.certification || '',
          care_instructions: parsed.care_instructions || '',
          wholesale_notes: parsed.wholesale_notes || '',
        }
      }
    } catch {
      // Fallback to plain text
    }
  }

  return {
    summary: description,
    about: description,
    traditional_use: '',
    suitable_for: 'Spiritual retail stores, Japa meditation practice, Mala makers & Resellers',
    care_instructions: 'Keep away from moisture, harsh perfumes and chemical detergents. Clean gently with a soft dry cotton cloth.',
    wholesale_notes: 'Standard export grade packaging with bubble wrap protection. Bulk carton dispatch available.',
  }
}

export function serializeProductDetails(details: ProductDetails): string {
  return JSON.stringify(details)
}
