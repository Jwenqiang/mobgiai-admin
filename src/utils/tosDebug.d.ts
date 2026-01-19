// Type declarations for tosDebug.js
export interface DiagnosisStep {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  name: string;
  details?: any;
}

export interface DiagnosisResult {
  overallStatus: 'success' | 'error' | 'warning';
  steps: DiagnosisStep[];
  recommendations: string[];
}

export function diagnoseTosUpload(file: File): Promise<DiagnosisResult>;

export function printDiagnosisReport(result: DiagnosisResult): void;
