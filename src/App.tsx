/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, GraduationCap, BookOpen, History as HistoryIcon, Info, CheckCircle2, XCircle, ChevronRight, Plus, Trash2, Save, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'tbm' | 'gpa3' | 'dxtn';

interface HistoryItem {
  id: string;
  timestamp: number;
}

interface TBMHistoryItem extends HistoryItem {
  type: 'tbm' | 'yearly';
  score: string;
  label: string;
}

interface GPA3HistoryItem extends HistoryItem {
  score: string;
}

interface DXTNHistoryItem extends HistoryItem {
  score: string;
  isPass: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tbm');

  // Tab 1: TBM State
  const [txScores, setTxScores] = useState<string>('');
  const [gkScore, setGkScore] = useState<string>('');
  const [ckScore, setCkScore] = useState<string>('');
  const [hk1Score, setHk1Score] = useState<string>('');
  const [hk2Score, setHk2Score] = useState<string>('');
  const [subjectLabel, setSubjectLabel] = useState<string>('');

  // Tab 2: GPA 3 Years State
  const [gpa10, setGpa10] = useState<string>('');
  const [gpa11, setGpa11] = useState<string>('');
  const [gpa12, setGpa12] = useState<string>('');

  // Tab 3: Graduation Score State
  const [examScores, setExamScores] = useState<string[]>(['', '', '', '']);
  const [manualGpa3, setManualGpa3] = useState<string>('');
  const [priorityPoints, setPriorityPoints] = useState<string>('0');
  const [encouragementPoints, setEncouragementPoints] = useState<string>('0');

  // GPA Calculator State (8 subjects)
  const [subjectScores, setSubjectScores] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const subjectNames = ['Toán', 'Văn', 'Anh', 'Tự chọn 1', 'Tự chọn 2', 'Tự chọn 3', 'Tự chọn 4', 'Tự chọn 5'];

  // History States
  const [tbmHistory, setTbmHistory] = useState<TBMHistoryItem[]>(() => {
    const saved = localStorage.getItem('educalc_tbm_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [gpa3History, setGpa3History] = useState<GPA3HistoryItem[]>(() => {
    const saved = localStorage.getItem('educalc_gpa3_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [dxtnHistory, setDxtnHistory] = useState<DXTNHistoryItem[]>(() => {
    const saved = localStorage.getItem('educalc_dxtn_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist History
  useEffect(() => localStorage.setItem('educalc_tbm_history', JSON.stringify(tbmHistory)), [tbmHistory]);
  useEffect(() => localStorage.setItem('educalc_gpa3_history', JSON.stringify(gpa3History)), [gpa3History]);
  useEffect(() => localStorage.setItem('educalc_dxtn_history', JSON.stringify(dxtnHistory)), [dxtnHistory]);

  // Calculations
  const tbmResult = useMemo(() => {
    const txArr = txScores.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const gk = parseFloat(gkScore);
    const ck = parseFloat(ckScore);
    if (txArr.length === 0 || isNaN(gk) || isNaN(ck)) return null;
    const totalTx = txArr.reduce((sum, val) => sum + val, 0);
    return ((totalTx + gk * 2 + ck * 3) / (txArr.length + 5)).toFixed(2);
  }, [txScores, gkScore, ckScore]);

  const yearlyResult = useMemo(() => {
    const hk1 = parseFloat(hk1Score);
    const hk2 = parseFloat(hk2Score);
    if (isNaN(hk1) || isNaN(hk2)) return null;
    return ((hk1 + hk2 * 2) / 3).toFixed(2);
  }, [hk1Score, hk2Score]);

  const gpa3Result = useMemo(() => {
    const l10 = parseFloat(gpa10);
    const l11 = parseFloat(gpa11);
    const l12 = parseFloat(gpa12);
    if (isNaN(l10) || isNaN(l11) || isNaN(l12)) return null;
    return ((l10 * 1 + l11 * 2 + l12 * 3) / 6).toFixed(2);
  }, [gpa10, gpa11, gpa12]);

  const dxtnResult = useMemo(() => {
    const scores = examScores.map(s => parseFloat(s)).filter(n => !isNaN(n));
    const gpa3 = parseFloat(manualGpa3 || gpa3Result || '0');
    const priority = parseFloat(priorityPoints) || 0;
    const encouragement = parseFloat(encouragementPoints) || 0;
    if (scores.length < 4 || isNaN(gpa3)) return null;
    const totalExams = scores.reduce((sum, val) => sum + val, 0);
    const avgExamsWithKK = (totalExams + encouragement) / 4;
    const result = (avgExamsWithKK + gpa3) / 2 + priority;
    const hasLiệt = scores.some(s => s <= 1.0);
    const isPass = result >= 5.0 && !hasLiệt;
    return { score: result.toFixed(2), isPass, hasLiệt };
  }, [examScores, manualGpa3, gpa3Result, priorityPoints, encouragementPoints]);

  const annualGpaResult = useMemo(() => {
    const scores = subjectScores.map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (scores.length < 8) return null;
    return (scores.reduce((sum, val) => sum + val, 0) / 8).toFixed(2);
  }, [subjectScores]);

  const requiredExamAvg = useMemo(() => {
    const gpa3 = parseFloat(manualGpa3 || gpa3Result || '0');
    const priority = parseFloat(priorityPoints) || 0;
    const encouragement = parseFloat(encouragementPoints) || 0;

    if (!gpa3 || isNaN(gpa3)) return null;

    // Formula: ĐXTN = [((S/4 + KK/4) + GPA3) / 2] + UT
    // To get ĐXTN = 5.0:
    // 5.0 = [ (Avg + KK/4) + GPA3 ] / 2 + UT
    // 10.0 = Avg + KK/4 + GPA3 + 2*UT
    // Avg = 10.0 - GPA3 - 2*UT - KK/4
    const required = 10.0 - gpa3 - (2 * priority) - (encouragement / 4);
    
    if (required > 10) return "Không thể đỗ";
    if (required <= 1.0) return "1.01"; // Cần trên điểm liệt
    return required.toFixed(2);
  }, [manualGpa3, gpa3Result, priorityPoints, encouragementPoints]);

  // History Handlers
  const saveTBM = (type: 'tbm' | 'yearly', score: string) => {
    const newItem: TBMHistoryItem = {
      id: Date.now().toString(),
      type,
      score,
      label: subjectLabel || (type === 'tbm' ? 'Môn học' : 'Cả năm'),
      timestamp: Date.now(),
    };
    setTbmHistory([newItem, ...tbmHistory].slice(0, 10));
  };

  const saveGPA3 = (score: string) => {
    const newItem: GPA3HistoryItem = {
      id: Date.now().toString(),
      score,
      timestamp: Date.now(),
    };
    setGPA3History([newItem, ...gpa3History].slice(0, 10));
  };

  const saveDXTN = (score: string, isPass: boolean) => {
    const newItem: DXTNHistoryItem = {
      id: Date.now().toString(),
      score,
      isPass,
      timestamp: Date.now(),
    };
    setDxtnHistory([newItem, ...dxtnHistory].slice(0, 10));
  };

  const deleteHistoryItem = (tab: TabType, id: string) => {
    if (tab === 'tbm') setTbmHistory(tbmHistory.filter(i => i.id !== id));
    if (tab === 'gpa3') setGPA3History(gpa3History.filter(i => i.id !== id));
    if (tab === 'dxtn') setDxtnHistory(dxtnHistory.filter(i => i.id !== id));
  };

  const tabs = [
    { id: 'tbm', label: 'Tính TBM', icon: BookOpen },
    { id: 'gpa3', label: 'GPA 3 Năm', icon: HistoryIcon },
    { id: 'dxtn', label: 'Xét Tốt Nghiệp', icon: GraduationCap },
  ];

  const HistorySection = ({ items, tab }: { items: any[], tab: TabType }) => (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4" /> Lịch sử gần đây
        </h3>
        {items.length > 0 && (
          <button 
            onClick={() => {
              if (tab === 'tbm') setTbmHistory([]);
              if (tab === 'gpa3') setGPA3History([]);
              if (tab === 'dxtn') setDxtnHistory([]);
            }}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm italic">Chưa có lịch sử tính toán</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                  tab === 'dxtn' 
                    ? (item.isPass ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {item.score}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {tab === 'tbm' ? item.label : tab === 'gpa3' ? 'GPA 3 Năm' : (item.isPass ? 'Đỗ Tốt Nghiệp' : 'Trượt Tốt Nghiệp')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => deleteHistoryItem(tab, item.id)}
                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen text-[#1E293B] font-sans selection:bg-indigo-100">
      <video
    autoPlay
    muted
    loop
    playsInline
    className="fixed top-0 left-0 w-full h-full object-cover -z-10"
  >
    <source src="/bg.mp4/" type="video/mp4" />
  </video>

  {/* Lớp phủ để làm mờ nền, giúp bảng tính điểm hiện rõ hơn */}
  <div className="fixed top-0 left-0 w-full h-full bg-white/40 dark:bg-black/40 -z-10"></div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Calculator className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">EduCalc 2026</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Quy chế Bộ GD&ĐT</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
            <Info className="w-4 h-4" />
            <span>Dữ liệu cập nhật 2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-200/50 rounded-2xl mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'tbm' && (
              <div className="space-y-6">
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                      Tính điểm trung bình môn học
                    </h2>
                    <input 
                      type="text" 
                      placeholder="Tên môn (VD: Toán)" 
                      value={subjectLabel}
                      onChange={(e) => setSubjectLabel(e.target.value)}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg outline-none border border-indigo-100 focus:border-indigo-300 w-32 sm:w-40"
                    />
                  </div>
                  <div className="grid gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Điểm Thường xuyên (TX)</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 8, 9, 7.5"
                        value={txScores}
                        onChange={(e) => setTxScores(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      <p className="mt-1.5 text-xs text-slate-400 italic">Cách nhau bằng dấu phẩy</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Giữa kỳ (GK)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={gkScore}
                          onChange={(e) => setGkScore(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Cuối kỳ (CK)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={ckScore}
                          onChange={(e) => setCkScore(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {tbmResult && (
                    <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                      <div>
                        <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider mb-1">Kết quả TBM</p>
                        <p className="text-4xl font-black text-indigo-900">{tbmResult}</p>
                      </div>
                      <button 
                        onClick={() => saveTBM('tbm', tbmResult)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <Save className="w-4 h-4" /> Lưu
                      </button>
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                    Tính điểm cả năm môn học
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Điểm HK1</label>
                      <input
                        type="number"
                        step="0.1"
                        value={hk1Score}
                        onChange={(e) => setHk1Score(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Điểm HK2</label>
                      <input
                        type="number"
                        step="0.1"
                        value={hk2Score}
                        onChange={(e) => setHk2Score(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  {yearlyResult && (
                    <div className="mt-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-1">Cả năm</p>
                        <p className="text-4xl font-black text-emerald-900">{yearlyResult}</p>
                      </div>
                      <button 
                        onClick={() => saveTBM('yearly', yearlyResult)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        <Save className="w-4 h-4" /> Lưu
                      </button>
                    </div>
                  )}
                </section>
                <HistorySection items={tbmHistory} tab="tbm" />
              </div>
            )}

            {activeTab === 'gpa3' && (
              <div className="space-y-6">
                {/* GPA Calculator Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                    Công cụ tính GPA năm (8 môn)
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {subjectScores.map((score, idx) => (
                      <div key={idx}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                          {subjectNames[idx]}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={score}
                          onChange={(e) => {
                            const newScores = [...subjectScores];
                            newScores[idx] = e.target.value;
                            setSubjectScores(newScores);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {annualGpaResult && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">GPA Cả năm dự kiến</p>
                        <p className="text-3xl font-black text-indigo-900">{annualGpaResult}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setGpa10(annualGpaResult)}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Dùng cho Lớp 10
                        </button>
                        <button 
                          onClick={() => setGpa11(annualGpaResult)}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Dùng cho Lớp 11
                        </button>
                        <button 
                          onClick={() => setGpa12(annualGpaResult)}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Dùng cho Lớp 12
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-amber-500 rounded-full" />
                    Tính Điểm trung bình 3 năm học
                  </h2>
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">10</div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-slate-600 mb-1">GPA Lớp 10 (Hệ số 1)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={gpa10}
                            onChange={(e) => setGpa10(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">11</div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-slate-600 mb-1">GPA Lớp 11 (Hệ số 2)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={gpa11}
                            onChange={(e) => setGpa11(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">12</div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-slate-600 mb-1">GPA Lớp 12 (Hệ số 3)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={gpa12}
                            onChange={(e) => setGpa12(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {gpa3Result && (
                      <div className="mt-8 p-8 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                        <p className="text-amber-600 text-sm font-bold uppercase tracking-widest mb-2">ĐTB 3 Năm (Trọng số)</p>
                        <p className="text-6xl font-black text-amber-900 mb-4">{gpa3Result}</p>
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => saveGPA3(gpa3Result)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-amber-600 rounded-xl font-bold shadow-sm hover:bg-amber-600 hover:text-white transition-all"
                          >
                            <Save className="w-4 h-4" /> Lưu lịch sử
                          </button>
                          <button 
                            onClick={() => setActiveTab('dxtn')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
                          >
                            Dùng tính ĐXTN <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <HistorySection items={gpa3History} tab="gpa3" />
              </div>
            )}

            {activeTab === 'dxtn' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                    Điểm thi & Điểm cộng
                  </h2>
                  
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {examScores.map((score, idx) => (
                        <div key={idx}>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            {idx === 0 ? 'Toán' : idx === 1 ? 'Văn' : `Môn ${idx + 1}`}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={score}
                            onChange={(e) => {
                              const newScores = [...examScores];
                              newScores[idx] = e.target.value;
                              setExamScores(newScores);
                            }}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                              parseFloat(score) <= 1.0 ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">ĐTB 3 Năm</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={gpa3Result || "0.00"}
                          value={manualGpa3}
                          onChange={(e) => setManualGpa3(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        {!manualGpa3 && gpa3Result && (
                          <p className="mt-1.5 text-[10px] text-indigo-500 font-medium italic">Đang dùng kết quả từ Tab 2</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Điểm Ưu tiên</label>
                        <input
                          type="number"
                          step="0.25"
                          value={priorityPoints}
                          onChange={(e) => setPriorityPoints(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Điểm Khuyến khích</label>
                        <input
                          type="number"
                          step="0.5"
                          value={encouragementPoints}
                          onChange={(e) => setEncouragementPoints(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {requiredExamAvg && (
                  <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 overflow-hidden relative">
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Mục tiêu để đỗ tốt nghiệp</h3>
                        <p className="text-sm font-medium opacity-90">
                          Bạn cần đạt trung bình mỗi môn thi ít nhất:
                        </p>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-4xl font-black">{requiredExamAvg}</span>
                        <span className="text-indigo-200 text-sm font-bold ml-2">điểm/môn</span>
                      </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  </div>
                )}

                {dxtnResult && (
                  <div className={`rounded-3xl p-8 border-2 transition-all duration-500 ${
                    dxtnResult.isPass 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-rose-50 border-rose-200'
                  }`}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        dxtnResult.isPass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {dxtnResult.isPass ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                      </div>
                      
                      <p className={`text-sm font-black uppercase tracking-[0.2em] mb-1 ${
                        dxtnResult.isPass ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {dxtnResult.isPass ? 'Đủ điều kiện đỗ' : 'Không đủ điều kiện'}
                      </p>
                      
                      <h3 className={`text-7xl font-black mb-4 ${
                        dxtnResult.isPass ? 'text-emerald-900' : 'text-rose-900'
                      }`}>
                        {dxtnResult.score}
                      </h3>

                      <div className="space-y-4 max-w-md">
                        {dxtnResult.hasLiệt && (
                          <p className="text-rose-600 text-sm font-bold bg-white/50 px-4 py-2 rounded-full border border-rose-100">
                            ⚠️ Cảnh báo: Có môn bị điểm liệt (≤ 1.0)
                          </p>
                        )}
                        <button 
                          onClick={() => saveDXTN(dxtnResult.score, dxtnResult.isPass)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-sm transition-all mx-auto ${
                            dxtnResult.isPass ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'
                          }`}
                        >
                          <Save className="w-4 h-4" /> Lưu kết quả xét tuyển
                        </button>
                        <p className="text-slate-500 text-[10px] leading-relaxed">
                          Công thức: [((Tổng 4 môn + Tổng KK) / 4) + ĐTB 3 năm] / 2 + Điểm UT
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <HistorySection items={dxtnHistory} tab="dxtn" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Info */}
        <footer className="mt-12 pt-8 border-t border-slate-200 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Công thức mới (Thi + KK + Học bạ)
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Không cộng điểm Nghề
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              Điểm liệt ≤ 1.0
            </div>
          </div>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Thiết kế bởi Xuân Trường @ 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
