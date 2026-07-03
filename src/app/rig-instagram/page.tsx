"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CopilotDrawer, PERSONAS } from "@/components/CopilotDrawer";
import {
  Camera, Heart, MessageCircle, Bookmark, BarChart3,
  Image as ImageIcon, Film, Users, TrendingUp, Plus, Loader2,
} from "lucide-react";

export default function InstagramStudioPage() {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const persona = PERSONAS.instagram;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}>
            Instagram Studio
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--cream-mute)" }}>
            Visual storytelling · Reels · Engagement · Brand building
          </p>
        </div>
        <button
          onClick={() => setCopilotOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
          style={{ background: `${persona.accent}20`, color: persona.accent, border: `1px solid ${persona.accent}44` }}
        >
          <div className="grid place-items-center w-6 h-6 rounded-md font-bold text-[10px]" style={{ background: `${persona.accent}33` }}>
            {persona.glyph}
          </div>
          <span className="text-[13px] font-medium">Ask {persona.name}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Followers", value: "12.4K", icon: Users, color: "#E1306C" },
          { label: "Engagement", value: "4.8%", icon: Heart, color: "#f43f5e" },
          { label: "Posts", value: "284", icon: ImageIcon, color: "#833AB4" },
          { label: "Avg Reels Views", value: "8.2K", icon: Film, color: "#F77737" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel p-5 rounded-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: `${stat.color}18`, color: stat.color }}>
                <stat.icon size={16} />
              </div>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--cream)" }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Posts */}
        <div className="panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
              Content Queue
            </h3>
            <button className="text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1" style={{ background: "var(--gold)20", color: "var(--gold)" }}>
              <Plus size={12} /> New Post
            </button>
          </div>
          <div className="space-y-3">
            {[
              { type: "Reel", caption: "AI tools that replace entire teams", status: "scheduled", time: "Today 3PM" },
              { type: "Carousel", caption: "5 startup metrics that actually matter", status: "draft", time: "Tomorrow" },
              { type: "Story", caption: "Behind the scenes: RIG OS build", status: "scheduled", time: "Wed 9AM" },
            ].map((post, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="grid place-items-center w-10 h-10 rounded-md text-[9px] font-bold" style={{ background: "#833AB422", color: "#833AB4" }}>
                  {post.type === "Reel" ? <Film size={16} /> : post.type === "Carousel" ? <ImageIcon size={16} /> : <Camera size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
                    {post.caption}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                    {post.type} · {post.time}
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
                  background: post.status === "scheduled" ? "#22c55e18" : "#fbbf2418",
                  color: post.status === "scheduled" ? "#22c55e" : "#fbbf24",
                }}>
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="panel p-5 rounded-xl">
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: "var(--cream)" }}>
            Performance (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {[
              { label: "Reach", value: "142K", change: "+18%" },
              { label: "Profile Visits", value: "8.2K", change: "+24%" },
              { label: "Website Clicks", value: "1.1K", change: "+12%" },
              { label: "Saves", value: "2.4K", change: "+31%" },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{metric.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{metric.value}</span>
                  <span className="text-[10px] font-bold" style={{ color: "#22c55e" }}>{metric.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copilot */}
      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} personaId="instagram" />
    </div>
  );
}
