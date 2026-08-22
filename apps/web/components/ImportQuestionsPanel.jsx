'use client';

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RefreshCcw, Upload } from 'lucide-react';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const parseError = async (response) => {
  try {
    const payload = await response.json();
    return payload.message || 'Request failed.';
  } catch {
    return 'Request failed.';
  }
};

export default function ImportQuestionsPanel() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const downloadTemplate = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/questions/import/template`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await parseError(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mcq-import-template.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Template downloaded successfully.');
    } catch (error) {
      setMessage(error.message || 'Could not download the template.');
    } finally {
      setBusy(false);
    }
  };

  const validateFile = async () => {
    if (!file) {
      setMessage('Choose an Excel or CSV file before validating.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${API_URL}/questions/import/validate`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Validation failed.');
      const result = payload.data || {};
      setPreview({
        totalRows: Number(result.totalRows || 0),
        validRows: Number(result.validRows || 0),
        invalidRows: Number(result.invalidRows || 0),
        rows: Array.isArray(result.rows) ? result.rows : [],
        errors: Array.isArray(result.errors) ? result.errors : [],
      });
      setImportSummary(null);
      setMessage(
        result.invalidRows
          ? `${result.validRows} valid rows and ${result.invalidRows} invalid rows were detected.`
          : `${result.validRows} valid rows are ready for import.`
      );
    } catch (error) {
      setMessage(error.message || 'Could not validate the file.');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const importValidatedRows = async () => {
    if (!preview || !preview.rows.length) {
      setMessage('Validation must succeed before importing questions.');
      return;
    }
    if (preview.invalidRows > 0) {
      setMessage('Fix invalid rows before final import.');
      return;
    }

    setImporting(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/questions/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validatedRows: preview.rows }),
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Import failed.');
      setImportSummary({
        importedCount: payload.data?.importedCount || 0,
        message: payload.message || 'Import finished.',
      });
      setPreview(null);
      setFile(null);
      setMessage(payload.message || 'Questions imported successfully.');
    } catch (error) {
      setMessage(error.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">QUESTION BANK</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Import questions</h1>
          <p className="mt-2 text-sm text-base-content/60">
            Download the template, validate uploaded rows, then import only confirmed data.
          </p>
        </div>
        <button onClick={downloadTemplate} disabled={busy} className="btn btn-outline btn-primary">
          <Download size={16} /> Download template
        </button>
      </div>

      <div className="mt-6 rounded-box border border-base-300 bg-base-100 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="btn btn-primary cursor-pointer">
            <Upload size={16} /> Select Excel / CSV
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <span className="text-sm text-base-content/70">
            {file ? file.name : 'No file selected yet'}
          </span>
          <button onClick={validateFile} disabled={busy || !file} className="btn btn-secondary">
            <RefreshCcw size={16} /> Validate
          </button>
          <button
            onClick={importValidatedRows}
            disabled={importing || !preview || preview.invalidRows > 0 || !preview.rows.length}
            className="btn btn-primary"
          >
            <FileSpreadsheet size={16} /> Import
          </button>
        </div>

        {message && (
          <div className={`mt-4 flex items-center gap-2 rounded-box border p-3 text-sm ${message.includes('success') || message.includes('ready') ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
            {message.includes('success') || message.includes('ready') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{message}</span>
          </div>
        )}
      </div>

      {importSummary && (
        <div className="mt-6 rounded-box border border-success/30 bg-success/10 p-4 text-success">
          <b className="block">Import summary</b>
          <span>{importSummary.message}</span>
        </div>
      )}

      {preview && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-box border border-base-300 bg-base-100 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/50">Total rows</p>
            <b className="mt-2 block text-3xl">{preview.totalRows}</b>
          </div>
          <div className="rounded-box border border-success/30 bg-success/10 p-4 text-success">
            <p className="text-xs uppercase tracking-[0.2em]">Valid rows</p>
            <b className="mt-2 block text-3xl">{preview.validRows}</b>
          </div>
          <div className="rounded-box border border-error/30 bg-error/10 p-4 text-error">
            <p className="text-xs uppercase tracking-[0.2em]">Invalid rows</p>
            <b className="mt-2 block text-3xl">{preview.invalidRows}</b>
          </div>
        </div>
      )}

      {preview && preview.errors.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Excel row</th>
                <th>Field</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {preview.errors.map((error, index) => (
                <tr key={`${error.excelRowNumber}-${error.field}-${index}`}>
                  <td>Row {error.excelRowNumber}</td>
                  <td>{error.field || 'Question'}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
