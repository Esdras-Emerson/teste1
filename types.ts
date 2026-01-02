
export enum ClassificationStatus {
  LESS_STRICT = "Menos Criteriosa",
  MORE_STRICT = "Mais Criteriosa",
  COMPATIBLE = "Compatível",
  UNKNOWN = "Desconhecido"
}

export interface User {
  email: string;
  password?: string;
}

export interface AnalysisResult {
  id: string;
  fileName: string;
  workName: string;
  km: string;
  sentido: string;
  structural: string;
  structuralMotivation: string;
  functional: string;
  functionalMotivation: string;
  durability: string;
  durabilityMotivation: string;
  summary: string;
  pointsOfAttention: string[];
  complianceStatus: ClassificationStatus;
  complianceReasoning: string;
  processingTimeMs: number;
}

export interface AuditItem {
  title: string;
  description: string;
  foundInCap3: string;
  foundInAnnexVII: boolean;
  foundInAnnexII: boolean;
  notes: string;
}

export interface AuditCategory {
  name: string;
  items: AuditItem[];
}

export interface ConsistencyAuditResult {
  id: string;
  fileName: string;
  workName: string;
  km: string;
  sentido: string;
  categories: AuditCategory[];
  criticalInconsistencies: string[];
  recommendations: string[];
  processingTimeMs: number;
}

export interface RoutineInspectionResult {
  id: string;
  fileName: string;
  tipoInspecao: string; // A1
  ano: string; // B1
  oae: string; // N1
  concessionaria: string; // B2
  dataInspecao: string; // N2
  codigo: string; // N3
  rodovia: string; // B5
  sentido: string; // F5
  obra: string; // B7
  km: string; // F7
  vaosGeo: string; // B9
  comprimentoTotal: string; // F9
  pilaresGeo: string; // B10
  vigasGeo: string; // F10
  larguraTabuleiro: string; // B11
  juntasDilatacaoGeo: string; // F11
  observacoesGeo: string; // B12
  tabuleiroTipo: string; // B14
  vaosTipo: string; // F14
  tabuleiro: string; // B21
  juntas: string; // B26
  aparelhosApoio: string; // B31
  apoios: string; // B36 (Pilares)
  encontros: string; // B41
  outrosElementos: string; // B46
  pavimento: string; // I5
  acostamento: string; // I8
  drenagem: string; // I11
  guardaCorpos: string; // I14
  barreirasDefensas: string; // I17
  taludes: string; // I23
  iluminacao: string; // I25
  sinalizacao: string; // I27
  gabaritos: string; // I29
  protecaoPilares: string; // I31
  coordenadas: string; // I35
  recomendacoes: string; // I41
  estrutural: string; // I53
  funcional: string; // K53
  durability: string; // M53
}

export interface GeminiResponseSchema {
  workName: string;
  km?: string;
  sentido?: string;
  structural: string;
  structuralMotivation: string;
  functional: string;
  functionalMotivation: string;
  durability: string;
  durabilityMotivation: string;
  summary: string;
  pointsOfAttention: string[];
  complianceStatus: "LESS_STRICT" | "MORE_STRICT" | "COMPATIBLE";
  complianceReasoning: string;
}

export interface GeminiAuditSchema {
  categories: {
    name: string;
    items: {
      title: string;
      description: string;
      foundInCap3: string;
      foundInAnnexVII: boolean;
      foundInAnnexII: boolean;
      notes: string;
    }[];
  }[];
  criticalInconsistencies: string[];
  recommendations: string[];
}
