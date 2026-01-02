
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`;

export interface PdfExtractionResult {
  text: string;
  workNameCandidate: string;
  kmCandidate: string;
  sentidoCandidate: string;
}

export interface AuditSections {
  cap3: string;
  cap4: string;
  annexII: string;
  annexIII: string;
  annexIV: string;
  annexVII: string;
  fileName: string;
  workNameCandidate: string;
  kmCandidate: string;
  sentidoCandidate: string;
}

const extractMetadataFromText = (pageText: string) => {
  const nameRegex = /(?:Trecho|Obra|Local|Denominação|OAE):\s*(.*?)(?:\n|km|$)/i;
  const kmPatternRegex = /km\s*(\d+\s*[+]\s*\d+)\s*[–-]\s*(.*)/i;
  const nameMatch = pageText.match(nameRegex);
  const kmPatternMatch = pageText.match(kmPatternRegex);
  return {
    workName: nameMatch ? nameMatch[1].trim() : "",
    km: kmPatternMatch ? `km ${kmPatternMatch[1].trim()}` : "",
    sentido: kmPatternMatch ? kmPatternMatch[2].trim() : ""
  };
};

export const extractRelevantText = async (file: File): Promise<PdfExtractionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";
  let workNameCandidate = "";
  let kmCandidate = "";
  let sentidoCandidate = "";
  let foundConclusion = false;

  // Percorre o PDF procurando o capítulo IV. CONCLUSÃO
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    
    if (i <= 5) {
      const meta = extractMetadataFromText(pageText);
      if (!workNameCandidate) workNameCandidate = meta.workName;
      if (!kmCandidate) kmCandidate = meta.km;
      if (!sentidoCandidate) sentidoCandidate = meta.sentido;
    }

    // Identifica o início do Capítulo IV (Conclusão)
    const conclusionStartRegex = /(?:IV|4)\.?\s*(?:CONCLUSÃO|CONCLUSÕES)/i;
    // Identifica o início de uma próxima seção ou anexos para parar a captura
    const stopRegex = /(?:V|5)\.?\s*(?:AÇÕES|AÇOES|RECOMENDAÇÕES|RECOMENDACOES)|ANEXO/i;

    if (!foundConclusion && conclusionStartRegex.test(pageText)) {
        foundConclusion = true;
        const startIndex = pageText.search(conclusionStartRegex);
        fullText += pageText.substring(startIndex) + "\n";
    } else if (foundConclusion) {
        if (stopRegex.test(pageText)) {
            const stopIndex = pageText.search(stopRegex);
            fullText += pageText.substring(0, stopIndex);
            break; 
        }
        fullText += pageText + "\n";
    }
  }

  if (!foundConclusion) {
    throw new Error(`Capítulo "IV. CONCLUSÃO" não foi detectado no arquivo: ${file.name}. Verifique a numeração do capítulo.`);
  }

  return { 
    text: fullText.trim(), 
    workNameCandidate: workNameCandidate || "OAE não identificada", 
    kmCandidate: kmCandidate || "-", 
    sentidoCandidate: sentidoCandidate || "-" 
  };
};

export const extractAuditSections = async (file: File): Promise<AuditSections> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let sections: AuditSections = { cap3: "", cap4: "", annexII: "", annexIII: "", annexIV: "", annexVII: "", fileName: file.name, workNameCandidate: "", kmCandidate: "", sentidoCandidate: "" };
  let currentSection: keyof AuditSections | null = null;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");

    if (i <= 5) {
      const meta = extractMetadataFromText(pageText);
      if (!sections.workNameCandidate) sections.workNameCandidate = meta.workName;
      if (!sections.kmCandidate) sections.kmCandidate = meta.km;
    }

    if (/3\.\s*(?:ANOMALIAS|DESCRIÇÃO|DESCRIÇÃO\s*DAS\s*ANOMALIAS)/i.test(pageText)) currentSection = "cap3";
    else if (/ANEXO\s*II/i.test(pageText)) currentSection = "annexII";
    else if (/ANEXO\s*VII/i.test(pageText)) currentSection = "annexVII";

    if (currentSection && typeof sections[currentSection] === 'string') {
      (sections[currentSection] as string) += pageText + "\n";
    }
  }
  return sections;
};

export const extractStandardText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
}
