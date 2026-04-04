import React from 'react';
import { BLOQUES } from '../../services/constants';

const RecentCoveragesTable = ({ coverages, loading }) => {
  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'completada': return <span className="badge success">Completada</span>;
      case 'cancelada': return <span className="badge danger">Cancelada</span>;
      default: return <span className="badge info">Pendiente</span>;
    }
  };

  const sortedCoverages = [...coverages].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="recent-coverages" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Historial Reciente de Reemplazos</h3>
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Mostrando últimos registros</span>
      </div>
      
      {loading ? (
        <p>Cargando registros...</p>
      ) : sortedCoverages.length === 0 ? (
        <p style={{ opacity: 0.6, padding: '1rem' }}>No hay reemplazos registrados recientemente.</p>
      ) : (
        <div className="grid-wrapper">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Bloque</th>
                <th>Profesor Ausente</th>
                <th>Reemplazo</th>
                <th>Curso/Asignatura</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedCoverages.map((cov) => {
                const blockId = BLOQUES.find(b => b.inicio.startsWith(cov.horarios?.hora_inicio?.slice(0,5)))?.id || cov.horarios?.bloque_id;
                return (
                  <tr key={cov.id}>
                    <td data-label="Fecha" style={{ fontWeight: '600' }}>
                      {new Date(cov.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td data-label="Bloque" style={{ textAlign: 'center' }}>
                      {blockId}°
                    </td>
                    <td data-label="Ausente">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{cov.ausente?.nombre || 'Desconocido'}</span>
                      </div>
                    </td>
                    <td data-label="Reemplazo">
                      <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                        {cov.reemplazo?.nombre || 'Sin asignar'}
                      </span>
                    </td>
                    <td data-label="Curso/Asignatura">
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600' }}>{cov.horarios?.curso || '-'}</span>
                        <span style={{ opacity: 0.7 }}>{cov.horarios?.asignaturas?.nombre || 'Administrativo'}</span>
                      </div>
                    </td>
                    <td data-label="Estado" style={{ textAlign: 'center' }}>
                      {getStatusBadge(cov.estado)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentCoveragesTable;
