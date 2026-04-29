import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import MolStarViewer from './MolStarViewer';
import { API_BASE_URL, proteinApi } from '../utils/api';

const ProteinViewer = () => {
  const { structureId } = useParams();
  const navigate = useNavigate();

  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStructure = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await proteinApi.getById(structureId);
        setStructure(data);
      } catch (apiError) {
        setError(apiError.message || 'Не удалось загрузить структуру');
      } finally {
        setLoading(false);
      }
    };

    loadStructure();
  }, [structureId]);

  const pdbUrl = useMemo(() => {
    if (!structure?.pdb_file_path) {
      return '';
    }

    if (structure.pdb_file_path.startsWith('http')) {
      return structure.pdb_file_path;
    }

    return `${API_BASE_URL}${structure.pdb_file_path}`;
  }, [structure]);

  if (loading) {
    return (
      <div className="screen center">
        <div className="loader" />
        <p>Загрузка структуры...</p>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="screen center">
        <p>{error || 'Структура не найдена'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="screen viewer-screen">
      <header className="topbar">
        <div>
          <h1>{structure.name}</h1>
          <p className="muted">Проект #{structure.project_id} · структура #{structure.id}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/projects/${structure.project_id}`)}>
          К проекту
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <main className="viewer-layout">
        <section className="viewer-main-panel">
          <div className="section-header">
            <h2>3D структура</h2>
            <a className="text-link" href={pdbUrl} target="_blank" rel="noreferrer">
              Открыть PDB
            </a>
          </div>
          <MolStarViewer pdbUrl={pdbUrl} label={structure.name} />
        </section>

        <aside className="viewer-side-panel">
          <section className="compact-panel">
            <h2>Характеристики</h2>
            <div className="metrics-grid">
              <div>
                <span>Realism</span>
                <strong>{structure?.metrics?.realism_score ?? '—'}</strong>
              </div>
              <div>
                <span>pLDDT</span>
                <strong>{structure?.metrics?.pLDDT ?? '—'}</strong>
              </div>
              <div>
                <span>scRMSD</span>
                <strong>{structure?.metrics?.sc_rmsd ?? '—'}</strong>
              </div>
              <div>
                <span>Время</span>
                <strong>{structure?.metrics?.generation_time ?? '—'}</strong>
              </div>
            </div>
          </section>

          <section className="compact-panel">
            <h2>Источник</h2>
            <div className="metric-list">
              <span>{structure?.generation_params?.source === 'upload' ? 'Загруженный PDB' : 'Сгенерировано в проекте'}</span>
              <span>{structure?.created_at ? new Date(structure.created_at).toLocaleString() : '—'}</span>
            </div>
          </section>
        </aside>
      </main>

      <section className="card">
        <h2>Последовательность (FASTA)</h2>
        <pre className="sequence-box">{structure.fasta_sequence || 'Последовательность не найдена'}</pre>
      </section>

      <section className="card">
        <h2>Параметры генерации</h2>
        <pre className="sequence-box">{JSON.stringify(structure.generation_params || {}, null, 2)}</pre>
      </section>
    </div>
  );
};

export default ProteinViewer;
