import { NextResponse } from "next/server";
import {
  loadJobs,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
} from "@/lib/agency-store";
import type { JobStatus, JobPriority } from "@/lib/agency-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: JobStatus[] = [
  "saved", "applied", "phone_screen", "interview",
  "final_round", "offer", "accepted", "rejected", "withdrawn",
];

const VALID_PRIORITIES: JobPriority[] = ["low", "medium", "high", "urgent"];

// GET /api/agency/jobs — list all job applications
export async function GET() {
  try {
    const jobs = await loadJobs();
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ jobs: [] });
  }
}

// POST /api/agency/jobs — create a new job application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.company || !body.role) {
      return NextResponse.json(
        { error: "Missing required fields: company, role" },
        { status: 400 }
      );
    }
    const status: JobStatus = VALID_STATUSES.includes(body.status) ? body.status : "saved";
    const priority: JobPriority = VALID_PRIORITIES.includes(body.priority) ? body.priority : "medium";

    const job = await createJobApplication({
      company: body.company,
      role: body.role,
      location: body.location || "",
      remote: body.remote ?? true,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      salaryNote: body.salaryNote || "",
      jobUrl: body.jobUrl || "",
      status,
      priority,
      appliedDate: body.appliedDate || null,
      deadline: body.deadline || null,
      contactName: body.contactName || "",
      contactEmail: body.contactEmail || "",
      source: body.source || "LinkedIn",
      notes: body.notes || "",
    });
    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PUT /api/agency/jobs — update a job application
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }
    const { id, ...updates } = body;

    // Validate status/priority if provided
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (updates.priority && !VALID_PRIORITIES.includes(updates.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const job = await updateJobApplication(id, updates);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, job });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/agency/jobs — delete a job application
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }
    const deleted = await deleteJobApplication(id);
    if (!deleted) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
