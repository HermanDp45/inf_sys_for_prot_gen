import React, { useMemo } from 'react';

const MolStarViewer = ({ pdbUrl, label }) => {
  const viewerUrl = useMemo(() => {
    if (!pdbUrl) {
      return '';
    }

    const params = new URLSearchParams({
      'hide-controls': '0',
      'collapse-left-panel': '1',
      'show-toggle-fullscreen': '1',
      'structure-url': pdbUrl,
      'structure-url-format': 'pdb',
      'structure-url-is-binary': '0',
      'illumination': '1',
      'pixel-scale': '1',
      'pick-scale': '0.35',
      'power-preference': 'high-performance',
      'resolution-mode': 'auto',
    });

    return `/molstar/index.html?${params.toString()}`;
  }, [pdbUrl]);

  if (!viewerUrl) {
    return (
      <div className="molstar-shell empty">
        <span>PDB-файл не найден</span>
      </div>
    );
  }

  return (
    <div className="molstar-shell">
      <iframe
        className="molstar-frame"
        src={viewerUrl}
        title={label ? `Mol* viewer: ${label}` : 'Mol* structure viewer'}
        allow="fullscreen"
      />
    </div>
  );
};

export default MolStarViewer;
