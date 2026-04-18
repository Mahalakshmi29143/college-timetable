import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Calendar, User, BookOpen, RefreshCw, 
  Beaker, Save, Loader2, FileText, Sparkles, Download, 
  HelpCircle, Info, ChevronRight, Printer, ShieldCheck, 
  MousePointer2, Edit3, Settings2, X, Database
} from 'lucide-react';

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  "Period 1", "Period 2", "Period 3", "Period 4", 
  "Lunch Break", 
  "Period 5", "Period 6", "Period 7", "Period 8"
];

const apiKey = ""; 
const isBreak = (idx) => idx === 4;

const Card = ({ children, className = "", id = "" }) => (
  <div id={id} className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, type = "button", id = "" }) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 text-sm";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:bg-blue-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600",
    gold: "bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 shadow-md shadow-amber-900/10",
    ghost: "text-slate-500 hover:bg-slate-100",
  };
  return (
    <button id={id} type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const scannerInputRef = useRef(null);
  const timetableRef = useRef(null);
  
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('timetable_staff_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({ 
    name: "", subject: "", year: "1st Year", hours: 6, isLab: false 
  });
  
  const [editingId, setEditingId] = useState(null);
  const [facultyConstraint, setFacultyConstraint] = useState(() => localStorage.getItem('timetable_constraints') || "");
  const [timetables, setTimetables] = useState(null);
  const [activeTab, setActiveTab] = useState("1st Year");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    localStorage.setItem('timetable_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  const addSampleData = () => {
    const samples = [
      { id: Math.random(), name: "Dr. Smith", subject: "Mathematics", year: "1st Year", hours: 6, isLab: false },
      { id: Math.random(), name: "Prof. Johnson", subject: "Physics Lab", year: "1st Year", hours: 3, isLab: true },
      { id: Math.random(), name: "Dr. Alan", subject: "Data Structures", year: "2nd Year", hours: 6, isLab: false },
      { id: Math.random(), name: "Prof. Grace", subject: "Operating Systems", year: "3rd Year", hours: 5, isLab: false },
      { id: Math.random(), name: "Dr. Turing", subject: "AI Ethics", year: "4th Year", hours: 4, isLab: false }
    ];
    setStaffList([...staffList, ...samples]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleScannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      const systemPrompt = "Extract staff names, subjects, weekly hours (integer), year (exactly '1st Year', '2nd Year', '3rd Year', or '4th Year'), and isLab (boolean) from this allocation document. IMPORTANT: Return ONLY a raw JSON object. Do not include any markdown formatting, preambles, or explanations.";
      
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }, { inlineData: { mimeType: file.type, data: base64Data } }] }]
          })
        });
        const result = await response.json();
        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawText) {
          // Robust JSON extraction: look for the first '{' and last '}'
          let cleanJson = rawText;
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = rawText.substring(firstBrace, lastBrace + 1);
          } else {
            // Fallback: strip standard markdown blocks if found
            cleanJson = rawText.replace(/```json|```/g, "").trim();
          }

          const parsed = JSON.parse(cleanJson);
          if (parsed.allocations && Array.isArray(parsed.allocations)) {
            const newStaff = parsed.allocations.map(a => ({
              ...a, 
              id: Math.random(),
              year: YEARS.includes(a.year) ? a.year : "1st Year" // Validation
            }));
            setStaffList(prev => [...prev, ...newStaff]);
          }
        }
      } catch (err) { 
        console.error("Scanning Error:", err); 
        // User friendly error feedback could go here
      } finally {
        setIsScanning(false);
        if (scannerInputRef.current) scannerInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOrUpdateStaff = () => {
    if (!formData.name || !formData.subject) return;

    if (editingId) {
      setStaffList(staffList.map(s => s.id === editingId ? { ...formData, id: editingId } : s));
      setEditingId(null);
    } else {
      setStaffList([...staffList, { ...formData, id: Math.random() }]);
    }
    setFormData({ name: "", subject: "", year: "1st Year", hours: 6, isLab: false });
  };

  const startEdit = (staff) => {
    setEditingId(staff.id);
    setFormData({
      name: staff.name,
      subject: staff.subject,
      year: staff.year,
      hours: staff.hours,
      isLab: staff.isLab
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateTimetable = () => {
    const newTimetables = {};
    YEARS.forEach(y => {
      newTimetables[y] = {};
      DAYS.forEach(d => { newTimetables[y][d] = Array(PERIODS.length).fill(null); });
    });

    const weeklyUsage = {};
    staffList.forEach(s => weeklyUsage[s.id] = 0);

    DAYS.forEach(day => {
      const labAllocatedToday = {}; 
      YEARS.forEach(y => labAllocatedToday[y] = false);

      YEARS.forEach(year => {
        const dailySubjectCount = {};

        for (let pIdx = 0; pIdx < PERIODS.length; pIdx++) {
          if (isBreak(pIdx) || newTimetables[year][day][pIdx]) continue;

          // Lab Logic (3 Continuous Periods)
          const isMorningBlock = pIdx < 4;
          const availableContinuous = isMorningBlock ? (4 - pIdx) : (8 - pIdx);

          const labCandidate = staffList.find(s => 
            s.year.trim() === year.trim() && 
            s.isLab && 
            !labAllocatedToday[year] && 
            (weeklyUsage[s.id] + 3) <= s.hours &&
            availableContinuous >= 3
          );

          if (labCandidate) {
            let staffBusy = false;
            for(let offset=0; offset<3; offset++) {
                YEARS.forEach(otherYear => {
                    if (newTimetables[otherYear][day][pIdx + offset]?.staffId === labCandidate.id) staffBusy = true;
                });
            }

            if (!staffBusy) {
                for(let i=0; i<3; i++) {
                    newTimetables[year][day][pIdx + i] = {
                        type: "Class", subject: labCandidate.subject, staffName: labCandidate.name, 
                        staffId: labCandidate.id, isLab: true
                    };
                }
                weeklyUsage[labCandidate.id] += 3;
                labAllocatedToday[year] = true;
                continue;
            }
          }

          // Lecture Logic
          const busyStaffAtThisTime = new Set();
          YEARS.forEach(y => { if(newTimetables[y][day][pIdx]?.staffId) busyStaffAtThisTime.add(newTimetables[y][day][pIdx].staffId); });

          const prevSlot = pIdx > 0 ? newTimetables[year][day][pIdx-1] : null;

          const candidates = staffList.filter(s => 
            s.year.trim() === year.trim() && 
            !s.isLab &&
            !busyStaffAtThisTime.has(s.id) &&
            weeklyUsage[s.id] < s.hours &&
            (dailySubjectCount[s.subject] || 0) < 2 && 
            prevSlot?.subject !== s.subject 
          ).sort(() => Math.random() - 0.5);

          if (candidates.length > 0) {
            const s = candidates[0];
            newTimetables[year][day][pIdx] = {
              type: "Class", subject: s.subject, staffName: s.name, staffId: s.id, isLab: false
            };
            weeklyUsage[s.id]++;
            dailySubjectCount[s.subject] = (dailySubjectCount[s.subject] || 0) + 1;
          } else {
            newTimetables[year][day][pIdx] = { type: "Free", subject: "Self Study", staffName: "-" };
          }
        }
      });
    });
    setTimetables(newTimetables);
  };

  const downloadTimetable = async () => {
    if (!timetableRef.current || !window.html2canvas) return;
    setIsDownloading(true);
    const canvas = await window.html2canvas(timetableRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL("image/png");
    link.download = `Timetable_${activeTab}.png`;
    link.click();
    setIsDownloading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="text-blue-600" /> College Scheduler
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={addSampleData}><Database size={16}/> Load Sample</Button>
            <Button variant="outline" onClick={() => { localStorage.clear(); window.location.reload(); }}>Clear All</Button>
          </div>
        </div>

        {/* AI Scanner Section */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl ring-1 ring-blue-500/50">
              <Sparkles className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Allocation Scanner</h3>
              <p className="text-slate-400 text-sm">Upload an image to auto-fill staff across all years.</p>
            </div>
          </div>
          <Button variant="gold" onClick={() => scannerInputRef.current.click()} disabled={isScanning}>
            {isScanning ? <Loader2 className="animate-spin" /> : <FileText />} 
            {isScanning ? "Processing..." : "Upload Document"}
          </Button>
          <input type="file" ref={scannerInputRef} className="hidden" accept="image/*" onChange={handleScannerUpload} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Entry Form */}
          <Card className={`p-6 space-y-4 border-t-4 ${editingId ? 'border-t-orange-500 bg-orange-50/20' : 'border-t-blue-500'}`}>
            <div className="flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2">
                    {editingId ? <Edit3 className="text-orange-500" size={18}/> : <User className="text-blue-500" size={18}/>} 
                    {editingId ? 'Modify Entry' : 'Manual Entry'}
                </h2>
                {editingId && <button onClick={() => {setEditingId(null); setFormData({name: "", subject: "", year: "1st Year", hours: 6, isLab: false});}} className="text-slate-400 hover:text-red-500"><X size={18}/></button>}
            </div>
            <div className="space-y-3">
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Staff Name" className="w-full p-2.5 border rounded-lg bg-white shadow-sm" />
              <input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Subject Name" className="w-full p-2.5 border rounded-lg bg-white shadow-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select name="year" value={formData.year} onChange={handleInputChange} className="p-2.5 border rounded-lg bg-white shadow-sm font-medium">
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <input type="number" name="hours" value={formData.hours} onChange={handleInputChange} placeholder="Hrs/Week" className="p-2.5 border rounded-lg bg-white shadow-sm" />
              </div>
              <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl cursor-pointer border border-indigo-100 hover:bg-indigo-100 transition-colors">
                <input type="checkbox" name="isLab" checked={formData.isLab} onChange={handleInputChange} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                <div className="text-xs font-black flex items-center gap-2 text-indigo-700 uppercase tracking-wider">
                    <Beaker size={14}/> 3-Hour Lab Block
                </div>
              </label>
              <Button className="w-full py-3" onClick={handleAddOrUpdateStaff} variant={editingId ? 'gold' : 'primary'}>
                {editingId ? 'Update Staff Member' : 'Add to Registry'}
              </Button>
            </div>

            <div className="pt-4 border-t space-y-3">
              <h3 className="text-xs font-black flex items-center gap-2 text-slate-500 uppercase tracking-widest"><Settings2 size={14}/> Constraints</h3>
              <textarea 
                value={facultyConstraint} 
                onChange={(e) => setFacultyConstraint(e.target.value)} 
                placeholder="Example: Dr. Smith unavailable on Fridays..." 
                className="w-full h-20 p-3 text-xs border rounded-lg bg-white resize-none shadow-inner"
              />
              <Button variant="outline" className="w-full text-xs font-bold" onClick={() => {
                  localStorage.setItem('timetable_constraints', facultyConstraint);
                  generateTimetable();
              }}>
                <ShieldCheck size={14}/> Sync & Refresh
              </Button>
            </div>
          </Card>

          {/* Registry List */}
          <Card className="lg:col-span-2 p-6 flex flex-col h-[680px] border-none shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-black text-xl text-slate-900 uppercase tracking-tight">Staff Registry</h2>
                <p className="text-xs font-bold text-slate-400">Total: {staffList.length} members across {YEARS.length} years</p>
              </div>
              <Button onClick={generateTimetable} variant="primary" className="shadow-lg shadow-blue-200 px-6 py-3">
                <RefreshCw size={16} className={staffList.length > 0 ? "" : "opacity-50"}/> Generate Master Plan
              </Button>
            </div>
            <div className="overflow-y-auto space-y-3 pr-2 flex-1 scrollbar-thin">
              {staffList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <BookOpen size={64} className="mb-4 opacity-10"/>
                    <p className="font-bold">Registry is empty</p>
                    <p className="text-xs">Add staff or upload a document to begin</p>
                </div>
              ) : staffList.map(s => (
                <div key={s.id} className="group flex items-center justify-between p-4 border-2 rounded-xl bg-white hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${s.isLab ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                      {s.isLab ? <Beaker size={20}/> : <User size={20}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900">{s.name}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 rounded uppercase">{s.year}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{s.subject} • {s.hours} Hours/Week</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(s)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit3 size={18}/></button>
                    <button onClick={() => setStaffList(staffList.filter(x => x.id !== s.id))} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Timetable Display */}
        {timetables && (
          <div className="space-y-6 pt-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-1 bg-white p-1.5 rounded-2xl shadow-md border overflow-x-auto w-full md:w-auto">
                {YEARS.map(y => (
                  <button 
                    key={y} 
                    onClick={() => setActiveTab(y)} 
                    className={`px-6 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeTab === y ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    {y.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" className="flex-1 bg-white" onClick={() => window.print()}><Printer size={16}/> Print View</Button>
                <Button onClick={downloadTimetable} variant="primary" className="flex-1 bg-slate-900 hover:bg-black" disabled={isDownloading}>
                  <Download size={16}/> {isDownloading ? "Exporting..." : "Export Image"}
                </Button>
              </div>
            </div>

            <Card className="overflow-x-auto shadow-2xl border-none rounded-3xl">
              <div ref={timetableRef} className="p-10 bg-white min-w-[1200px]">
                <div className="border-b-[12px] border-slate-900 pb-8 mb-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black uppercase text-slate-900 tracking-tighter leading-none">{activeTab}</h2>
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest mt-1">Master Academic Schedule</h3>
                    <p className="text-blue-600 font-black text-sm tracking-[0.3em] mt-3 uppercase">Faculty of Engineering & Technology</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-3 justify-end mb-3">
                        <span className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase">Conflict Free</span>
                        <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">Lab Sync</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase">Automated via Gemini AI Engine</p>
                  </div>
                </div>
                
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-5 border-2 border-slate-800 text-[12px] font-black w-32 uppercase tracking-widest">Day</th>
                      {PERIODS.map((p, i) => (
                        <th key={i} className={`p-5 border-2 border-slate-800 text-[12px] font-black uppercase ${isBreak(i) ? 'bg-blue-900' : ''}`}>
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5 border-2 border-slate-200 font-black text-sm bg-slate-100 text-slate-900 uppercase text-center">{day}</td>
                        {timetables[activeTab][day].map((slot, i) => {
                          if (isBreak(i)) return (
                            <td key={i} className="border-2 border-slate-200 bg-blue-50/40 text-center relative overflow-hidden">
                                <span className="text-[11px] font-black text-blue-300 uppercase tracking-[0.5em] rotate-90 inline-block">Lunch</span>
                            </td>
                          );
                          
                          return (
                            <td key={i} className="p-1.5 border-2 border-slate-200 h-32 w-44 align-top">
                              {slot?.type === 'Class' ? (
                                <div className={`h-full p-4 rounded-xl border-b-8 flex flex-col justify-between transition-transform hover:scale-[1.02] shadow-sm ${slot.isLab ? 'border-indigo-600 bg-indigo-50/60' : 'border-blue-600 bg-blue-50/50'}`}>
                                  <div>
                                    <p className="text-[13px] font-black leading-tight uppercase text-slate-900 mb-2 line-clamp-2">{slot.subject}</p>
                                    <p className="text-[11px] font-black text-slate-700 bg-white/60 inline-block px-2 py-0.5 rounded border border-slate-200 shadow-xs">{slot.staffName}</p>
                                  </div>
                                  {slot.isLab && (
                                    <div className="mt-auto">
                                        <span className="text-[9px] bg-indigo-600 text-white px-2.5 py-1 rounded-md font-black tracking-widest uppercase">Lab Session</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center bg-slate-50/30">
                                  <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Free Slot</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          button, .fixed, .lg\\:col-span-1, .bg-slate-900.rounded-2xl { display: none !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
          .min-w-\\[1200px\\] { min-width: 100% !important; }
          body { background: white !important; }
          .shadow-2xl { shadow: none !important; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}