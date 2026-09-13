import React, { useState } from 'react';
import Papa from 'papaparse';
import QRCodeStyling from 'qr-code-styling';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import type { PrintTemplateType } from '../types';

interface BulkCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

export const BulkCSVModal: React.FC<BulkCSVModalProps> = ({ isOpen, onClose }) => {
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // Column Mappings
  const [payloadColumn, setPayloadColumn] = useState<string>('');
  const [titleColumn, setTitleColumn] = useState<string>('');
  const [subtitleColumn, setSubtitleColumn] = useState<string>('');
  const [failoverColumn, setFailoverColumn] = useState<string>('');

  const [templateType, setTemplateType] = useState<PrintTemplateType>('asset-tag-2x1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const rows = results.data as ParsedRow[];
          setCsvData(rows);
          const cols = Object.keys(rows[0]);
          setHeaders(cols);

          // Smart auto-detection of column names
          const findCol = (keywords: string[]) => {
            return cols.find(c => keywords.some(k => c.toLowerCase().includes(k))) || '';
          };

          setPayloadColumn(findCol(['url', 'payload', 'link', 'id', 'asset']));
          setTitleColumn(findCol(['name', 'title', 'device', 'room']));
          setSubtitleColumn(findCol(['desc', 'sub', 'category', 'location']));
          setFailoverColumn(findCol(['tag', 'serial', 'pin', 'code']));
        } else {
          setErrorMessage('Uploaded CSV contains no valid data rows.');
        }
      },
      error: (err) => {
        setErrorMessage(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const handleDownloadBatchPDF = async () => {
    if (!payloadColumn || csvData.length === 0) {
      setErrorMessage('Please select the column to use for the QR code payload.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: csvData.length });
    setErrorMessage(null);

    try {
      const { jsPDF } = await import('jspdf');
      // Create jsPDF instance
      let doc: InstanceType<typeof jsPDF>;
      let pageWidth: number;
      let pageHeight: number;

      if (templateType === 'asset-tag-2x1') {
        doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [50.8, 25.4] });
        pageWidth = 50.8;
        pageHeight = 25.4;
      } else if (templateType === 'standee-a5') {
        doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        pageWidth = 148;
        pageHeight = 210;
      } else {
        doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        pageWidth = 210;
        pageHeight = 297;
      }

      for (let i = 0; i < csvData.length; i++) {
        if (i > 0) {
          doc.addPage(
            templateType === 'asset-tag-2x1' ? [50.8, 25.4] : templateType === 'standee-a5' ? 'a5' : 'a4',
            templateType === 'asset-tag-2x1' ? 'landscape' : 'portrait'
          );
        }

        setProgress({ current: i + 1, total: csvData.length });
        const row = csvData[i];
        const payloadText = row[payloadColumn] || 'EMPTY';
        const titleText = titleColumn ? row[titleColumn] || 'Item' : `Tag #${i + 1}`;
        const subText = subtitleColumn ? row[subtitleColumn] : '';
        const failoverText = failoverColumn ? row[failoverColumn] : '';

        // Generate QR code offscreen using qr-code-styling
        const qrCode = new QRCodeStyling({
          width: 300,
          height: 300,
          data: payloadText,
          dotsOptions: { color: '#0f172a', type: 'rounded' },
          cornersSquareOptions: { color: '#0f172a', type: 'extra-rounded' },
          backgroundOptions: { color: '#ffffff' },
          qrOptions: { errorCorrectionLevel: 'M' }
        });

        const rawData = await qrCode.getRawData('png');
        if (!rawData) continue;

        const blobUrl = URL.createObjectURL(rawData as Blob);
        const img = new Image();
        img.src = blobUrl;
        await new Promise((res) => { img.onload = res; });

        // Draw onto PDF page based on templateType
        if (templateType === 'asset-tag-2x1') {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.rect(1, 1, pageWidth - 2, pageHeight - 2);

          doc.addImage(img, 'PNG', 3, (pageHeight - 18) / 2, 18, 18);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42);
          doc.text(titleText, 23, 6);

          if (subText) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            doc.setTextColor(71, 85, 105);
            doc.text(subText, 23, 9.5);
          }

          if (failoverText) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(2, 132, 199);
            doc.text(`ID: ${failoverText}`, 23, 14);
          }

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(4.5);
          doc.setTextColor(148, 163, 184);
          doc.text('SwissArmy QR Batch Tag', 23, 22);
        } else if (templateType === 'standee-a5') {
          doc.setFillColor(37, 99, 235);
          doc.rect(0, 0, pageWidth, 28, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(255, 255, 255);
          doc.text(titleText, pageWidth / 2, 14, { align: 'center' });

          if (subText) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(220, 235, 255);
            doc.text(subText, pageWidth / 2, 21, { align: 'center' });
          }

          const qrSize = 65;
          doc.addImage(img, 'PNG', (pageWidth - qrSize) / 2, 45, qrSize, qrSize);

          if (failoverText) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text(`Reference: ${failoverText}`, pageWidth / 2, 135, { align: 'center' });
          }
        } else {
          // A4 Tent Card
          const qrSize = 55;
          doc.addImage(img, 'PNG', (pageWidth - qrSize) / 2, 50, qrSize, qrSize);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(20, 30, 50);
          doc.text(titleText, pageWidth / 2, 35, { align: 'center' });

          if (failoverText) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(failoverText, pageWidth / 2, 120, { align: 'center' });
          }
        }

        URL.revokeObjectURL(blobUrl);
      }

      doc.save(`batch-${templateType}-${Date.now()}.pdf`);
      setIsGenerating(false);
      setProgress(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Generation failed: ${err.message}`);
      setIsGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch CSV QR Generator</h2>
              <p className="text-xs text-slate-400">Generate multi-page PDF asset tags or standees from CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload State */}
          {csvData.length === 0 ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-8 text-center bg-slate-950/40 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200 mb-1">Select a CSV spreadsheet to ingest</p>
              <p className="text-xs text-slate-500 mb-4">
                Include columns such as Asset_ID, ServiceNow_URL, Room, Title, etc.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors">
                <span>Browse CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{fileName}</span>
                  <span className="text-slate-400">({csvData.length} records parsed)</span>
                </div>
                <label className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer">
                  Change File
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Template Format Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Print Template Format</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTemplateType('asset-tag-2x1')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      templateType === 'asset-tag-2x1'
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">2" x 1" Asset Tag</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Industrial sticker labels</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('standee-a5')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      templateType === 'standee-a5'
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">A5 Standee</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Table/counter display</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('tent-a4')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      templateType === 'tent-a4'
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">A4 Tent Card</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Foldable double-sided</div>
                  </button>
                </div>
              </div>

              {/* Column Mapping Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    QR Payload Column <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={payloadColumn}
                    onChange={(e) => setPayloadColumn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Payload Column --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Title Column</label>
                  <select
                    value={titleColumn}
                    onChange={(e) => setTitleColumn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Title Column --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Subtitle / Desc Column</label>
                  <select
                    value={subtitleColumn}
                    onChange={(e) => setSubtitleColumn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Subtitle Column (Optional) --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Failover / ID Column</label>
                  <select
                    value={failoverColumn}
                    onChange={(e) => setFailoverColumn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Failover ID Column (Optional) --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <span className="block text-xs font-semibold text-slate-400 mb-1.5">First 3 Rows Preview</span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Payload ({payloadColumn || 'Not set'})</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Failover ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                      {csvData.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 text-slate-500">{i + 1}</td>
                          <td className="p-2 truncate max-w-[150px]">{payloadColumn ? r[payloadColumn] : '-'}</td>
                          <td className="p-2 truncate max-w-[120px]">{titleColumn ? r[titleColumn] : '-'}</td>
                          <td className="p-2 truncate max-w-[100px]">{failoverColumn ? r[failoverColumn] : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Generation Button & Progress */}
              <div className="pt-2">
                {isGenerating ? (
                  <div className="p-4 bg-slate-800/80 rounded-xl text-center">
                    <div className="text-sm font-semibold text-emerald-400 mb-1">
                      Generating PDF... ({progress?.current} / {progress?.total})
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-150"
                        style={{
                          width: `${((progress?.current || 0) / (progress?.total || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadBatchPDF}
                    disabled={!payloadColumn}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generate & Download Batch PDF ({csvData.length} Pages)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
