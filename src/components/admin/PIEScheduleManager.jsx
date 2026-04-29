import React, { useState, useEffect } from 'react';
import { BLOQUES, DIAS } from '../../services/constants';

// Map tipo_bloque values to human-readable labels
const PIE_BLOCK_TYPES = [
  { value: 'pie_aula',         label: '🏫 En Aula (puede cubrir al titular)', color: '#10b981' },
  { value: 'pie_aula_recursos',label: '🏠 Aula de Recursos',                  color: '#06b6d4' },
  { value: 'pie_recursos',     label: '📚 Sala de Recursos / Retiro',         color: '#6366f1' },
  { value: 'pie_tc',           label: '🤝 Trabajo Colaborativo (T.C.)',        color: '#f97316' },
  { value: 'pie_coordinacion', label: '📋 Planificación / Registro LIRMI',    color: '#f59e0b' },
  { value: 'apoderado',        label: '👨‍👩‍👧 Atención de Apoderados',             color: '#8b5cf6' },
  { value: 'orientacion',      label: '🧭 Orientación (Jefatura - a cubrir)', color: '#ef4444' },
];

const BLOCK_COLOR_MAP = {
  'pie_aula':          { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' },
  'pie_aula_recursos': { bg: 'rgba(6, 182, 212, 0.15)',  border: '#06b6d4', text: '#0891b2' },
  'pie_recursos':      { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#6366f1' },
  'pie_tc':            { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#c2410c' },
  'pie_coordinacion':  { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#b45309' },
  'apoderado':         { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', text: '#7c3aed' },
  'orientacion':       { bg: 'rgba(239, 68, 68, 0.15)',  border: '#ef4444', text: '#b91c1c' },
};

const getBlockLabel = (tipo) => {
  const found = PIE_BLOCK_TYPES.find(t => t.value === tipo);
  return found ? found.label : tipo;
};

const getBlockShortLabel = (block) => {
  if (!block) return '';
  switch (block.tipo_bloque) {
    case 'pie_aula':          return block.curso ? `En Aula\n${block.curso}` : 'En Aula';
    case 'pie_aula_recursos': return block.curso ? `Aula Rec.\n${block.curso}` : 'Aula Rec.';
    case 'pie_recursos':      return 'Sala Rec.';
    case 'pie_tc':            return block.curso ? `T.C.\n${block.curso}` : 'T.C.';
    case 'pie_coordinacion':  return 'Coordinación';
    case 'apoderado':         return 'Apoderados';
    case 'orientacion':       return block.curso ? `Orientación\n${block.curso}` : 'Orientación';
    default:                  return block.tipo_bloque;
  }
};

const PIEScheduleManager = ({ supabase }) => {
  const [pieTeachers, setPieTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null); // { dia, bloqueId, item? }
  const [formData, setFormData] = useState({
    tipo_bloque: 'pie_aula',
    curso: '',
  });
  const [processing, setProcessing] = useState(false);

  // Load PIE teachers on mount
  useEffect(() => {
    fetchPieTeachers();
  }, []);

  // Load schedule when teacher changes
  useEffect(() => {
    if (selectedTeacherId) fetchSchedule();
    else setSchedule([]);
  }, [selectedTeacherId]);

  async function fetchPieTeachers() {
    const { data } = await supabase
      .from('profesores')
      .select('id, nombre, cargo')
      .eq('cargo', 'Profesora Diferencial')
      .eq('activo', true)
      .order('nombre');
    setPieTeachers(data || []);
  }

  async function fetchSchedule() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('profesor_id', selectedTeacherId)
        .order('dia_semana')
        .order('hora_inicio');
      if (error) throw error;
      setSchedule(data || []);
    } finally {
      setLoading(false);
    }
  }

  const getBlockAt = (diaId, bloqueId) => {
    const bloque = BLOQUES.find(b => b.id === bloqueId);
    if (!bloque) return null;
    return schedule.find(h =>
      h.dia_semana === diaId &&
      h.hora_inicio.slice(0, 5) === bloque.inicio.slice(0, 5)
    ) || null;
  };

  const openModal = (diaId, bloqueId, item) => {
    setEditingBlock({ diaId, bloqueId, item });
    setFormData({
      tipo_bloque: item?.tipo_bloque || 'pie_aula',
      curso: item?.curso || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const bloque = BLOQUES.find(b => b.id === editingBlock.bloqueId);
      const payload = {
        profesor_id: selectedTeacherId,
        asignatura_id: null,
        tipo_bloque: formData.tipo_bloque,
        curso: ['pie_aula', 'pie_aula_recursos', 'orientacion', 'pie_tc'].includes(formData.tipo_bloque) ? (formData.curso || null) : null,
        dia_semana: editingBlock.diaId,
        hora_inicio: bloque.inicio,
        hora_fin: bloque.fin,
        // es_disponible_cobertura is handled automatically by the DB trigger
      };

      if (editingBlock.item) {
        const { error } = await supabase.from('horarios').update(payload).eq('id', editingBlock.item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('horarios').insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchSchedule();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!editingBlock?.item) return;
    if (!confirm('¿Eliminar este bloque del horario PIE?')) return;
    setProcessing(true);
    try {
      const { error } = await supabase.from('horarios').delete().eq('id', editingBlock.item.id);
      if (error) throw error;
      setIsModalOpen(false);
      fetchSchedule();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const selectedTeacher = pieTeachers.find(t => t.id === selectedTeacherId);

  // Count in-aula blocks (coverage-eligible)
  const aulaBloques = schedule.filter(h => h.tipo_bloque === 'pie_aula').length;
  const otrosBloques = schedule.filter(h => h.tipo_bloque !== 'pie_aula').length;

  return (
    <section className="horarios-section">
      <div className="planner-header">
        <h2>Horarios PIE</h2>
        <p>
          Ingresa la carga semanal de las profesoras del Programa de Integración Escolar.
          Los bloques <strong>"En Aula"</strong> quedarán disponibles para cubrir al titular si falta.
        </p>
      </div>

      {/* Teacher Selector */}
      <div className="planner-controls" style={{ background: 'var(--bg-soft)', padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group" style={{ maxWidth: '420px' }}>
          <label>Seleccionar Profesora PIE</label>
          <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
            <option value="">Seleccionar profesora...</option>
            {pieTeachers.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {selectedTeacher && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: '140px' }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>Bloques En Aula</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{aulaBloques}</p>
            </div>
            <div className="stat-card" style={{ padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: '140px' }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>Otros Bloques</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{otrosBloques}</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {selectedTeacherId && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {PIE_BLOCK_TYPES.map(t => (
            <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--bg-soft)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem', border: `1px solid ${t.color}` }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
              {t.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--bg-soft)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border)', opacity: 0.6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--border)', flexShrink: 0 }} />
            Sin bloque (clic para agregar)
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      {selectedTeacherId && (
        loading ? (
          <p style={{ opacity: 0.6 }}>Cargando horario...</p>
        ) : (
          <div className="grid-wrapper">
            <table className="schedule-grid">
              <thead>
                <tr>
                  <th>Bloque</th>
                  {DIAS.map(d => <th key={d.id}>{d.nombre}</th>)}
                </tr>
              </thead>
              <tbody>
                {BLOQUES.filter(b => b.id !== 10).map(b => (
                  <tr key={b.id}>
                    <td className="time-col">
                      <span className="block-number">{b.id}°</span>
                      <span className="block-time">{b.inicio.slice(0, 5)} – {b.fin.slice(0, 5)}</span>
                    </td>
                    {DIAS.map(d => {
                      const isFridayEnd = d.id === 5 && b.id > 6;
                      const item = getBlockAt(d.id, b.id);
                      const colors = item ? BLOCK_COLOR_MAP[item.tipo_bloque] : null;

                      return (
                        <td
                          key={d.id}
                          onClick={() => !isFridayEnd && openModal(d.id, b.id, item)}
                          style={{
                            cursor: isFridayEnd ? 'default' : 'pointer',
                            background: isFridayEnd ? 'var(--bg-soft)' : (colors?.bg || 'transparent'),
                            border: item ? `2px solid ${colors?.border}` : '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            minWidth: '100px',
                            transition: 'all 0.15s ease',
                          }}
                          title={item ? getBlockLabel(item.tipo_bloque) : 'Clic para agregar bloque'}
                        >
                          {isFridayEnd ? (
                            <span style={{ opacity: 0.3, fontSize: '0.75rem' }}>—</span>
                          ) : item ? (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors?.text, whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                                {getBlockShortLabel(item)}
                              </div>
                              {item.tipo_bloque === 'pie_aula' && (
                                <div style={{ marginTop: '0.2rem' }}>
                                  <span style={{ fontSize: '0.65rem', background: '#10b981', color: 'white', borderRadius: '999px', padding: '0.1rem 0.4rem' }}>
                                    ✓ Puede cubrir
                                  </span>
                                </div>
                              )}
                              {item.tipo_bloque === 'orientacion' && (
                                <div style={{ marginTop: '0.2rem' }}>
                                  <span style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', borderRadius: '999px', padding: '0.1rem 0.4rem' }}>
                                    ⚠️ Debe cubrirse
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="available-label" style={{ opacity: 0.35, fontSize: '1.2rem' }}>+</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {!selectedTeacherId && (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <p>Selecciona una profesora PIE para ver y editar su horario semanal.</p>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && editingBlock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingBlock.item ? 'Editar' : 'Agregar'} Bloque PIE
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', opacity: 0.7, fontWeight: 400 }}>
                  — {DIAS.find(d => d.id === editingBlock.diaId)?.nombre} · Bloque {editingBlock.bloqueId}° ({BLOQUES.find(b => b.id === editingBlock.bloqueId)?.inicio.slice(0, 5)})
                </span>
              </h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>Cerrar</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Tipo de Bloque</label>
                <select
                  value={formData.tipo_bloque}
                  onChange={e => setFormData({ ...formData, tipo_bloque: e.target.value })}
                >
                  {PIE_BLOCK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Curso field for pie_aula, pie_aula_recursos, orientacion */}
              {['pie_aula', 'pie_aula_recursos', 'orientacion'].includes(formData.tipo_bloque) && (
                <div className="form-group">
                  <label>
                    {formData.tipo_bloque === 'pie_aula' && 'Curso al que acompaña'}
                    {formData.tipo_bloque === 'pie_aula_recursos' && 'Curso (opcional)'}
                    {formData.tipo_bloque === 'orientacion' && 'Curso'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 1A, 2B, 3C..."
                    value={formData.curso}
                    onChange={e => setFormData({ ...formData, curso: e.target.value })}
                  />
                  {formData.tipo_bloque === 'pie_aula' && (
                    <small style={{ color: '#10b981', fontSize: '0.8rem' }}>
                      💡 Este bloque quedará disponible para cubrir al titular si falta.
                    </small>
                  )}
                  {formData.tipo_bloque === 'orientacion' && (
                    <small style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                      💡 Si la profesora PIE falta, este bloque aparecerá para ser cubierto por otro profesor.
                    </small>
                  )}
                </div>
              )}

              {/* Collaborating teacher field for pie_tc */}
              {formData.tipo_bloque === 'pie_tc' && (
                <div className="form-group">
                  <label>Profesor/a con quien colabora</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={formData.curso}
                    onChange={e => setFormData({ ...formData, curso: e.target.value })}
                  />
                  <small style={{ color: '#f97316', fontSize: '0.8rem' }}>
                    💡 Se guardará el nombre del docente con quien realiza el T.C.
                  </small>
                </div>
              )}

              {!['pie_aula', 'pie_aula_recursos', 'orientacion', 'pie_tc'].includes(formData.tipo_bloque) && (
                <div style={{ padding: '0.75rem', background: 'var(--bg-soft)', borderRadius: '0.75rem', fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '1rem' }}>
                  ℹ️ Este tipo de bloque <strong>no estará disponible</strong> para ser cubierto si la profesora falta.
                </div>
              )}

              <div className="modal-actions">
                {editingBlock.item && (
                  <button type="button" className="btn-delete" onClick={handleDelete} disabled={processing}>
                    Eliminar
                  </button>
                )}
                <button type="submit" className="btn-save" disabled={processing}>
                  {processing ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default PIEScheduleManager;
