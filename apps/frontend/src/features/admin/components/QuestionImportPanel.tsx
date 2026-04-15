import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";

export function QuestionImportPanel({ examId }: { examId: string }) {
  const queryClient = useQueryClient();
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [assetsFile, setAssetsFile] = useState<File | null>(null);
  const [assetUpload, setAssetUpload] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!sheetFile) {
        throw new Error("Choose a CSV or XLSX sheet first.");
      }

      const formData = new FormData();
      formData.append("sheet", sheetFile);
      if (assetsFile) {
        formData.append("assets", assetsFile);
      }

      return apiClient.postForm(`/admin/exams/${examId}/questions/import`, formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      await queryClient.invalidateQueries({ queryKey: ["exam-detail", examId] });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!assetUpload) {
        throw new Error("Choose an asset to upload.");
      }

      const formData = new FormData();
      formData.append("examId", examId);
      formData.append("asset", assetUpload);
      return apiClient.postForm<{ assetUrl: string }>("/admin/uploads/asset", formData);
    }
  });

  const handleImport = (event: FormEvent) => {
    event.preventDefault();
    importMutation.mutate();
  };

  const handleAssetUpload = (event: FormEvent) => {
    event.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl text-ink">Bulk Import</h3>
              <p className="text-sm text-muted">Replace the exam question bank with a validated spreadsheet and optional ZIP of assets.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/question_upload_template.xlsx';
                link.setAttribute('download', 'question_upload_template.xlsx');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Excel Template
            </Button>
          </div>

        <form className="space-y-4" onSubmit={handleImport}>
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-ink">Questions Sheet</span>
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setSheetFile(event.target.files?.[0] ?? null)} />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium text-ink">Assets ZIP</span>
            <Input type="file" accept=".zip" onChange={(event) => setAssetsFile(event.target.files?.[0] ?? null)} />
          </label>
          {importMutation.error ? <p className="text-sm text-rose-700">{(importMutation.error as Error).message}</p> : null}
          <Button type="submit" disabled={importMutation.isPending}>
            {importMutation.isPending ? "Importing..." : "Import Questions"}
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Asset Upload</h3>
          <p className="text-sm text-muted">Upload a single image first if you want to reference it directly in the question composer.</p>
        </div>
        <form className="space-y-4" onSubmit={handleAssetUpload}>
          <Input type="file" onChange={(event) => setAssetUpload(event.target.files?.[0] ?? null)} />
          {uploadMutation.data ? (
            <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
              Asset URL: {uploadMutation.data.assetUrl}
            </p>
          ) : null}
          {uploadMutation.error ? <p className="text-sm text-rose-700">{(uploadMutation.error as Error).message}</p> : null}
          <Button type="submit" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : "Upload Asset"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
