
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "../types";

export const getDiscrepancySummary = async (items: InventoryItem[]): Promise<string> => {
  try {
    // Cek keberadaan API_KEY dengan aman
    const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) 
                   ? process.env.API_KEY 
                   : (window as any).process?.env?.API_KEY;

    if (!apiKey || apiKey === "") {
      console.warn("Gemini API Key tidak ditemukan. Fitur audit AI dinonaktifkan.");
      return "Sistem Audit AI memerlukan API Key yang valid untuk menganalisis data.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const discrepancies = items.filter(i => i.expectedQty !== i.actualQty);
    if (discrepancies.length === 0) return "Semua jumlah stok saat ini sesuai dengan nilai ekspektasi.";

    const prompt = `
      Analisis perbedaan inventaris berikut dan berikan ringkasan eksekutif yang profesional dan singkat untuk manajer. 
      Soroti kerugian utama dan kategori yang bermasalah.
      
      Data:
      ${discrepancies.map(d => `- Nama: ${d.name}, Size: ${d.size}, Ekspektasi: ${d.expectedQty}, Aktual: ${d.actualQty}, Kondisi: ${d.condition}`).join('\n')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah konsultan audit gudang senior. Berikan wawasan yang singkat dan profesional dalam Bahasa Indonesia.",
      }
    });

    return response.text || "Hasil audit tidak dapat dihasilkan saat ini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Layanan AI sedang tidak tersedia (Periksa koneksi atau API Key).";
  }
};
