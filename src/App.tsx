import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Upload, Link as LinkIcon, FileText, AlertTriangle, CheckCircle, Activity, Info, Mic, Image as ImageIcon, Video, History, User, Settings, ArrowRight, Share2, Download, Search, Menu, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FloatingPaths } from '@/components/ui/background-paths';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GlassFilter } from '@/components/ui/liquid-radio';
import { supabase } from './lib/supabase';

// --- TYPES ---
type AnalysisResult = {
  verdict: string;
  confidenceScore: number;
  trustScore: number;
  summary: string;
  reasoning: string;
  evidence: string[];
  sources: { name: string; url: string }[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// --- CUSTOM CURSOR ---
function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  React.useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer') ||
        getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <svg className="hidden">
        <defs>
          <filter id="cursor-liquid" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="30" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="2" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[100] hidden md:block mix-blend-difference"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none z-[99] hidden md:block mix-blend-difference shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] bg-white/5"
        style={{ backdropFilter: 'url("#cursor-liquid") blur(4px)' }}
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          scale: isHovering ? 1.5 : 1,
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 25, mass: 1 }}
      />
    </>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'analyzer' | 'results' | 'dashboard'>('landing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden md:cursor-none">
      <CustomCursor />
      
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-950/20 blur-[130px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <Navbar setView={setCurrentView} currentView={currentView} />
        <Toaster position="top-center" theme="dark" />
        
        <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 md:pb-12">
          <AnimatePresence mode="wait">
          {currentView === 'landing' && (
            <LandingView key="landing" onStart={() => setCurrentView('analyzer')} />
          )}
          {currentView === 'analyzer' && (
            <AnalyzerView 
              key="analyzer" 
              onAnalyze={(result) => {
                setAnalysisResult(result);
                setCurrentView('results');
              }}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          )}
          {currentView === 'results' && analysisResult && (
            <ResultsView 
              key="results" 
              result={analysisResult} 
              onNew={() => {
                setAnalysisResult(null);
                setCurrentView('analyzer');
              }} 
            />
          )}
          {currentView === 'dashboard' && (
            <DashboardView key="dashboard" />
          )}
        </AnimatePresence>
      </main>
      </div>
    </div>
  );
}

// --- NAVBAR ---
function Navbar({ setView, currentView }: { setView: (v: any) => void, currentView: string }) {
  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group relative"
          onClick={() => setView('landing')}
        >
          <div className="absolute inset-0 bg-white/5 blur-xl rounded-full group-hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 duration-500" />
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.2),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.8),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.8),inset_0_0_6px_6px_rgba(255,255,255,0.2),inset_0_0_2px_2px_rgba(255,255,255,0.1),0_0_12px_rgba(0,0,0,0.15)] transition-all duration-300 backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,1)] transition-all duration-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] transition-all duration-500 relative">
            TruthLens
          </span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <button onClick={() => setView('analyzer')} className={`hover:text-foreground transition-colors ${currentView === 'analyzer' ? 'text-foreground' : ''}`}>Analyzer</button>
          <button onClick={() => setView('dashboard')} className={`hover:text-foreground transition-colors ${currentView === 'dashboard' ? 'text-foreground' : ''}`}>Dashboard</button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" }) + " text-muted-foreground hover:text-foreground"}>
                <Menu className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border-white/10">
                <DropdownMenuItem onClick={() => setView('analyzer')} className="cursor-pointer">Analyzer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView('dashboard')} className="cursor-pointer">Dashboard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

function StartAnalyzingSlideshow() {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % 2);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center overflow-hidden h-6 w-36">
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
        >
          {index === 0 ? "Start Analyzing" : <ArrowRight className="w-5 h-5" />}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// --- LANDING VIEW ---
function LandingView({ onStart }: { onStart: () => void, key?: React.Key }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto text-center mt-8 md:mt-24 space-y-10 md:space-y-12"
    >
      <div className="space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-balance bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 leading-tight">
          Uncover the truth in <br className="hidden sm:block"/> a world of noise.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 md:px-0">
          The most advanced AI-powered platform to detect fake news, deepfakes, and manipulated media instantly using multi-source cross-referencing.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 md:px-0">
        <LiquidButton size="xxl" onClick={onStart} className="w-full sm:w-auto font-bold text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]">
          <StartAnalyzingSlideshow />
        </LiquidButton>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="pt-16 md:pt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left px-4 md:px-0"
      >
        {[
          { icon: <Activity className="text-accent w-6 h-6"/>, title: "Real-time Verification", desc: "Cross-checks claims against trusted global news sources instantly." },
          { icon: <ImageIcon className="text-primary w-6 h-6"/>, title: "Deepfake Detection", desc: "Advanced forensic analysis detects AI generation and manipulation." },
          { icon: <ShieldCheck className="text-success w-6 h-6"/>, title: "Enterprise Security", desc: "Bank-grade privacy. Your data is analyzed and immediately discarded." }
        ].map((feature, i) => (
          <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="glass border-white/5 bg-white/5 h-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader>
                <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// --- ANALYZER VIEW ---
function AnalyzerView({ onAnalyze, isAnalyzing, setIsAnalyzing }: { onAnalyze: (r: AnalysisResult) => void, isAnalyzing: boolean, setIsAnalyzing: (b: boolean) => void, key?: React.Key }) {
  const [activeTab, setActiveTab] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [useHighThinking, setUseHighThinking] = useState(false);

  const handleAnalyze = async () => {
    if (!inputValue && files.length === 0) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("inputType", activeTab);
      formData.append("useHighThinking", useHighThinking ? "true" : "false");
      if (activeTab === 'url') formData.append("url", inputValue);
      if (activeTab === 'text') formData.append("text", inputValue);
      if (activeTab === 'image') {
        files.forEach(f => formData.append("files", f));
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Analysis failed";
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Non-JSON error response:", text.substring(0, 200));
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      onAnalyze(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze content. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-3xl mx-auto mt-12"
    >
      <Card className="glass border-white/10 shadow-2xl overflow-hidden rounded-3xl">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-3xl font-bold tracking-tight mb-2">New Analysis</h2>
          <p className="text-muted-foreground">Select an input method to begin verification.</p>
        </div>
        
        <div className="w-full">
          <div className="px-4 md:px-8 pt-6 flex justify-center">
            <div className="inline-flex h-12 md:h-14 rounded-2xl bg-white/5 p-1">
              <RadioGroup
                value={activeTab}
                onValueChange={setActiveTab}
                className="group relative inline-grid grid-cols-3 items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/3 after:rounded-xl after:bg-white/10 after:shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-primary/70 data-[state=url]:after:translate-x-0 data-[state=image]:after:translate-x-full data-[state=text]:after:translate-x-[200%] dark:after:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] w-[300px] md:w-[400px]"
                data-state={activeTab}
              >
                <div
                  className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-xl"
                  style={{ filter: 'url("#radio-glass")' }}
                />
                <label className="relative z-10 flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors text-muted-foreground/70 has-[:checked]:text-white has-[:checked]:font-semibold">
                  <LinkIcon className="w-4 h-4 md:w-5 md:h-5 mr-2"/><span className="hidden sm:inline">URL</span>
                  <RadioGroupItem id="tab-url" value="url" className="sr-only" />
                </label>
                <label className="relative z-10 flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors text-muted-foreground/70 has-[:checked]:text-white has-[:checked]:font-semibold">
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 mr-2"/><span className="hidden sm:inline">Image</span>
                  <RadioGroupItem id="tab-image" value="image" className="sr-only" />
                </label>
                <label className="relative z-10 flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors text-muted-foreground/70 has-[:checked]:text-white has-[:checked]:font-semibold">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2"/><span className="hidden sm:inline">Text</span>
                  <RadioGroupItem id="tab-text" value="text" className="sr-only" />
                </label>
                <GlassFilter />
              </RadioGroup>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {activeTab === 'url' && (
              <div className="mt-0 space-y-4">
                <Input 
                  placeholder="Paste news article or social media URL..." 
                  className="h-16 text-lg bg-white/5 border-white/10 focus-visible:ring-primary rounded-xl px-6"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            )}

            {activeTab === 'image' && (
              <div className="mt-0">
                <div 
                  className="border-2 border-dashed border-white/10 rounded-2xl h-48 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative overflow-hidden"
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selectedFiles = Array.from(e.target.files).slice(0, 3);
                        setFiles(selectedFiles);
                      }
                    }}
                  />
                  {files.length > 0 ? (
                    <div className="text-center">
                      <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
                      <p className="font-medium">{files.length} {files.length === 1 ? 'file' : 'files'} selected</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to replace (Max 3)</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <p className="font-medium text-muted-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">Supports JPG, PNG, WEBP (Max 3 photos, 10MB each)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="mt-0 space-y-4">
                <textarea 
                  placeholder="Paste the suspicious text content here..." 
                  className="w-full h-48 bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary rounded-xl p-6 text-base resize-none focus:outline-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="sr-only" checked={useHighThinking} onChange={(e) => setUseHighThinking(e.target.checked)} />
                  <div className={`w-10 h-6 bg-white/10 rounded-full transition-colors ${useHighThinking ? 'bg-primary/50' : ''}`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${useHighThinking ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white flex items-center">
                    <Activity className={`w-4 h-4 mr-1.5 transition-colors ${useHighThinking ? 'text-primary' : 'text-muted-foreground'}`} />
                    Deep Analysis Mode
                  </span>
                  <span className="text-xs text-muted-foreground transition-colors group-hover:text-muted-foreground/80">Uses advanced AI reasoning for complex claims</span>
                </div>
              </label>

              <LiquidButton 
                size="xxl" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || (!inputValue && files.length === 0)}
                className="w-full sm:w-auto px-10 font-bold text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.3)]"
              >
                {isAnalyzing ? (
                  <span className="flex items-center"><Activity className="animate-spin mr-2 w-5 h-5"/> Analyzing...</span>
                ) : (
                  <span className="flex items-center">Analyze Content <ArrowRight className="ml-2 w-5 h-5"/></span>
                )}
              </LiquidButton>
            </div>
          </div>
        </div>
        
        {isAnalyzing && (
          <div className="px-4 md:px-8 pb-8">
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <motion.span 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Orchestrating search...
                </motion.span>
                <motion.span 
                  animate={{ opacity: [1, 0.5, 1] }} 
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Extracting metadata...
                </motion.span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ x: "-100%" }} 
                  animate={{ x: "200%" }} 
                  transition={{ duration: 2, ease: "linear", repeat: Infinity }} 
                  style={{ width: "40%" }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// --- RESULTS VIEW ---
function ResultsView({ result, onNew }: { result: AnalysisResult, onNew: () => void, key?: React.Key }) {
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  
  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'verified': case 'likely true': return 'text-success bg-success/10 border-success/20';
      case 'false': case 'manipulated': case 'ai generated': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-warning bg-warning/10 border-warning/20';
    }
  };

  const verdictColorClass = getVerdictColor(result.verdict);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 mt-4"
    >
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onNew} className="text-muted-foreground hover:text-foreground">
           &larr; Back to Analyzer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <CardDescription className="mb-2 font-mono uppercase tracking-wider text-xs">Final Verdict</CardDescription>
                  <CardTitle className={`text-4xl md:text-5xl font-black ${verdictColorClass.split(' ')[0]}`}>
                    {result.verdict}
                  </CardTitle>
                </div>
                <Badge variant="outline" className={`px-4 py-2 text-sm font-bold rounded-xl border ${verdictColorClass} self-start`}>
                  {result.confidenceScore}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/> AI Summary</h3>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{result.summary}</p>
              
              <div className="mt-8">
                 <h3 className="text-lg font-semibold mb-3 flex items-center"><FileText className="w-5 h-5 mr-2 text-primary"/> Detailed Reasoning</h3>
                 <div className="bg-white/5 p-4 md:p-6 rounded-2xl border border-white/5">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{result.reasoning}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-primary"/> Evidence & Fact-Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {result.evidence && result.evidence.length > 0 ? (
                  result.evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="mt-1 mr-4 bg-primary/20 p-1 rounded-full shrink-0"><CheckCircle className="w-4 h-4 text-primary"/></div>
                      <span className="text-muted-foreground">{ev}</span>
                    </li>
                  ))
                ) : (
                   <p className="text-muted-foreground italic">No specific evidence points extracted.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle>Trust Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-white/10" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className={result.trustScore > 70 ? 'text-success' : result.trustScore > 40 ? 'text-warning' : 'text-danger'} strokeWidth="8" strokeDasharray={`${(result.trustScore / 100) * 283} 283`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">{result.trustScore}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Based on source credibility, cross-reference agreement, and authenticity signals.
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Sources Consulted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.sources && result.sources.length > 0 ? (
                  result.sources.map((src, idx) => (
                    <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors flex items-center justify-between">
                        {src.name} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{src.url}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No external sources cited.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`glass border-white/10 rounded-3xl mt-6 border-red-500/20 bg-red-500/5 transition-colors ${hasReported ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/10 cursor-pointer'}`} 
            onClick={async () => {
              if (hasReported || isReporting) return;
              setIsReporting(true);
              try {
                if (supabase) {
                  await supabase.from('reports').insert([
                    {
                      verdict: result.verdict,
                      summary: result.summary,
                      trust_score: result.trustScore,
                    }
                  ]);
                }
                toast.success('Report submitted. Thank you for your feedback!');
                setHasReported(true);
              } catch (error) {
                toast.error('Failed to submit report.');
              } finally {
                setIsReporting(false);
              }
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-red-400 flex items-center text-base">
                {isReporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                Report Inaccuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hasReported ? 'Thank you for your report.' : 'Did our AI make a mistake? Help us improve the model by reporting inaccurate verifications.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// --- DASHBOARD VIEW ---
function DashboardView() {
  const [stats, setStats] = useState({
    total: 1248,
    verified: 432,
    fake: 689,
    ai: 127,
  });
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('reports').select('verdict');
        if (error) throw error;
        
        if (data && data.length > 0) {
          let verified = 0;
          let fake = 0;
          let ai = 0;

          data.forEach((report) => {
            const v = report.verdict?.toLowerCase() || '';
            if (v.includes('verified') || v.includes('true')) verified++;
            else if (v.includes('false') || v.includes('fake') || v.includes('manipulated')) fake++;
            else if (v.includes('ai')) ai++;
          });

          setStats({
            total: data.length,
            verified,
            fake,
            ai
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        // Fallback to dummy stats on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const dynamicCategoryData = [
    { name: 'Verified True', value: stats.verified, color: '#10B981' },
    { name: 'Fake News', value: stats.fake, color: '#EF4444' },
    { name: 'AI Generated', value: stats.ai, color: '#06B6D4' },
  ].filter(d => d.value > 0);
  
  // Keep dummy activity data if we don't have enough history or as placeholder
  const dynamicActivityData = [
    { name: 'Mon', verified: 40, false: 24, ai: 10 },
    { name: 'Tue', verified: 30, false: 13, ai: 22 },
    { name: 'Wed', verified: 20, false: 58, ai: 29 },
    { name: 'Thu', verified: 27, false: 39, ai: 20 },
    { name: 'Fri', verified: 18, false: 48, ai: 21 },
    { name: 'Sat', verified: 23, false: 38, ai: 25 },
    { name: 'Sun', verified: Math.max(34, stats.verified), false: Math.max(43, stats.fake), ai: Math.max(21, stats.ai) },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto mt-4 space-y-6 md:space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between">
        <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center md:text-left">Dashboard Overview</motion.h2>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2 md:mt-0" />}
      </div>
      
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "Total Reported", val: stats.total.toString() },
          { title: "Verified True", val: stats.verified.toString(), color: "text-success" },
          { title: "Fake / Manipulated", val: stats.fake.toString(), color: "text-danger" },
          { title: "AI Generated", val: stats.ai.toString(), color: "text-accent" },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="glass border-white/10 rounded-2xl bg-white/5 h-full">
              <CardHeader className="pb-2">
                <CardDescription>{stat.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-black ${stat.color || ''}`}>{stat.val}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass border-white/10 rounded-3xl bg-white/5 h-full">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Analysis volume over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 pb-6">
              <div className="h-[250px] md:h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFalse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Area type="monotone" dataKey="false" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFalse)" />
                    <Area type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-white/10 rounded-3xl bg-white/5 h-full">
            <CardHeader>
              <CardTitle>Content Distribution</CardTitle>
              <CardDescription>Breakdown by verdict category</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="h-[200px] md:h-[250px] w-full flex items-center justify-center">
                {dynamicCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {dynamicCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground h-full w-full">
                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No data yet</p>
                  </div>
                )}
              </div>
            <div className="flex justify-center space-x-4 mt-2">
              {dynamicCategoryData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

