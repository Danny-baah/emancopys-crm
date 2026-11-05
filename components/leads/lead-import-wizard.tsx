"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  validateAndPreviewImport,
  executeImport,
  type MappedLeadRow,
  type ImportPreviewResponse,
} from "@/actions/import";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
  Download,
  Check,
} from "lucide-react";
import Link from "next/link";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface LeadImportWizardProps {
  assignableUsers: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}

const CRM_FIELDS = [
  { key: "companyName", label: "Company / Organization Name", required: true, aliases: ["company", "organization", "business", "company name", "client"] },
  { key: "contactPerson", label: "Contact Person", required: true, aliases: ["contact", "contact person", "name", "full name", "person", "representative"] },
  { key: "email", label: "Email Address", required: false, aliases: ["email", "e-mail", "email address", "mail"] },
  { key: "phone", label: "Phone Number", required: false, aliases: ["phone", "telephone", "mobile", "cell", "phone number"] },
  { key: "jobTitle", label: "Job Title / Designation", required: false, aliases: ["title", "job title", "position", "role", "designation"] },
  { key: "industry", label: "Industry / Sector", required: false, aliases: ["industry", "sector", "business type"] },
  { key: "location", label: "City / Location", required: false, aliases: ["location", "city", "address", "town", "region"] },
  { key: "status", label: "Pipeline Status", required: false, aliases: ["status", "lead status", "stage"] },
  { key: "estimatedValue", label: "Estimated Deal Value ($)", required: false, aliases: ["value", "deal value", "estimated value", "amount", "budget"] },
  { key: "notes", label: "Notes / Description", required: false, aliases: ["notes", "description", "remarks", "comments"] },
];

export function LeadImportWizard({
  assignableUsers,
  isAdmin,
  currentUserId,
}: LeadImportWizardProps) {
  // Wizard Steps: 1: Upload, 2: Map, 3: Preview, 4: Done
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Step 2 State
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Step 3 State
  const [isValidating, setIsValidating] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResponse | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    isAdmin ? "" : currentUserId
  );
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "duplicate" | "error">("all");

  // Step 4 State
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    successful: number;
    skipped: number;
    failed: number;
    batchId: string;
  } | null>(null);

  // 1. Download Sample Spreadsheet Template
  function downloadSampleTemplate() {
    const sampleData = [
      {
        "Company Name": "Ashanti Precision Manufacturing",
        "Contact Person": "Akua Servaa",
        "Email": "akua@ashantimanufacturing.com",
        "Phone": "+233 24 123 4567",
        "Job Title": "Procurement Manager",
        "Industry": "Manufacturing",
        "Location": "Kumasi, Ghana",
        "Status": "NEW",
        "Estimated Value": 15000,
        "Notes": "Met at Ghana Industrial Expo. Looking for bulk corporate packaging.",
      },
      {
        "Company Name": "Kumasi PrintCorp Ltd",
        "Contact Person": "Kofi Mensah",
        "Email": "kofi@kumasiprintcorp.com",
        "Phone": "+233 50 987 6543",
        "Job Title": "Managing Director",
        "Industry": "Publishing",
        "Location": "Kumasi, Ghana",
        "Status": "CONTACTED",
        "Estimated Value": 8500,
        "Notes": "Annual educational catalog printing quotation requested.",
      },
      {
        "Company Name": "GoldenTech Solutions",
        "Contact Person": "Emmanuel Boateng",
        "Email": "emmanuel@goldentech.com",
        "Phone": "+233 27 321 0987",
        "Job Title": "IT Director",
        "Industry": "IT Services",
        "Location": "Accra, Ghana",
        "Status": "QUALIFIED",
        "Estimated Value": 22000,
        "Notes": "Corporate identity cards and custom brochures required.",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Leads");
    XLSX.writeFile(workbook, "emancopys_leads_import_sample.xlsx");
  }

  // 2. Handle File Selection and Parsing
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    // Validate extension
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(extension || "")) {
      toast.error("Invalid file format. Please upload a valid .csv, .xlsx, or .xls file.");
      return;
    }

    setIsParsing(true);
    setFile(selectedFile);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      if (workbook.SheetNames.length === 0) {
        throw new Error("Uploaded workbook contains no visible sheets.");
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const parsedData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      if (parsedData.length === 0) {
        throw new Error("Uploaded spreadsheet is empty. Please check the sheet data.");
      }

      // Extract headers from keys of the first row
      const headers = Object.keys(parsedData[0]);
      setFileHeaders(headers);
      setRawRows(parsedData);

      // Intelligent Auto-Mapping
      const initialMap: Record<string, string> = {};
      CRM_FIELDS.forEach((field) => {
        const matchingHeader = headers.find((h) => {
          const cleanH = h.toLowerCase().trim();
          return field.aliases.some((alias) => cleanH === alias || cleanH.includes(alias));
        });
        if (matchingHeader) {
          initialMap[field.key] = matchingHeader;
        }
      });
      setColumnMapping(initialMap);

      toast.success(`Loaded ${parsedData.length} records from ${selectedFile.name}`);
      setCurrentStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to parse spreadsheet.";
      toast.error(message);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  }

  // 3. Proceed from Mapping to Preview
  async function handleProceedToPreview() {
    // Check required fields
    if (!columnMapping.companyName) {
      toast.error("Please map the 'Company / Organization Name' column.");
      return;
    }
    if (!columnMapping.contactPerson) {
      toast.error("Please map the 'Contact Person' column.");
      return;
    }

    setIsValidating(true);

    try {
      // Map raw rows to MappedLeadRow objects
      const mappedRows: MappedLeadRow[] = rawRows.map((row) => ({
        companyName: String(row[columnMapping.companyName] || ""),
        contactPerson: String(row[columnMapping.contactPerson] || ""),
        email: columnMapping.email ? String(row[columnMapping.email] || "") : undefined,
        phone: columnMapping.phone ? String(row[columnMapping.phone] || "") : undefined,
        jobTitle: columnMapping.jobTitle ? String(row[columnMapping.jobTitle] || "") : undefined,
        industry: columnMapping.industry ? String(row[columnMapping.industry] || "") : undefined,
        location: columnMapping.location ? String(row[columnMapping.location] || "") : undefined,
        status: columnMapping.status ? String(row[columnMapping.status] || "") : undefined,
        estimatedValue:
          columnMapping.estimatedValue && row[columnMapping.estimatedValue]
            ? Number(String(row[columnMapping.estimatedValue]).replace(/[^0-9.]/g, ""))
            : undefined,
        notes: columnMapping.notes ? String(row[columnMapping.notes] || "") : undefined,
      }));

      // Call server validation & duplicate detection
      const preview = await validateAndPreviewImport(mappedRows);
      setPreviewResult(preview);
      setCurrentStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to validate records.";
      toast.error(message);
    } finally {
      setIsValidating(false);
    }
  }

  // 4. Confirm and Execute Import
  async function handleExecuteImport() {
    if (!previewResult || !file) return;

    setIsImporting(true);
    try {
      const rowsToImport: MappedLeadRow[] = previewResult.rows.map((r) => r.data);

      const res = await executeImport({
        fileName: file.name,
        fileType: file.name.split(".").pop() || "xlsx",
        rows: rowsToImport,
        skipDuplicates,
        defaultAssignedToId: selectedAssignee || undefined,
      });

      setImportSummary({
        successful: res.successfulRows,
        skipped: res.skippedRows,
        failed: res.failedRows,
        batchId: res.batchId,
      });

      toast.success(`Successfully imported ${res.successfulRows} leads!`);
      setCurrentStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import execution failed.";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  // Filter preview rows
  const filteredPreviewRows = previewResult?.rows.filter((r) => {
    if (previewFilter === "valid") return r.isValid && !r.isDuplicate;
    if (previewFilter === "duplicate") return r.isDuplicate;
    if (previewFilter === "error") return !r.isValid;
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Wizard Progress Stepper */}
      <div className="bg-white rounded-[24px] p-5 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 indicator */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep >= 1
                  ? "bg-[#083d34] text-white shadow-xs"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "1"}
            </div>
            <span
              className={`text-xs font-semibold ${
                currentStep >= 1 ? "text-[#182922]" : "text-[#708078]"
              }`}
            >
              Upload File
            </span>
          </div>

          <div className="w-12 h-0.5 bg-[#e8ecea]" />

          {/* Step 2 indicator */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep >= 2
                  ? "bg-[#083d34] text-white shadow-xs"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "2"}
            </div>
            <span
              className={`text-xs font-semibold ${
                currentStep >= 2 ? "text-[#182922]" : "text-[#708078]"
              }`}
            >
              Map Columns
            </span>
          </div>

          <div className="w-12 h-0.5 bg-[#e8ecea]" />

          {/* Step 3 indicator */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep >= 3
                  ? "bg-[#083d34] text-white shadow-xs"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {currentStep > 3 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "3"}
            </div>
            <span
              className={`text-xs font-semibold ${
                currentStep >= 3 ? "text-[#182922]" : "text-[#708078]"
              }`}
            >
              Review &amp; Duplicates
            </span>
          </div>

          <div className="w-12 h-0.5 bg-[#e8ecea]" />

          {/* Step 4 indicator */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                currentStep === 4
                  ? "bg-[#083d34] text-white shadow-xs"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              4
            </div>
            <span
              className={`text-xs font-semibold ${
                currentStep === 4 ? "text-[#182922]" : "text-[#708078]"
              }`}
            >
              Summary
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {currentStep === 1 && (
        <div className="bg-white rounded-[24px] p-8 lg:p-12 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="font-serif text-2xl font-semibold text-[#13231c]">
              Upload Spreadsheet File
            </h2>
            <p className="text-xs text-[#708078] mt-1.5 leading-relaxed">
              Upload your Excel (.xlsx, .xls) or CSV file containing lead contacts. We will detect headers and guide you through column mapping.
            </p>
          </div>

          {/* Upload Drop Area */}
          <div className="relative border-2 border-dashed border-[#d8e0dc] hover:border-[#083d34] rounded-[24px] p-10 text-center transition-colors bg-[#fafbfb]">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isParsing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center mb-4 shadow-2xs">
                {isParsing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#083d34]" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-semibold text-[#182922]">
                {isParsing ? "Reading spreadsheet data..." : "Click or drag your file here to upload"}
              </p>
              <p className="text-xs text-[#708078] mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV files up to 10MB
              </p>
            </div>
          </div>

          {/* Download Sample Template Helper */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#fbf5ee] border border-[#faecd8]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f9ebd7] text-[#ba7528] flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#182922]">
                  Need an Excel template to get started?
                </p>
                <p className="text-[11px] text-[#708078]">
                  Download our formatted template with standard columns and sample records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="h-9 px-4 rounded-xl bg-white border border-[#e1e6e3] text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Download Sample .xlsx
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {currentStep === 2 && (
        <div className="bg-white rounded-[24px] p-8 lg:p-10 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f3f1]">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#13231c]">
                Map Spreadsheet Columns
              </h2>
              <p className="text-xs text-[#708078] mt-1">
                File: <strong className="text-[#182922]">{file?.name}</strong> &bull; {rawRows.length} records detected
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleProceedToPreview}
                disabled={isValidating}
                className="h-10 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Duplicates...</span>
                  </>
                ) : (
                  <>
                    <span>Review &amp; Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CRM_FIELDS.map((field) => {
              const mappedColumn = columnMapping[field.key] || "";
              const sampleVal = mappedColumn && rawRows[0] ? String(rawRows[0][mappedColumn] || "") : "";

              return (
                <div
                  key={field.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    mappedColumn
                      ? "border-[#d8ebe0] bg-[#fafdfb]"
                      : field.required
                      ? "border-red-200 bg-red-50/30"
                      : "border-[#e8ecea] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#182922] flex items-center gap-1.5">
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="text-red-500 font-bold" title="Required">*</span>
                      )}
                    </label>

                    {field.required && !mappedColumn && (
                      <span className="text-[10px] text-red-600 font-semibold px-2 py-0.5 rounded-full bg-red-100">
                        Required
                      </span>
                    )}
                  </div>

                  <select
                    value={mappedColumn}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34]"
                  >
                    <option value="">— Do not import this field —</option>
                    {fileHeaders.map((header) => (
                      <option key={header} value={header}>
                        Spreadsheet Column: &quot;{header}&quot;
                      </option>
                    ))}
                  </select>

                  {sampleVal && (
                    <p className="text-[11px] text-[#708078] mt-1.5 truncate">
                      Row 1 Preview: <span className="text-[#182922] font-medium">&quot;{sampleVal}&quot;</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & DUPLICATE DETECTION */}
      {currentStep === 3 && previewResult && (
        <div className="bg-white rounded-[24px] p-8 lg:p-10 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f3f1]">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#13231c]">
                Review Import Preview
              </h2>
              <p className="text-xs text-[#708078] mt-1">
                Inspect parsed records, detected duplicates, and potential row validation errors.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
              >
                Back to Mapping
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || previewResult.validCount === 0}
                className="h-10 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Import...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Import Records</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#fafbfb] border border-[#e8ecea]">
              <div className="text-[11px] text-[#708078] font-medium">Total Rows</div>
              <div className="font-serif text-2xl font-semibold text-[#13231c] mt-0.5">
                {previewResult.totalRows}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#e8f6ed] border border-[#cbe8d5]">
              <div className="text-[11px] text-[#2d7a4f] font-medium">Valid Ready</div>
              <div className="font-serif text-2xl font-semibold text-[#2d7a4f] mt-0.5">
                {previewResult.validCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fff7e6] border border-[#ffd591]">
              <div className="text-[11px] text-[#d46b08] font-medium">Duplicates Detected</div>
              <div className="font-serif text-2xl font-semibold text-[#d46b08] mt-0.5">
                {previewResult.duplicateCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fdeef0] border border-[#fad5d9]">
              <div className="text-[11px] text-[#c95965] font-medium">Invalid / Missing Fields</div>
              <div className="font-serif text-2xl font-semibold text-[#c95965] mt-0.5">
                {previewResult.invalidCount}
              </div>
            </div>
          </div>

          {/* Controls: Skip Duplicates & Assignment */}
          <div className="p-4 rounded-2xl bg-[#fafbfb] border border-[#e8ecea] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded border-[#cbd5d0] text-[#083d34] focus:ring-[#083d34]"
              />
              <div>
                <span className="text-xs font-semibold text-[#182922]">
                  Skip detected duplicate records automatically
                </span>
                <p className="text-[11px] text-[#708078]">
                  Prevents accidental duplicate creation when emails, phones, or companies match existing records.
                </p>
              </div>
            </label>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#708078] shrink-0 font-medium">Assign to:</span>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34]"
                >
                  <option value="">Unassigned (Open Pool)</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Filter Tabs for Preview Table */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                previewFilter === "all"
                  ? "bg-[#083d34] text-white"
                  : "bg-[#f0f3f1] text-[#708078] hover:text-[#182922]"
              }`}
            >
              All Records ({previewResult.rows.length})
            </button>
            <button
              type="button"
              onClick={() => setPreviewFilter("valid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                previewFilter === "valid"
                  ? "bg-[#2d7a4f] text-white"
                  : "bg-[#f0f3f1] text-[#708078] hover:text-[#182922]"
              }`}
            >
              Valid Only ({previewResult.validCount})
            </button>
            {previewResult.duplicateCount > 0 && (
              <button
                type="button"
                onClick={() => setPreviewFilter("duplicate")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  previewFilter === "duplicate"
                    ? "bg-[#d46b08] text-white"
                    : "bg-[#f0f3f1] text-[#708078] hover:text-[#182922]"
                }`}
              >
                Duplicates ({previewResult.duplicateCount})
              </button>
            )}
            {previewResult.invalidCount > 0 && (
              <button
                type="button"
                onClick={() => setPreviewFilter("error")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  previewFilter === "error"
                    ? "bg-[#c95965] text-white"
                    : "bg-[#f0f3f1] text-[#708078] hover:text-[#182922]"
                }`}
              >
                Errors ({previewResult.invalidCount})
              </button>
            )}
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-[380px] border border-[#e8ecea] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#fafbfb] border-b border-[#e8ecea]">
                <tr className="text-[10px] font-semibold text-[#8a9992] uppercase">
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Details / Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3f1]">
                {filteredPreviewRows.slice(0, 50).map((r) => (
                  <tr key={r.rowNumber} className="hover:bg-[#fafbfb]">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#708078]">
                      #{r.rowNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      {!r.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fdeef0] text-[#c95965]">
                          <XCircle className="w-3 h-3" /> Error
                        </span>
                      ) : r.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7e6] text-[#d46b08]">
                          <AlertTriangle className="w-3 h-3" /> Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f6ed] text-[#2d7a4f]">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#182922]">
                      {r.data.companyName || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-[#2c3d36]">
                      {r.data.contactPerson || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-[#556660]">
                      {r.data.email || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-[#556660]">
                      {r.data.phone || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.errors.length > 0 ? (
                        <span className="text-[11px] text-red-600 font-medium">
                          {r.errors.join(", ")}
                        </span>
                      ) : r.duplicateReason ? (
                        <span className="text-[11px] text-[#d46b08]">
                          {r.duplicateReason}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#2d7a4f]">Valid data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPreviewRows.length > 50 && (
            <p className="text-[11px] text-[#708078] text-center">
              Showing first 50 rows of {filteredPreviewRows.length} matching preview records.
            </p>
          )}
        </div>
      )}

      {/* STEP 4: IMPORT SUMMARY */}
      {currentStep === 4 && importSummary && (
        <div className="bg-white rounded-[24px] p-8 lg:p-12 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="font-serif text-3xl font-semibold text-[#13231c]">
              Import Completed Successfully
            </h2>
            <p className="text-xs text-[#708078] mt-1.5 max-w-md mx-auto">
              Your spreadsheet data has been verified and persisted to Neon PostgreSQL.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 rounded-2xl bg-[#e8f6ed] border border-[#cbe8d5]">
              <div className="text-xs font-semibold text-[#2d7a4f]">Imported</div>
              <div className="font-serif text-3xl font-bold text-[#2d7a4f] mt-1">
                {importSummary.successful}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fff7e6] border border-[#ffd591]">
              <div className="text-xs font-semibold text-[#d46b08]">Skipped</div>
              <div className="font-serif text-3xl font-bold text-[#d46b08] mt-1">
                {importSummary.skipped}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#fdeef0] border border-[#fad5d9]">
              <div className="text-xs font-semibold text-[#c95965]">Failed</div>
              <div className="font-serif text-3xl font-bold text-[#c95965] mt-1">
                {importSummary.failed}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Link href="/leads">
              <button
                type="button"
                className="h-11 px-6 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                View Leads Directory
              </button>
            </Link>

            <Link href="/leads/import/history">
              <button
                type="button"
                className="h-11 px-5 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] transition-colors shadow-2xs cursor-pointer"
              >
                View Import History
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
