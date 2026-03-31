import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDataset, fetchStatus } from '../services/api.js';
import { computeClientDataset, parseDelimitedText } from '../utils/graphProcessing.js';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('Loading Amazon dataset...');
  const [sourceLabel, setSourceLabel] = useState('Amazon backend dataset');
  const pollRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadDataset() {
      try {
        const result = await fetchDataset();
        if (!active) {
          return;
        }
        setDataset(result);
        setSourceLabel(`Default dataset: ${result.dataset_file ?? 'com-amazon.ungraph.txt'}`);
        setStatusMessage('Amazon graph analysis is ready.');
        setError('');
        setLoading(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (datasetError) {
        try {
          const status = await fetchStatus();
          if (!active) {
            return;
          }
          setStatusMessage(status.message || 'Preparing dataset...');
          setLoading(status.state !== 'error');
          setError(status.state === 'error' ? status.message : '');
        } catch {
          if (!active) {
            return;
          }
          setError('Backend dataset unavailable. Start the FastAPI server for com-amazon.ungraph.txt.');
          setLoading(false);
        }
      }
    }

    loadDataset();
    pollRef.current = setInterval(loadDataset, 5000);

    return () => {
      active = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const uploadDataset = async (file) => {
    const text = await file.text();
    const rows = parseDelimitedText(text);
    const computed = computeClientDataset(rows, file.name);
    setDataset(computed);
    setSourceLabel(`Uploaded file: ${file.name}`);
    setStatusMessage('Using uploaded dataset in the browser.');
    setError('');
    setLoading(false);
  };

  const resetToDefault = async () => {
    setLoading(true);
    setStatusMessage('Switching back to com-amazon.ungraph.txt...');
    try {
      const result = await fetchDataset();
      setDataset(result);
      setSourceLabel(`Default dataset: ${result.dataset_file ?? 'com-amazon.ungraph.txt'}`);
      setStatusMessage('Amazon graph analysis is ready.');
      setError('');
    } catch {
      try {
        const status = await fetchStatus();
        setStatusMessage(status.message || 'Preparing dataset...');
        setError(status.state === 'error' ? status.message : '');
      } catch {
        setError('Backend dataset unavailable. Keep using the uploaded dataset.');
      }
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    dataset,
    loading,
    error,
    statusMessage,
    sourceLabel,
    uploadDataset,
    resetToDefault,
  }), [dataset, loading, error, statusMessage, sourceLabel]);

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within DatasetProvider');
  }
  return context;
}
