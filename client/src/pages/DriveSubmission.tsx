import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Drive = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  allowedFileTypes: string[];
  maxFileSize: number;
};

export default function DriveSubmission() {
  const { driveId } = useParams<{ driveId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    section: "",
    department: "",
    year: 1,
    eventCategory: "",
  });

  const driveQuery = useQuery<Drive>({
    queryKey: ["/api/drive", driveId],
    queryFn: async () => {
      const response = await fetch(`/api/drive/${driveId}`);
      if (!response.ok) throw new Error("Drive not found");
      return response.json();
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Missing file", description: "Upload a certificate file", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("section", form.section);
      payload.append("department", form.department);
      payload.append("year", String(form.year));
      payload.append("eventCategory", form.eventCategory);
      payload.append("certificateFile", file);

      const response = await fetch(`/api/drive/${driveId}/submit`, { method: "POST", body: payload });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Submission failed");

      toast({ title: "Submitted", description: "Certificate submitted successfully." });
      setForm({ name: "", section: "", department: "", year: 1, eventCategory: "" });
      setFile(null);
    } catch (error: any) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl p-6 space-y-4">
        {driveQuery.isLoading ? <p>Loading drive...</p> : (
          <>
            <div>
              <h1 className="text-2xl font-semibold">{driveQuery.data?.title || "Drive Submission"}</h1>
              <p className="text-sm text-muted-foreground">{driveQuery.data?.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Deadline: {driveQuery.data ? new Date(driveQuery.data.deadline).toLocaleString() : ""}
              </p>
            </div>

            <form className="grid md:grid-cols-2 gap-3" onSubmit={submit}>
              <Input placeholder="Student Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              <Input placeholder="Section" value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} required />
              <Input placeholder="Department" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} required />
              <Input type="number" min={1} max={8} placeholder="Year" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))} required />
              <Input className="md:col-span-2" placeholder="Event Category" value={form.eventCategory} onChange={(e) => setForm((p) => ({ ...p, eventCategory: e.target.value }))} required />
              <div className="md:col-span-2 space-y-2">
                <Label>Certificate File</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
              </div>
              <Button className="md:col-span-2" disabled={isLoading}>{isLoading ? "Submitting..." : "Submit Certificate"}</Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
