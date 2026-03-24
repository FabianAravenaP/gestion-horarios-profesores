import { supabase } from './supabase'

/**
 * Logs a user activity event to the database.
 * @param {string} profesorId - The UUID of the teacher.
 * @param {string} accion - Simple description of the action (e.g. 'ingreso_plataforma').
 * @param {object} detalles - Extra metadata.
 */
export const logActivity = async (profesorId, accion, detalles = {}) => {
  if (!profesorId) return
  
  try {
    const { error } = await supabase
      .from('actividad_usuarios')
      .insert([
        { 
          profesor_id: profesorId, 
          accion, 
          detalles: {
            ...detalles,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      ])
    if (error) {
      // Silently fail to not interrupt user experience, but log to console in dev
      console.warn('Activity log failed:', error.message)
    }
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}
