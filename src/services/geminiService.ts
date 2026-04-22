import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicialización segura (Lazy Loading)
const getGenerativeModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Aquí definimos la System Instruction de Auditor
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `Eres un Auditor SeniorExperto en Seguros. 
        Tu objetivo es analizar registros granulares de siniestros y detectar anomalías, casos sospechosos de fraude o errores de cálculo.
        Responde SIEMPRE en formato JSON estructurado siguiendo este esquema:
        {
            "sospechoso": boolean,
            "nivelRiesgo": "bajo" | "medio" | "alto",
            "motivo": string,
            "recomendacion": string
        }`
    });
};

export const auditSiniestro = async (siniestroData: any) => {
    const model = getGenerativeModel();
    const prompt = `Analiza este siniestro: ${JSON.stringify(siniestroData)}`;
    
    const result = await model.generateContentStream(prompt);
    return result; 
};
