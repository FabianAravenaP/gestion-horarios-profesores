import React, { useState, useEffect } from 'react';

const ProfessorManager = ({ supabase, profesores, loading, todaySummary, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newProf, setNewProf] = useState({
    nombre: '',
    email: '',
    cargo: '',
    rol: 'profesor',
    horas_excedentes: 0,
    horas_no_lectivas: 0,
    contrato_horas: 30,
    password: '',
    activo: true
  });

  const filteredProfesores = profesores.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cargo && p.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setIsEditing(false);
    setNewProf({
      nombre: '',
      email: '',
      cargo: '',
      rol: 'profesor',
      horas_excedentes: 0,
      horas_no_lectivas: 0,
      contrato_horas: 30,
      password: '',
      activo: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditing(true);
    setNewProf({
      ...p,
      password: '' // Don't show password
    });
    setIsModalOpen(true);
  };

  const handleSaveProfessor = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const { password, ...profData } = newProf;
      
      if (isEditing) {
        // Update professor record
        const { error } = await supabase
          .from('profesores')
          .update({
            nombre: profData.nombre,
            email: profData.email,
            cargo: profData.cargo,
            horas_excedentes: profData.horas_excedentes,
            horas_no_lectivas: profData.horas_no_lectivas,
            contrato_horas: profData.contrato_horas,
            activo: profData.activo
          })
          .eq('id', profData.id);
        
        if (error) throw error;

        // If password provided, update it in auth (requires admin helper if not self, but user asked for this earlier)
        // Note: supabase.auth.admin.updateUserById is the right way but needs service role.
        // For now, we use a custom approach or notify user.
        if (password && password.trim() !== '') {
          const { error: rpcError } = await supabase.rpc('admin_reset_password', {
            target_user_id: profData.id,
            new_password: password
          });
          if (rpcError) throw rpcError;
          console.log("Password reset successful for:", profData.email);
        }
      } else {
        // Create new professor
        const { data, error: insertError } = await supabase
          .from('profesores')
          .insert([{
            nombre: profData.nombre,
            email: profData.email,
            cargo: profData.cargo,
            rol: 'profesor',
            horas_excedentes: profData.horas_excedentes,
            horas_no_lectivas: profData.horas_no_lectivas,
            contrato_horas: profData.contrato_horas,
            activo: true
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;

        // If a password was provided, create the auth user
        // If no password, we should still create one (e.g. "comercial2026") to ensure login works
        const initialPassword = (password && password.trim() !== '') ? password : 'comercial2026';
        
        const { error: rpcError } = await supabase.rpc('admin_reset_password', {
          target_user_id: data.id,
          new_password: initialPassword
        });
        
        if (rpcError) throw rpcError;
        console.log("Auth user created and password set for:", profData.email);
      }

      setIsModalOpen(false);
      onRefresh();
      alert(isEditing ? 'Profesor actualizado' : 'Profesor agregado');
    } catch (err) {
      console.error(err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProfessor = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profesores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      onRefresh();
      alert('Profesor eliminado');
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPasswordDirect = async (id, nombre) => {
    const newPass = prompt(`Nueva contraseña para ${nombre}:`);
    if (!newPass || newPass.trim() === '') return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: id,
        new_password: newPass
      });
      if (error) throw error;
      alert(`Contraseña de ${nombre} actualizada correctamente`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <section className="stats-grid">
        <div className="stat-card">
          <h3>Profesores Activos</h3>
          <p>{profesores.filter(p => p.activo).length}</p>
        </div>
        <div className="stat-card">
          <h3>Reemplazos del Día</h3>
          <div className="summary-list" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-soft)' }}>
            {todaySummary && todaySummary.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {todaySummary.map((s, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>• {s}</li>
                ))}
              </ul>
            ) : (
              <p style={{ opacity: 0.6 }}>Sin reemplazos hoy</p>
            )}
          </div>
        </div>
      </section>

      <section className="admin-actions">
        <div>
          <h2>Gestión de Profesores</h2>
          <div className="search-bar" style={{ marginTop: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Buscar profesor por nombre, email o cargo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px', paddingLeft: '3.5rem' }}
            />
          </div>
        </div>
        <div className="action-buttons">
          <button className="primary" onClick={openAddModal}>+ Agregar Profesor</button>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Editar Profesor' : 'Agregar Nuevo Profesor'}</h3>
              <button className="btn-close" type="button" onClick={() => setIsModalOpen(false)}>Cerrar</button>
            </div>
            <form onSubmit={handleSaveProfessor}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={newProf.nombre} 
                  onChange={e => setNewProf({...newProf, nombre: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Email / Usuario</label>
                <input 
                  type="text" 
                  required 
                  placeholder="nombre.apellido"
                  value={newProf.email} 
                  onChange={e => setNewProf({...newProf, email: e.target.value})} 
                  disabled={isEditing}
                />
              </div>
              <div className="form-group">
                <label>Cargo / Especialidad</label>
                <input 
                  type="text" 
                  value={newProf.cargo} 
                  onChange={e => setNewProf({...newProf, cargo: e.target.value})} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Excedentes (Cronológicas)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={newProf.horas_excedentes} 
                    onChange={e => setNewProf({...newProf, horas_excedentes: parseFloat(e.target.value) || 0})} 
                  />
                  <small style={{ opacity: 0.7 }}>→ ~{Math.floor((newProf.horas_excedentes || 0) * 1.33)} blq pedagógicos</small>
                </div>
                <div className="form-group">
                  <label>Horas No Lectivas</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={newProf.horas_no_lectivas} 
                    onChange={e => setNewProf({...newProf, horas_no_lectivas: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Horas de Contrato (Total)</label>
                <input 
                  type="number" 
                  value={newProf.contrato_horas} 
                  onChange={e => setNewProf({...newProf, contrato_horas: parseInt(e.target.value) || 0})} 
                />
              </div>

              {!isEditing && (
                <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Configuración Inicial</label>
                  <label style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Contraseña de acceso (opcional)</label>
                  <input 
                    type="password" 
                    placeholder="Si se deja vacío será: comercial2026"
                    value={newProf.password} 
                    onChange={e => setNewProf({...newProf, password: e.target.value})} 
                    autoComplete="new-password"
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', opacity: 0.7 }}>
                    El profesor deberá cambiarla en su primer ingreso.
                  </small>
                </div>
              )}

              {isEditing && (
                <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Seguridad</label>
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem' }}>Cambiar Contraseña (Solo si es necesario)</label>
                    <input 
                      type="password" 
                      placeholder="Nueva contraseña..."
                      value={newProf.password} 
                      onChange={e => setNewProf({...newProf, password: e.target.value})} 
                      autoComplete="new-password"
                    />
                    <small style={{ display: 'block', marginTop: '0.25rem', opacity: 0.7 }}>
                      Al guardar, se forzará al profesor a cambiar la clave en su próximo inicio.
                    </small>
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cerrar</button>
                <button type="submit" className="btn-save" disabled={processing}>
                  {processing ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="profesores-list">
        <h2>Lista de Profesores {searchTerm && <small>({filteredProfesores.length} resultados)</small>}</h2>
        {loading ? (
          <p>Cargando lista...</p>
        ) : filteredProfesores.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron profesores que coincidan con "{searchTerm}"</p>
          </div>
        ) : (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Contrato</th>
                <th>Exced. (P)</th>
                <th>No Lect.</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfesores.map(p => (
                <tr key={p.id}>
                  <td data-label="Nombre">{p.nombre}</td>
                  <td data-label="Cargo">{p.cargo || '-'}</td>
                  <td data-label="Contrato" style={{ textAlign: 'center' }}>{p.contrato_horas || 0}</td>
                  <td data-label="Exced. (P)" style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {Math.floor((p.horas_excedentes || 0) * 1.33)}
                  </td>
                  <td data-label="No Lect." style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>
                    {p.horas_no_lectivas || 0}
                  </td>
                  <td data-label="Usuario">{p.email}</td>
                  <td className="table-actions">
                    <button 
                      className="btn-edit" 
                      onClick={() => openEditModal(p)}
                      disabled={processing}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-edit" 
                      style={{ background: 'var(--text-soft)', marginLeft: '0.25rem' }}
                      onClick={() => handleResetPasswordDirect(p.id, p.nombre)}
                      disabled={processing}
                    >
                      Clave
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteProfessor(p.id, p.nombre)}
                      disabled={processing}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
};

export default ProfessorManager;
