export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const

export type GenderType = typeof Gender[keyof typeof Gender]

export const GenderLabel: Record<GenderType, string> = {
  [Gender.MALE]: '兄弟',
  [Gender.FEMALE]: '姉妹',
}
