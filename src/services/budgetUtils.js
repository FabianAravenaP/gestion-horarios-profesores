import { DURACION_BLOQUE_H } from './constants'

/**
 * New budget calculation based on HORAS.xlsx requirements.
 * 1. Surplus (excedentes) are chronological (60m). Convert to pedagogical (45m) factor 1.33.
 * 2. Non-teaching (no lectivas) are the second pool.
 */
export const getDetailedBudget = (excedentes, noLectivas) => {
  // 1 hour (60m) = 1.3333 blocks (45m each) -> factor is 4/3, floor correctly applies the 24 blocks limit to 18.5 hours
  const surplusPedagogical = Math.floor((excedentes || 0) * (4/3))
  const nonTeaching = noLectivas || 0
  
  return {
    surplus: surplusPedagogical,
    noLectivas: parseFloat(nonTeaching || 0),
    total: surplusPedagogical + parseFloat(nonTeaching || 0)
  }
}

// Legacy support for other parts of the app if needed
export const getBaseCoverageBudget = (contractHours, assignedClassesCount) => {
  if (!contractHours) return 0
  const maxLectiva = Math.floor((contractHours / 44) * 38)
  return Math.max(0, maxLectiva - assignedClassesCount)
}

export function calculateTeacherUsage(teacherId, schedules, coverages) {
  // Now only coverages count against the budget (which is derived from available slots)
  // We only count coverages that haven't been "accounted for" (contabilizada = false)
  const coverageUsage = coverages
    .filter(c => c.profesor_reemplazante_id === teacherId && c.estado !== 'cancelada' && c.tipo === 'cobertura' && !c.contabilizada)
    .length

  return coverageUsage
}

export function formatUsage(blocks) {
  return `${blocks} blq`
}
