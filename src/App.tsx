/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Youtube, Loader2, Send, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MODELS = [
  { id: 'gemini-2.0-flash-latest', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' },
];

export default function App() {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ link: string; summary: string; date: string }[]>([]);

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeLink.trim()) {
      setError('Please enter a YouTube link.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Summarize the following YouTube video: ${youtubeLink}. 
      ${additionalPrompt ? `Additional instructions: ${additionalPrompt}` : ''}
      Please provide a concise and structured summary with key takeaways.`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        setSummary(text);
        setHistory(prev => [{
          link: youtubeLink,
          summary: text,
          date: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));
      } else {
        throw new Error('No summary generated.');
      }
    } catch (err: any) {
      console.error('Summarization error:', err);
      setError(err.message || 'An error occurred while generating the summary.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 bg-red-600 rounded-2xl mb-4 shadow-lg shadow-red-200"
          >
            <Youtube className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">YouTube Summarizer</h1>
          <p className="text-neutral-500">Get instant insights from any YouTube video using Gemini AI.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200"
            >
              <form onSubmit={handleSummarize} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-neutral-700">YouTube Link</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                    />
                    <Youtube className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-700">AI Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none appearance-none"
                    >
                      {MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-700">Tone / Context (Optional)</label>
                    <input
                      type="text"
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      placeholder="e.g. Explain like I'm five"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Summarize Video
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Result Area */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Summary Generated</span>
                    </div>
                    <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold">
                      {MODELS.find(m => m.id === selectedModel)?.name}
                    </span>
                  </div>
                  <div className="prose prose-neutral max-w-none prose-headings:font-bold prose-p:text-neutral-600 prose-li:text-neutral-600">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <div className="flex items-center gap-2 mb-4 text-neutral-700">
                <History className="w-5 h-5" />
                <h3 className="font-semibold">Recent Summaries</h3>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-neutral-400 italic">No recent activity.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-red-200 transition-colors cursor-pointer group" onClick={() => setSummary(item.summary)}>
                      <p className="text-xs font-medium text-neutral-400 mb-1">{item.date}</p>
                      <p className="text-sm text-neutral-600 line-clamp-1 group-hover:text-red-600 transition-colors">{item.link}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-red-600 p-6 rounded-2xl shadow-lg shadow-red-200 text-white">
              <h3 className="font-bold mb-2">Pro Tip</h3>
              <p className="text-sm text-red-100 leading-relaxed">
                Try using the "Explain like I'm five" prompt for complex technical videos to get a simpler overview.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
