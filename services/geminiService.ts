
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "../types";

export const getDiscrepancySummary = async (items: InventoryItem[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const discrepancies = items.filter(i => i.expectedQty !== i.actualQty);
  if (discrepancies.length === 0) return "Semua jumlah stok saat ini sesuai dengan nilai ekspektasi.";

  const prompt = `
    Analisis perbedaan inventaris berikut dan berikan ringkasan eksekutif yang profesional dan singkat untuk manajer. 
    Soroti kerugian utama dan kategori yang bermasalah.
    
    Data:
    ${discrepancies.map(d => `- Nama: ${d.name}, Size: ${d.size}, Ekspektasi: ${d.expectedQty}, Aktual: ${d.actualQty}, Kondisi: ${d.condition}, Catatan: ${d.notes || 'N/A'}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah konsultan audit gudang senior. Berikan wawasan yang singkat dan profesional dalam Bahasa Indonesia.",
      }
    });
    return response.text || "Gagal menghasilkan ringkasan saat ini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat berkomunikasi dengan asisten AI.";
  }
};
