
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ClassificationStatus, GeminiResponseSchema, ConsistencyAuditResult, GeminiAuditSchema } from "../types";
import { AuditSections } from "./pdfService";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    workName: { type: Type.STRING },
    km: { type: Type.STRING },
    sentido: { type: Type.STRING },
    structural: { type: Type.STRING },
    structuralMotivation: { type: Type.STRING },
    functional: { type: Type.STRING },
    functionalMotivation: { type: Type.STRING },
    durability: { type: Type.STRING },
    durabilityMotivation: { type: Type.STRING },
    summary: { type: Type.STRING },
    pointsOfAttention: { type: Type.ARRAY, items: { type: Type.STRING } },
    complianceStatus: { type: Type.STRING, enum: ["LESS_STRICT", "MORE_STRICT", "COMPATIBLE"] },
    complianceReasoning: { type: Type.STRING }
  },
  required: ["workName", "structural", "structuralMotivation", "functional", "functionalMotivation", "durability", "durabilityMotivation", "summary", "pointsOfAttention", "complianceStatus", "complianceReasoning"]
};

const AUDIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                foundInCap3: { type: Type.STRING },
                foundInAnnexVII: { type: Type.BOOLEAN },
                foundInAnnexII: { type: Type.BOOLEAN },
                notes: { type: Type.STRING }
              },
              required: ["title", "foundInCap3", "foundInAnnexVII", "foundInAnnexII"]
            }
          }
        },
        required: ["name", "items"]
      }
    },
    criticalInconsistencies: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["categories", "criticalInconsistencies", "recommendations"]
};

export const analyzeReport = async (
  text: string,
  fileName: string,
  detectedName: string,
  detectedKm: string,
  detectedSentido: string,
  standardContext: string
): Promise<AnalysisResult> => {
  // A chave de API é obtida automaticamente do ambiente Netlify via process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Norma Técnica:\n${standardContext}\n\nAnalise o Capítulo IV (Conclusão):\n${text}`,
    config: { 
      systemInstruction: "Sua função é extrair notas (A1-E5) e justificativas técnicas da conclusão de um relatório de ponte/viaduto. Seja fiel ao texto original mas critique se as notas forem inconsistentes com a norma ARTESP fornecida.",
      temperature: 0.1, 
      responseMimeType: "application/json", 
      responseSchema: ANALYSIS_SCHEMA 
    }
  });
  
  const parsed: GeminiResponseSchema = JSON.parse(response.text || "{}");
  return {
    id: crypto.randomUUID(),
    fileName,
    workName: parsed.workName || detectedName,
    km: parsed.km || detectedKm,
    sentido: parsed.sentido || detectedSentido,
    structural: parsed.structural,
    structuralMotivation: parsed.structuralMotivation,
    functional: parsed.functional,
    functionalMotivation: parsed.functionalMotivation,
    durability: parsed.durability,
    durabilityMotivation: parsed.durabilityMotivation,
    summary: parsed.summary,
    pointsOfAttention: parsed.pointsOfAttention,
    complianceStatus: ClassificationStatus[parsed.complianceStatus as keyof typeof ClassificationStatus] || ClassificationStatus.COMPATIBLE,
    complianceReasoning: parsed.complianceReasoning,
    processingTimeMs: 0
  };
};

export const performConsistencyAudit = async (sections: AuditSections): Promise<ConsistencyAuditResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const startTime = performance.now();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `DADOS PARA AUDITORIA:\n\nCapítulo 3:\n${sections.cap3}\n\nAnexo II:\n${sections.annexII}\n\nAnexo VII:\n${sections.annexVII}`,
    config: {
      systemInstruction: "Você é um auditor rigoroso. Identifique se anomalias descritas no texto (Cap 3) foram omitidas das tabelas quantitativas (Anexo VII) ou das fichas de vistoria (Anexo II).",
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: AUDIT_SCHEMA
    }
  });
  
  const parsed: GeminiAuditSchema = JSON.parse(response.text || "{}");
  return {
    id: crypto.randomUUID(),
    fileName: sections.fileName,
    workName: sections.workNameCandidate || "OAE Auditada",
    km: sections.kmCandidate || "-",
    sentido: sections.sentidoCandidate || "-",
    categories: parsed.categories,
    criticalInconsistencies: parsed.criticalInconsistencies,
    recommendations: parsed.recommendations,
    processingTimeMs: Math.round(performance.now() - startTime)
  };
};
