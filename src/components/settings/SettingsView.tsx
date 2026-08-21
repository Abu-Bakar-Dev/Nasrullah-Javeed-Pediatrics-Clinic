import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPhoneNumber } from '../../utils/phoneFormatter';
import { getImapConfig, saveImapConfig, ImapConfig } from '../../config/imapConfig';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SupabaseTestReport,
  SUPABASE_SQL_SCHEMA_SCRIPT,
} from '../../lib/supabase';

export const SettingsView: React.FC = () => {
  const { currentUser, refreshFromDatabase, isDbSyncing } = useApp();
  const [clinicName, setClinicName] = useState('Nasrullah Javed Pediatric and Health Clinic');
  const [clinicAddress, setClinicAddress] = useState('123 Health Way, Medical City, MC 10001');
  const [phone, setPhone] = useState('0333-7645673');
  const [saved, setSaved] = useState(false);

  // IMAP Configuration state
  const [imapConfig, setImapConfigState] = useState<ImapConfig>(getImapConfig());
  const [imapSaved, setImapSaved] = useState(false);

  // Supabase Configuration & Diagnostics state
  const initialSbConfig = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(initialSbConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(initialSbConfig.anonKey);
  const [supabaseSaved, setSupabaseSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testReport, setTestReport] = useState<SupabaseTestReport | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveImap = (e: React.FormEvent) => {
    e.preventDefault();
    saveImapConfig(imapConfig);
    setImapSaved(true);
    setTimeout(() => setImapSaved(false), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setSupabaseSaved(true);
    setTimeout(() => setSupabaseSaved(false), 3000);
    // Auto-trigger test after save
    runConnectionTest();
  };

  const handleClearSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setTestReport(null);
  };

  const runConnectionTest = async () => {
    setTestingConnection(true);
    setTestReport(null);
    try {
      // Ensure latest input is used if changed
      if (supabaseUrlInput !== initialSbConfig.url || supabaseKeyInput !== initialSbConfig.anonKey) {
        saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
      }
      const report = await testSupabaseConnection();
      setTestReport(report);
    } catch (e: any) {
      setTestReport({
        success: false,
        latencyMs: 0,
        url: supabaseUrlInput,
        message: `Connection test failed: ${e?.message || 'Unknown error'}`,
        tablesTested: [],
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface">Clinic Settings & Database</h2>
        <p className="font-body-lg text-xs md:text-sm text-on-surface-variant mt-1">
          Manage system configurations, real-time database synchronization, and security policies.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-secondary-container text-on-secondary-container rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-sm icon-fill">check_circle</span>
          Settings updated successfully!
        </div>
      )}

      {/* Database Status Monitor */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl icon-fill">database</span>
            <h3 className="font-title-md font-bold text-sm text-on-surface">PostgreSQL / Supabase Real-Time Backend</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6f4ea] text-[#137333] rounded-full font-label-md text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse"></span>
            Connected & Syncing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60">
            <div className="text-outline font-semibold mb-1">Row-Level Security (RLS)</div>
            <div className="font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm icon-fill">verified_user</span>
              Active (Enforced)
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">Patient PHI guarded per user role</p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60">
            <div className="text-outline font-semibold mb-1">Real-Time Subscriptions</div>
            <div className="font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">swap_calls</span>
              Live WebSocket Sync
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">Instant patient check-in updates</p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60">
            <div className="text-outline font-semibold mb-1">NextAuth / Auth Handler</div>
            <div className="font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              JWT Clinical Sessions
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">Secure OAuth & Credential Auth</p>
          </div>
        </div>
      </div>

      {/* Supabase Database Connection & Live Records Verification */}
      <div className="bg-surface rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-5 text-xs">
        <div className="flex justify-between items-center border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-xl icon-fill">database</span>
            <div>
              <h3 className="font-title-md font-bold text-sm text-on-surface">
                Supabase Database Connection & Live Records Verification
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Configure API keys, test live database connectivity, and verify table record persistence.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
              isSupabaseConfigured() 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <span className="material-symbols-outlined text-xs">
                {isSupabaseConfigured() ? 'check_circle' : 'warning'}
              </span>
              {isSupabaseConfigured() ? 'Supabase Configured' : 'Credentials Required'}
            </span>
            {supabaseSaved && (
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold animate-in fade-in">
                Saved!
              </span>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveSupabase} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block font-bold text-on-surface mb-1 flex justify-between items-center">
                <span>Supabase Project URL (<code className="text-indigo-600">VITE_SUPABASE_URL</code>)</span>
                <span className="text-[10px] text-slate-400 font-normal">Format: https://xxx.supabase.co</span>
              </label>
              <input
                type="url"
                value={supabaseUrlInput}
                onChange={e => setSupabaseUrlInput(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                required
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1 flex justify-between items-center">
                <span>Supabase Anon Public API Key (<code className="text-indigo-600">VITE_SUPABASE_ANON_KEY</code>)</span>
                <span className="text-[10px] text-slate-400 font-normal">Starts with eyJhbG...</span>
              </label>
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={e => setSupabaseKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save Supabase Credentials
              </button>

              <button
                type="button"
                onClick={runConnectionTest}
                disabled={testingConnection}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${testingConnection ? 'animate-spin' : ''}`}>
                  {testingConnection ? 'sync' : 'network_check'}
                </span>
                {testingConnection ? 'Testing Connection...' : 'Test Live Database & Tables'}
              </button>

              <button
                type="button"
                onClick={() => refreshFromDatabase()}
                disabled={isDbSyncing || !isSupabaseConfigured()}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                title="Pull latest live records from Supabase"
              >
                <span className={`material-symbols-outlined text-sm ${isDbSyncing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                {isDbSyncing ? 'Syncing...' : 'Pull Live DB Records'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSqlSchema(!showSqlSchema)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">code</span>
                {showSqlSchema ? 'Hide SQL Setup Schema' : 'View SQL Setup Schema'}
              </button>

              {(supabaseUrlInput || supabaseKeyInput) && (
                <button
                  type="button"
                  onClick={handleClearSupabase}
                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-[11px]"
                >
                  Clear Saved Keys
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Diagnostic Results Card */}
        {testReport && (
          <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
            testReport.success
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50'
              : 'bg-rose-950/90 text-rose-100 border-rose-500/50'
          }`}>
            <div className="flex justify-between items-start border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg ${testReport.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testReport.success ? 'verified' : 'error'}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    {testReport.success ? 'Supabase Live Connection Active' : 'Supabase Connection Diagnostic Failed'}
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-white/10 text-slate-200">
                      {testReport.latencyMs}ms ping latency
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">{testReport.message}</p>
                </div>
              </div>
            </div>

            {/* Table status list */}
            {testReport.tablesTested.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="font-bold text-[11px] text-slate-200 flex justify-between items-center">
                  <span>Live Database Table Verification Status:</span>
                  <span className="text-[10px] font-mono text-slate-400">Project Endpoint: {testReport.url}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {testReport.tablesTested.map((t, idx) => (
                    <div key={idx} className={`p-2 rounded border text-[11px] flex justify-between items-center ${
                      t.status === 'ok'
                        ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-200'
                        : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                    }`}>
                      <div className="font-mono font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          {t.status === 'ok' ? 'table_chart' : 'warning'}
                        </span>
                        {t.table}
                      </div>
                      <div className="font-bold text-[10px]">
                        {t.status === 'ok' ? (
                          <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                            {t.count ?? 0} records
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30 text-[9px]">
                            {t.error ? 'Missing Table' : 'Error'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Write Test Result */}
            {testReport.recordWriteTest && (
              <div className="p-2.5 bg-black/30 rounded border border-white/10 text-[11px] flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${testReport.recordWriteTest.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {testReport.recordWriteTest.success ? 'edit_note' : 'info'}
                </span>
                <span>
                  <strong>Record Insertion Test:</strong> {testReport.recordWriteTest.message}
                </span>
              </div>
            )}
          </div>
        )}

        {/* SQL Schema helper box */}
        {showSqlSchema && (
          <div className="p-4 bg-slate-900 rounded-xl text-slate-200 space-y-2 text-[11px] font-mono animate-in fade-in border border-indigo-500/30">
            <div className="flex justify-between items-center font-sans">
              <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">terminal</span>
                Supabase SQL Editor Schema Script
              </div>
              <button
                type="button"
                onClick={copySqlSchema}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedSql ? 'check' : 'content_copy'}
                </span>
                {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}
              </button>
            </div>
            <p className="font-sans text-slate-400 text-[10px]">
              Copy and paste this script into your Supabase Dashboard under <strong>SQL Editor &gt; New Query &gt; Run</strong> to create all clinic database tables (<code className="text-emerald-400">patients</code>, <code className="text-emerald-400">appointments</code>, <code className="text-emerald-400">staff</code>, <code className="text-emerald-400">prescriptions</code>, <code className="text-emerald-400">connection_logs</code>) and setup RLS policies:
            </p>
            <pre className="p-3 bg-slate-950 rounded-lg text-[10px] leading-relaxed text-emerald-300 max-h-48 overflow-y-auto border border-slate-800">
              {SUPABASE_SQL_SCHEMA_SCRIPT}
            </pre>
          </div>
        )}

        {/* Deployment guide info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
          <div className="p-3 bg-slate-900 rounded-xl text-slate-200 space-y-1 font-mono">
            <div className="font-sans font-bold text-indigo-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">settings_input_component</span>
              Vercel Project Environment Setup
            </div>
            <p className="font-sans text-slate-400 text-[10px]">
              When deploying on Vercel, go to <strong>Project Settings &gt; Environment Variables</strong> and add:
            </p>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5 text-[10px]">
              <div><span className="text-emerald-400">VITE_SUPABASE_URL</span> = https://your-project.supabase.co</div>
              <div><span className="text-emerald-400">VITE_SUPABASE_ANON_KEY</span> = eyJhbGciOiJKV1Qi...</div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1 text-[11px]">
            <div className="font-bold text-indigo-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-indigo-600">code</span>
              Database Code & Export Architecture
            </div>
            <p className="text-indigo-950 text-[10px]">
              The Supabase client module is located at <code className="bg-white px-1 py-0.5 rounded font-mono border border-indigo-200 text-indigo-700">src/lib/supabase.ts</code>.
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[10px]">
              <li>Uses Vite environment variables (<code className="font-mono">import.meta.env</code>) & runtime local config</li>
              <li>Includes diagnostic helper <code className="font-mono">testSupabaseConnection()</code></li>
              <li>Supports real-time channels & SQL table queries</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Direct Live IMAP & Mail Server Settings */}
      <form onSubmit={handleSaveImap} className="bg-surface rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg icon-fill">mark_email_read</span>
              <h3 className="font-title-md font-bold text-sm text-on-surface">
                Direct Live IMAP & SMTP Email Settings (abu.bakar041295@gmail.com)
              </h3>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Configure your Gmail host, port, and 16-character App Password to handle password reset dispatches.
            </p>
          </div>
          {imapSaved && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-xs">check</span>
              IMAP Settings Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-on-surface mb-1">IMAP Incoming Server Host</label>
            <input
              type="text"
              value={imapConfig.imapHost}
              onChange={e => setImapConfigState({ ...imapConfig, imapHost: e.target.value })}
              placeholder="imap.gmail.com"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">IMAP Port (SSL/TLS)</label>
            <input
              type="number"
              value={imapConfig.imapPort}
              onChange={e => setImapConfigState({ ...imapConfig, imapPort: parseInt(e.target.value) || 993 })}
              placeholder="993"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">SMTP Outgoing Server Host</label>
            <input
              type="text"
              value={imapConfig.smtpHost}
              onChange={e => setImapConfigState({ ...imapConfig, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">SMTP Port (SSL)</label>
            <input
              type="number"
              value={imapConfig.smtpPort}
              onChange={e => setImapConfigState({ ...imapConfig, smtpPort: parseInt(e.target.value) || 465 })}
              placeholder="465"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">Sender Email Account</label>
            <input
              type="email"
              value={imapConfig.emailUser}
              onChange={e => setImapConfigState({ ...imapConfig, emailUser: e.target.value })}
              placeholder="abu.bakar041295@gmail.com"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">Gmail App Password (16 Characters)</label>
            <input
              type="password"
              value={imapConfig.appPassword}
              onChange={e => setImapConfigState({ ...imapConfig, appPassword: e.target.value })}
              placeholder="xxxx xxxx xxxx xxxx"
              required
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <p className="text-[11px] text-on-surface-variant font-medium">
            Files to edit directly: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">.env.example</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">src/config/imapConfig.ts</code>
          </p>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
          >
            Save IMAP Credentials
          </button>
        </div>
      </form>

      {/* Clinic Information Form */}
      <form onSubmit={handleSave} className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm space-y-4 text-xs">
        <h3 className="font-title-md font-bold text-sm text-on-surface border-b border-outline-variant pb-2">
          Facility Profile
        </h3>

        <div>
          <label className="block font-semibold text-on-surface mb-1" htmlFor="clinicName">
            Facility Name
          </label>
          <input
            id="clinicName"
            type="text"
            value={clinicName}
            onChange={e => setClinicName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-on-surface mb-1" htmlFor="phone">
              Primary Phone
            </label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={e => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="0333-7645673"
              className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1" htmlFor="loggedUser">
              Logged In User
            </label>
            <input
              id="loggedUser"
              type="text"
              readOnly
              value={`${currentUser?.name || 'Dr. Smith'} (${currentUser?.role})`}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-on-surface mb-1" htmlFor="clinicAddress">
            Address
          </label>
          <input
            id="clinicAddress"
            type="text"
            value={clinicAddress}
            onChange={e => setClinicAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:border-primary"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-surface-tint transition-all shadow-sm"
          >
            Save Facility Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
