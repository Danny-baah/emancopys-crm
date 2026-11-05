import Link from "next/link";
import { getImportBatches } from "@/actions/import";
import { requireAuth } from "@/lib/auth-utils";
import {
  FileSpreadsheet,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
} from "lucide-react";

export default async function ImportHistoryPage() {
  await requireAuth();
  const batches = await getImportBatches();

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#708078] hover:text-[#182922] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leads Directory</span>
          </Link>
          <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
            Import History &amp; Audit Trail
          </h1>
          <p className="text-sm text-[#708078] mt-1.5 font-normal">
            Comprehensive log of all bulk spreadsheet imports, duplicate detections, and batch metrics.
          </p>
        </div>

        <Link href="/leads/import">
          <button
            type="button"
            className="h-11 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.2]" />
            <span>New Bulk Import</span>
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-[24px] border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        {batches.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#708078] space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-[#8a9992] mx-auto opacity-50" />
            <p className="font-semibold text-sm text-[#182922]">No import batches recorded yet</p>
            <p className="text-[#8a9992]">
              Use the bulk import tool to upload CSV or Excel files. Every session is tracked here.
            </p>
            <div className="pt-2">
              <Link href="/leads/import">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl bg-[#083d34] text-white text-xs font-semibold"
                >
                  Start First Import
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0f3f1] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase bg-[#fafbfb]/60">
                  <th className="py-3.5 pl-6 pr-3 font-semibold">File / Batch ID</th>
                  <th className="py-3.5 px-3 font-semibold">Import Date</th>
                  <th className="py-3.5 px-3 font-semibold">Imported By</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Total Processed</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Successful</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Skipped (Dupes)</th>
                  <th className="py-3.5 pr-6 pl-3 font-semibold text-center">Failed (Errors)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f8f6]">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#fafbfb] transition-colors">
                    {/* File info */}
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#182922]">
                            {b.fileName}
                          </div>
                          <div className="text-[10px] text-[#8a9992] mt-0.5 font-mono">
                            ID: {b.id.slice(0, 10)}... &bull; {b.source}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-3 text-[#556660]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8a9992]" />
                        <span>{formatDate(b.createdAt)}</span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#083d34] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                          {b.user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[#3c4c45] font-medium">{b.user.name}</span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-3 text-center font-bold text-[#182922]">
                      {b.totalRows}
                    </td>

                    {/* Successful */}
                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f6ed] text-[#2d7a4f] border border-[#cbe8d5]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{b.successfulRows}</span>
                      </span>
                    </td>

                    {/* Skipped */}
                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff7e6] text-[#d46b08] border border-[#ffd591]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{b.skippedRows}</span>
                      </span>
                    </td>

                    {/* Failed */}
                    <td className="py-4 pr-6 pl-3 text-center">
                      {b.failedRows > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fdeef0] text-[#c95965] border border-[#fad5d9]">
                          <XCircle className="w-3 h-3" />
                          <span>{b.failedRows}</span>
                        </span>
                      ) : (
                        <span className="text-[#a0aca6]">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
