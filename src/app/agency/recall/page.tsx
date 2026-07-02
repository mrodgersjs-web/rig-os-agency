"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain, CheckCircle2, XCircle, Clock, RefreshCw,
  ExternalLink, Activity, Globe, Zap, ShieldCheck,
} from "lucide-react";

interface RecallStatus {
  service: string;
  url: string;
  status: 'online' | 'offline';
  httpStatus: string;
  reachable: boolean;
  title: string;
  responseTime: string;
  checkedAt: string;
  real: boolean;
}

export default function RecallPage() {
  const [data, setData] = useState<RecallStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/agency/recall");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // leave existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isOnline = data?.reachable ?? false;

  const statusCards = [
    { label: "Service", value: data?.service ?? "Recall.it", icon: Brain, color: "var(--gold)" },
    { label: "HTTP Status", value: data?.httpStatus ?? "—", icon: Globe, color: isOnline ? "var(--emerald)" : "#ef4444" },
    { label: "Response Time", value: data?.responseTime ?? "—", icon: Zap, color: "var(--cream)" },
    { label: "Last Checked", value: data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : "—", icon: Clock, color: "var(--cream)" },
  ];

  return (
    <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="eyebrow mb-4">
          <span className="num">∞</span>
          <span className="line" />
          <span className="label">Integrations</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Recall.it Integration</h1>
            <p className="page-subtitle">Live connectivity status for app.recall.it — AI-powered meeting memory and knowledge recall.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="panel px-4 py-2 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            style={{ borderColor: "var(--gold)" }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} style={{ color: "var(--gold)" }} />
            <span style={{ color: "var(--cream)" }}>{refreshing ? "Checking…" : "Refresh"}</span>
          </motion.button>
        </div>
      </header>

      {/* Big Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="panel p-8 mb-6 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: isOnline
              ? "radial-gradient(circle at 30% 50%, var(--emerald), transparent 70%)"
              : "radial-gradient(circle at 30% 50%, #ef4444, transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: isOnline ? "rgba(90,184,150,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${isOnline ? "var(--emerald)" : "#ef4444"}`,
            }}
          >
            {loading ? (
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--gold)" }} />
            ) : isOnline ? (
              <CheckCircle2 className="w-8 h-8" style={{ color: "var(--emerald)" }} />
            ) : (
              <XCircle className="w-8 h-8" style={{ color: "#ef4444" }} />
            )}
          </motion.div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest opacity-50 mb-1">
              Integration Status
            </div>
            <div
              className="text-3xl font-bold"
              style={{ color: isOnline ? "var(--emerald)" : "#ef4444" }}
            >
              {loading ? "Checking…" : isOnline ? "Connected" : "Offline"}
            </div>
            <div className="text-sm opacity-50 mt-1">
              {data?.url ?? "https://app.recall.it"} — {data?.title ?? "Recall.it"}
            </div>
          </div>
          {isOnline && (
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              href={data?.url ?? "https://app.recall.it"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer"
              style={{
                background: "rgba(212,165,116,0.1)",
                color: "var(--gold)",
                border: "1px solid var(--gold)",
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open Recall
            </motion.a>
          )}
        </div>
      </motion.div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statusCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="panel p-5"
          >
            <card.icon className="w-5 h-5 mb-2" style={{ color: card.color }} />
            <div className="text-xs uppercase tracking-widest opacity-50">{card.label}</div>
            <div className="text-lg font-bold mt-1 font-mono" style={{ color: "var(--cream)" }}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Details */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="panel p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <h3 className="text-sm uppercase tracking-widest opacity-50">Connection Details</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Endpoint", value: data?.url ?? "https://app.recall.it", icon: Globe },
              { label: "HTTP Status", value: data?.httpStatus ?? "—", icon: ShieldCheck },
              { label: "Page Title", value: data?.title ?? "—", icon: Brain },
              { label: "Response Time", value: data?.responseTime ?? "—", icon: Zap },
              { label: "Last Checked", value: data?.checkedAt ? new Date(data.checkedAt).toLocaleString() : "—", icon: Clock },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 opacity-50" />
                  <span className="text-sm opacity-70">{item.label}</span>
                </div>
                <span className="text-sm font-mono" style={{ color: "var(--cream)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* About Recall Panel */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="panel p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4" style={{ color: "var(--emerald)" }} />
            <h3 className="text-sm uppercase tracking-widest opacity-50">About Recall.it</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm opacity-70 leading-relaxed">
              Recall.it captures and indexes meetings, conversations, and knowledge sources
              so you can search and recall anything that was ever discussed. It integrates
              with your calendar, Zoom, Google Meet, and other tools to build a searchable
              memory layer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Meeting Recording", icon: Activity },
                { label: "Transcription", icon: Brain },
                { label: "Search & Recall", icon: Zap },
                { label: "Calendar Sync", icon: Clock },
              ].map((feat) => (
                <div
                  key={feat.label}
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <feat.icon className="w-4 h-4" style={{ color: "var(--gold)" }} />
                  <span className="text-xs opacity-70">{feat.label}</span>
                </div>
              ))}
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: isOnline ? "rgba(90,184,150,0.05)" : "rgba(239,68,68,0.05)",
              }}
            >
              {isOnline ? (
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--emerald)" }} />
              ) : (
                <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
              )}
              <span className="text-xs opacity-60">
                {isOnline
                  ? "Service is reachable and ready for API integration."
                  : "Service is not reachable. Check network or try again later."}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}