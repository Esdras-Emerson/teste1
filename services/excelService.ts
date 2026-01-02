import * as XLSX from 'xlsx';
import { RoutineInspectionResult } from '../types';

export const parseRoutineInspection = async (file: File): Promise<RoutineInspectionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const getVal = (cell: string) => {
          const val = sheet[cell];
          return val ? String(val.v).trim() : "";
        };

        const result: RoutineInspectionResult = {
          id: crypto.randomUUID(),
          fileName: file.name,
          tipoInspecao: getVal('A1'),
          ano: getVal('B1'),
          oae: getVal('N1'),
          concessionaria: getVal('B2'),
          dataInspecao: getVal('N2'),
          codigo: getVal('N3'),
          rodovia: getVal('B7'), // Conforme solicitação
          sentido: getVal('F7'), 
          obra: getVal('B9'),    // Conforme solicitação (Obra/OAE)
          km: getVal('F9'),      // Conforme solicitação
          vaosGeo: getVal('B11'),
          comprimentoTotal: getVal('F11'),
          pilaresGeo: getVal('B12'),
          vigasGeo: getVal('F12'),
          larguraTabuleiro: getVal('B13'),
          juntasDilatacaoGeo: getVal('F13'),
          observacoesGeo: getVal('B14'),
          tabuleiroTipo: getVal('B16'),
          vaosTipo: getVal('F16'),
          // Parte II - Diagnóstico Inicial
          tabuleiro: getVal('B21'),
          juntas: getVal('B26'),
          aparelhosApoio: getVal('B31'),
          apoios: getVal('B36'),
          encontros: getVal('B41'),
          outrosElementos: getVal('B46'),
          // Diagnóstico Inicial - Continuação
          pavimento: getVal('I5'),
          acostamento: getVal('I8'),
          drenagem: getVal('I11'),
          guardaCorpos: getVal('I14'),
          barreirasDefensas: getVal('I17'),
          taludes: getVal('I23'),
          iluminacao: getVal('I25'),
          sinalizacao: getVal('I27'),
          gabaritos: getVal('I29'),
          protecaoPilares: getVal('I31'),
          coordenadas: getVal('I35'),
          recomendacoes: getVal('H41'), // Conforme solicitação
          // Classificação
          estrutural: getVal('I53'),
          funcional: getVal('K53'),
          durability: getVal('M53'),
        };

        resolve(result);
      } catch (err) {
        reject(new Error("Falha ao ler o arquivo Excel. Verifique o formato da ficha ARTESP."));
      }
    };
    reader.onerror = () => reject(new Error("Erro na leitura do arquivo."));
    reader.readAsArrayBuffer(file);
  });
};