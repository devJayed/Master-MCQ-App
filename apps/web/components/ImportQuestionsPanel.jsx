'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { API_URL } from '../lib/api';
import { useLanguage } from './LanguageProvider';

const text = (language, bn, en) => (language === 'bn' ? bn : en);
const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');

const parseError = async (response) => {
  try {
    const payload = await response.json();
    return payload.message || 'Request failed.';
  } catch {
    return 'Request failed.';
  }
};

export default function ImportQuestionsPanel({ basePath = '/moderator/questions' }) {
  const { language } = useLanguage();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const downloadTemplate = async () => {
    setBusy(true);
    setMessage('');
    setMessageTone('info');
    try {
      const response = await fetch(`${API_URL}/questions/import/template`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await parseError(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'question-bank-import-template.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(
        text(language, 'টেমপ্লেট সফলভাবে ডাউনলোড হয়েছে।', 'Template downloaded successfully.')
      );
      setMessageTone('success');
    } catch (error) {
      setMessage(
        error.message ||
          text(language, 'টেমপ্লেট ডাউনলোড করা যায়নি।', 'Could not download the template.')
      );
      setMessageTone('error');
    } finally {
      setBusy(false);
    }
  };

  const validateFile = async () => {
    if (!file) {
      setMessage(
        text(
          language,
          'যাচাই করার আগে একটি Excel বা CSV ফাইল বেছে নিন।',
          'Choose an Excel or CSV file before validating.'
        )
      );
      setMessageTone('warning');
      return;
    }

    setBusy(true);
    setMessage('');
    setMessageTone('info');
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
          ? text(
              language,
              `${number(result.validRows, language)}টি সঠিক এবং ${number(result.invalidRows, language)}টি ত্রুটিপূর্ণ সারি পাওয়া গেছে।`,
              `${number(result.validRows, language)} valid rows and ${number(result.invalidRows, language)} invalid rows were detected.`
            )
          : text(
              language,
              `${number(result.validRows, language)}টি সঠিক সারি ইমপোর্টের জন্য প্রস্তুত।`,
              `${number(result.validRows, language)} valid rows are ready for import.`
            )
      );
      setMessageTone(result.invalidRows ? 'warning' : 'success');
    } catch (error) {
      setMessage(
        error.message || text(language, 'ফাইলটি যাচাই করা যায়নি।', 'Could not validate the file.')
      );
      setMessageTone('error');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const importValidatedRows = async () => {
    if (!preview || !preview.rows.length) {
      setMessage(
        text(
          language,
          'প্রশ্ন ইমপোর্টের আগে ফাইল যাচাই সফল হতে হবে।',
          'Validation must succeed before importing questions.'
        )
      );
      setMessageTone('warning');
      return;
    }
    if (preview.invalidRows > 0) {
      setMessage(
        text(
          language,
          'চূড়ান্ত ইমপোর্টের আগে ত্রুটিপূর্ণ সারিগুলো ঠিক করুন।',
          'Fix invalid rows before final import.'
        )
      );
      setMessageTone('warning');
      return;
    }

    setImporting(true);
    setMessage('');
    setMessageTone('info');
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
      setMessage(
        text(language, 'প্রশ্নগুলো সফলভাবে ইমপোর্ট হয়েছে।', 'Questions imported successfully.')
      );
      setMessageTone('success');
    } catch (error) {
      setMessage(error.message || text(language, 'ইমপোর্ট ব্যর্থ হয়েছে।', 'Import failed.'));
      setMessageTone('error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-10">
      <Link href={basePath} className="btn btn-ghost btn-sm mb-4 -ml-3">
        <ArrowLeft size={16} />
        {text(language, 'প্রশ্নভাণ্ডারে ফিরুন', 'Back to question bank')}
      </Link>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">
            {text(language, 'প্রশ্নভাণ্ডার', 'QUESTION BANK')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {text(language, 'প্রশ্ন ইমপোর্ট করুন', 'Import questions')}
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            {text(
              language,
              'টেমপ্লেট ডাউনলোড করুন, পূরণ করা সারিগুলো যাচাই করুন, তারপর শুধু নিশ্চিত ডেটা ইমপোর্ট করুন।',
              'Download the template, validate uploaded rows, then import only confirmed data.'
            )}
          </p>
        </div>
        <button onClick={downloadTemplate} disabled={busy} className="btn btn-outline btn-primary">
          {busy ? <span className="loading loading-spinner loading-xs" /> : <Download size={16} />}{' '}
          {text(language, 'টেমপ্লেট ডাউনলোড করুন', 'Download template')}
        </button>
      </div>

      <section className="mt-6 rounded-box border border-base-300 bg-base-100 p-4">
        <div className="mb-4 flex gap-3 rounded-box bg-base-200 p-3 text-sm text-base-content/70">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>
            {text(
              language,
              'ধাপ: টেমপ্লেট পূরণ করুন → ফাইল নির্বাচন করুন → যাচাই করুন → ত্রুটি না থাকলে ইমপোর্ট করুন। .xlsx, .xls ও .csv ফাইল গ্রহণযোগ্য।',
              'Steps: complete the template → select the file → validate it → import when no errors remain. .xlsx, .xls, and .csv files are accepted.'
            )}
          </p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="btn btn-primary cursor-pointer">
            <Upload size={16} /> {text(language, 'Excel / CSV নির্বাচন করুন', 'Select Excel / CSV')}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              aria-label={text(language, 'ইমপোর্ট ফাইল নির্বাচন করুন', 'Choose import file')}
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
                setImportSummary(null);
                setMessage('');
              }}
            />
          </label>
          <span className="text-sm text-base-content/70">
            {file
              ? file.name
              : text(language, 'এখনো কোনো ফাইল নির্বাচন করা হয়নি', 'No file selected yet')}
          </span>
          <button onClick={validateFile} disabled={busy || !file} className="btn btn-secondary">
            {busy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <RefreshCcw size={16} />
            )}{' '}
            {text(language, 'যাচাই করুন', 'Validate')}
          </button>
          <button
            onClick={importValidatedRows}
            disabled={importing || !preview || preview.invalidRows > 0 || !preview.rows.length}
            className="btn btn-primary"
          >
            {importing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FileSpreadsheet size={16} />
            )}{' '}
            {text(language, 'ইমপোর্ট করুন', 'Import')}
          </button>
        </div>

        {message && (
          <div
            role={messageTone === 'error' ? 'alert' : 'status'}
            className={`mt-4 flex items-center gap-2 rounded-box border p-3 text-sm ${messageTone === 'success' ? 'border-success/30 bg-success/10 text-success' : messageTone === 'error' ? 'border-error/30 bg-error/10 text-error' : 'border-warning/30 bg-warning/10 text-warning'}`}
          >
            {messageTone === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{message}</span>
          </div>
        )}
      </section>

      {importSummary && (
        <div className="mt-6 rounded-box border border-success/30 bg-success/10 p-4 text-success">
          <b className="block">{text(language, 'ইমপোর্টের সারসংক্ষেপ', 'Import summary')}</b>
          <span>
            {text(
              language,
              `${number(importSummary.importedCount, language)}টি প্রশ্ন ইমপোর্ট হয়েছে।`,
              `${number(importSummary.importedCount, language)} questions imported.`
            )}
          </span>
        </div>
      )}

      {preview && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-box border border-base-300 bg-base-100 p-4">
            <p className="text-xs tracking-[0.2em] text-base-content/50">
              {text(language, 'মোট সারি', 'TOTAL ROWS')}
            </p>
            <b className="mt-2 block text-3xl">{number(preview.totalRows, language)}</b>
          </div>
          <div className="rounded-box border border-success/30 bg-success/10 p-4 text-success">
            <p className="text-xs tracking-[0.2em]">{text(language, 'সঠিক সারি', 'VALID ROWS')}</p>
            <b className="mt-2 block text-3xl">{number(preview.validRows, language)}</b>
          </div>
          <div className="rounded-box border border-error/30 bg-error/10 p-4 text-error">
            <p className="text-xs tracking-[0.2em]">
              {text(language, 'ত্রুটিপূর্ণ সারি', 'INVALID ROWS')}
            </p>
            <b className="mt-2 block text-3xl">{number(preview.invalidRows, language)}</b>
          </div>
        </div>
      )}

      {preview && preview.errors.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>{text(language, 'Excel সারি', 'Excel row')}</th>
                <th>{text(language, 'ঘর', 'Field')}</th>
                <th>{text(language, 'ত্রুটি', 'Error')}</th>
              </tr>
            </thead>
            <tbody>
              {preview.errors.map((error, index) => (
                <tr key={`${error.excelRowNumber}-${error.field}-${index}`}>
                  <td>
                    {text(
                      language,
                      `সারি ${number(error.excelRowNumber, language)}`,
                      `Row ${number(error.excelRowNumber, language)}`
                    )}
                  </td>
                  <td>{error.field || text(language, 'প্রশ্ন', 'Question')}</td>
                  <td>{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
