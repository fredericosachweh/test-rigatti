import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./db/connect.js";
import { ChatLog } from "./models/ChatLog.js";
import { Company } from "./models/Company.js";
import { Product } from "./models/Product.js";
import { User } from "./models/User.js";

// ── Imagens locais (baixadas via npm run download-images) ───────────────────
function imgs(slug: string, count: number = 3) {
  const suffixes = ["", "-2", "-3", "-4", "-5", "-6"].slice(0, count);
  return {
    images: suffixes.map((s) => ({
      imageUrl: `/uploads/products/original/${slug}${s}.webp`,
      thumbnailUrl: `/uploads/products/thumb/${slug}${s}.webp`
    }))
  };
}

// ── Catálogo ────────────────────────────────────────
const demoCatalog = {
  curitiba: [
    {
      name: "Toxina Botulínica Facial",
      description:
        "Aplicação de botox para suavizar linhas de expressão na testa, glabela e região periorbital. Resultado natural com até 6 meses de duração.",
      price: 1200,
      category: "Facial",
      ...imgs("toxina-botulinica-facial")
    },
    {
      name: "Preenchimento Labial",
      description:
        "Volumização e definição dos lábios com ácido hialurônico. Técnica personalizada para resultado harmônico.",
      price: 1500,
      category: "Facial",
      ...imgs("preenchimento-labial")
    },
    {
      name: "Bioestimulador de Colágeno",
      description:
        "Aplicação de Sculptra ou Radiesse para estimular a produção de colágeno e restaurar o volume facial perdido.",
      price: 2200,
      category: "Facial",
      ...imgs("bioestimulador-colageno")
    },
    {
      name: "Harmonização Facial Completa",
      description:
        "Protocolo completo com toxina botulínica, preenchimentos e bioestimulador. Planejamento individualizado por sessão.",
      price: 4500,
      category: "Facial",
      ...imgs("harmonizacao-facial")
    },
    {
      name: "Skinbooster Profhilo",
      description:
        "Hidratação profunda com ácido hialurônico de alta concentração. Melhora textura, firmeza e luminosidade da pele.",
      price: 1800,
      category: "Facial",
      ...imgs("skinbooster-profhilo")
    },
    {
      name: "Microagulhamento com PRP",
      description:
        "Microagulhamento combinado com plasma rico em plaquetas para rejuvenescimento, redução de cicatrizes e estímulo de colágeno.",
      price: 900,
      category: "Facial",
      ...imgs("microagulhamento-prp")
    },
    {
      name: "Peel Químico Médio",
      description:
        "Esfoliação química com ácido tricloroacético (TCA) para manchas, melasma e textura irregular.",
      price: 650,
      category: "Facial",
      ...imgs("peel-quimico-medio")
    },
    {
      name: "Limpeza de Pele Profunda",
      description:
        "Protocolo de higienização profunda com extração, peeling enzimático e máscara calmante.",
      price: 280,
      category: "Facial",
      ...imgs("limpeza-pele-profunda")
    },
    {
      name: "Fio de Sustentação PDO",
      description:
        "Lifting sem cirurgia com fios de polidioxanona para contorno facial e pescoço. Efeito tensor imediato.",
      price: 3200,
      category: "Facial",
      ...imgs("fio-sustentacao-pdo")
    },
    {
      name: "Laser CO2 Fracionado Facial",
      description:
        "Rejuvenescimento com laser ablativo fracionado para manchas, rugas e textura. Tecnologia de alta precisão.",
      price: 2800,
      category: "Laser",
      ...imgs("laser-co2-fracionado")
    },
    {
      name: "Luz Intensa Pulsada (IPL)",
      description:
        "Fotorejuvenescimento para manchas solares, rosácea e vasinhos superficiais. Pele mais uniforme e luminosa.",
      price: 750,
      category: "Laser",
      ...imgs("ipl-luz-intensa-pulsada")
    },
    {
      name: "Depilação a Laser Axila",
      description:
        "Remoção definitiva de pelos da axila com laser Alexandrite ou Diodo. Pacote por sessão.",
      price: 220,
      category: "Laser",
      ...imgs("depilacao-laser-axila")
    }
  ],
  saopaulo: [
    {
      name: "Lipo de Papada",
      description:
        "Lipoaspiração minimamente invasiva da região submentoniana com laser para contorno do rosto e pescoço.",
      price: 5500,
      category: "Corporal",
      ...imgs("lipo-papada")
    },
    {
      name: "Criolipólise Abdômen",
      description:
        "Congelamento localizado de gordura para redução de medidas no abdômen. Sessão de 45 minutos por área.",
      price: 1400,
      category: "Corporal",
      ...imgs("criolipolise-abdomen")
    },
    {
      name: "Radiofrequência Corporal",
      description:
        "Tratamento de flacidez e celulite com radiofrequência tripolar. Indicado para abdômen, coxas e glúteos.",
      price: 600,
      category: "Corporal",
      ...imgs("radiofrequencia-corporal")
    },
    {
      name: "Ultrassom Microfocado HIFU",
      description:
        "Lifting não invasivo com ultrassom de alta intensidade para flacidez do rosto, pescoço e corpo.",
      price: 3500,
      category: "Corporal",
      ...imgs("hifu-ultrassom")
    },
    {
      name: "Massagem Modeladora",
      description:
        "Protocolo de drenagem linfática e modelagem corporal para redução de medidas e melhora da circulação.",
      price: 250,
      category: "Corporal",
      ...imgs("massagem-modeladora")
    },
    {
      name: "Ozonioterapia Corporal",
      description:
        "Aplicação de ozônio para tratamento de celulite, estrias e cicatrizes. Ação regenerativa e antioxidante.",
      price: 480,
      category: "Corporal",
      ...imgs("ozonioterapia-corporal")
    },
    {
      name: "Carboxiterapia",
      description:
        "Injeção de CO2 medicinal para celulite, gordura localizada, olheiras e estrias. Estimula microcirculação.",
      price: 380,
      category: "Corporal",
      ...imgs("carboxiterapia")
    },
    {
      name: "Toxina Botulínica Corporal",
      description:
        "Aplicação de botox para hiperidrose (suor excessivo) em axilas, mãos e pés. Duração de 8 a 12 meses.",
      price: 1800,
      category: "Corporal",
      ...imgs("toxina-botulinica-corporal")
    },
    {
      name: "Preenchimento Glúteo",
      description:
        "Volumização e definição dos glúteos com ácido hialurônico ou bioestimulador. Técnica segura e natural.",
      price: 4200,
      category: "Corporal",
      ...imgs("preenchimento-gluteo")
    },
    {
      name: "Depilação a Laser Perna Completa",
      description:
        "Remoção definitiva de pelos das pernas com laser de alta performance. Pacote por sessão.",
      price: 680,
      category: "Laser",
      ...imgs("depilacao-laser-perna")
    },
    {
      name: "Laser Nd:YAG Varizes",
      description:
        "Tratamento de varizes e vasinhos com laser Nd:YAG. Sem agulhas, sem recuperação longa.",
      price: 900,
      category: "Laser",
      ...imgs("laser-ndyag-varizes")
    },
    {
      name: "Consulta Avaliação Estética",
      description:
        "Consulta de avaliação completa com médico especialista para planejamento personalizado de tratamentos.",
      price: 300,
      category: "Consulta",
      ...imgs("consulta-avaliacao")
    }
  ]
};

// ── Dados de amostra para o mapa de calor ──────────
// Simula 90 dias de uso realista: mais atividade em dias úteis,
// horários de pico manhã (9-11h) e tarde (14-17h)
function buildChatLogs(companyId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const now = Date.now();
  const DAY = 86_400_000;

  // Perguntas realistas para clínica estética
  const conversations: Array<{
    message: string;
    toolArgs: Record<string, unknown> | null;
    answer: string;
  }> = [
    {
      message: "Quais tratamentos faciais vocês oferecem?",
      toolArgs: { search: "facial", limit: 8 },
      answer:
        "Temos diversas opções faciais: Toxina Botulínica, Preenchimento Labial, Bioestimulador de Colágeno, entre outros."
    },
    {
      message: "Quanto custa o botox?",
      toolArgs: { search: "botox", limit: 5 },
      answer: "A Toxina Botulínica Facial tem valor de R$ 1.200,00 por sessão."
    },
    {
      message: "Vocês fazem harmonização facial?",
      toolArgs: { search: "harmonização", category: "Facial", limit: 5 },
      answer:
        "Sim! A Harmonização Facial Completa inclui botox, preenchimentos e bioestimulador por R$ 4.500,00."
    },
    {
      message: "Tem tratamento para manchas no rosto?",
      toolArgs: { search: "manchas", category: "Facial", limit: 6 },
      answer:
        "Para manchas indicamos o Peel Químico Médio (R$ 650) ou o Laser CO2 Fracionado (R$ 2.800)."
    },
    {
      message: "Preenchimento labial, qual o valor?",
      toolArgs: { search: "preenchimento labial", limit: 3 },
      answer:
        "O Preenchimento Labial custa R$ 1.500,00. Usamos ácido hialurônico com técnica personalizada."
    },
    {
      message: "Quero saber sobre depilação a laser",
      toolArgs: { search: "depilação laser", category: "Laser", limit: 5 },
      answer: "Oferecemos depilação a laser na axila (R$ 220) e perna completa (R$ 680)."
    },
    {
      message: "Tratamentos até R$ 500?",
      toolArgs: { maxPrice: 500, limit: 8 },
      answer: "Temos: Limpeza de Pele R$ 280, Massagem Modeladora R$ 250 e Peel Químico R$ 650."
    },
    {
      message: "O que é skinbooster?",
      toolArgs: { search: "skinbooster", limit: 3 },
      answer: "O Skinbooster Profhilo é uma hidratação profunda com ácido hialurônico (R$ 1.800)."
    },
    {
      message: "Tem tratamento para celulite?",
      toolArgs: { search: "celulite", category: "Corporal", limit: 6 },
      answer:
        "Sim! Radiofrequência Corporal (R$ 600), Ozonioterapia (R$ 480) e Carboxiterapia (R$ 380)."
    },
    {
      message: "Tratamentos corporais disponíveis",
      toolArgs: { category: "Corporal", limit: 10 },
      answer:
        "Temos Criolipólise, Radiofrequência, HIFU, Massagem Modeladora, entre outros tratamentos corporais."
    },
    {
      message: "Qual o tratamento para flacidez?",
      toolArgs: { search: "flacidez", limit: 5 },
      answer: "Para flacidez recomendamos o HIFU (R$ 3.500) ou a Radiofrequência Corporal (R$ 600)."
    },
    {
      message: "Vocês fazem lipo?",
      toolArgs: { search: "lipo", category: "Corporal", limit: 4 },
      answer:
        "Temos a Lipo de Papada (R$ 5.500), procedimento minimamente invasivo para contorno facial."
    },
    {
      message: "Quero fazer um peeling, quais opções?",
      toolArgs: { search: "peel", category: "Facial", limit: 4 },
      answer: "Oferecemos o Peel Químico Médio com TCA por R$ 650,00."
    },
    {
      message: "Microagulhamento com PRP, como funciona?",
      toolArgs: { search: "microagulhamento PRP", limit: 3 },
      answer:
        "O Microagulhamento com PRP combina microlesões com plasma rico em plaquetas (R$ 900)."
    },
    {
      message: "Fio de sustentação, o que é?",
      toolArgs: { search: "fio PDO", category: "Facial", limit: 3 },
      answer: "O Fio de Sustentação PDO é um lifting sem cirurgia para contorno facial (R$ 3.200)."
    },
    {
      message: "Tratamentos entre R$ 1000 e R$ 2000",
      toolArgs: { minPrice: 1000, maxPrice: 2000, limit: 8 },
      answer:
        "Nessa faixa temos: Toxina Botulínica R$ 1.200, Preenchimento Labial R$ 1.500, Skinbooster R$ 1.800."
    },
    {
      message: "O que é carboxiterapia?",
      toolArgs: { search: "carboxiterapia", limit: 3 },
      answer: "Carboxiterapia é injeção de CO2 medicinal para celulite e estrias por R$ 380."
    },
    {
      message: "Bioestimulador de colágeno, quanto fica?",
      toolArgs: { search: "bioestimulador colágeno", limit: 3 },
      answer: "O Bioestimulador de Colágeno (Sculptra/Radiesse) custa R$ 2.200 por sessão."
    },
    {
      message: "Tem algo para olheiras?",
      toolArgs: { search: "olheiras", limit: 4 },
      answer: "A Carboxiterapia (R$ 380) é excelente para olheiras, estimulando a microcirculação."
    },
    {
      message: "Quero fazer uma avaliação",
      toolArgs: { search: "consulta avaliação", limit: 3 },
      answer:
        "Nossa Consulta de Avaliação Estética custa R$ 300 e inclui planejamento personalizado."
    },
    {
      message: "IPL para manchas solares",
      toolArgs: { search: "IPL manchas solares", category: "Laser", limit: 4 },
      answer: "A Luz Intensa Pulsada (IPL) é ideal para manchas solares e custa R$ 750 por sessão."
    },
    {
      message: "Laser para varizes",
      toolArgs: { search: "varizes laser", category: "Laser", limit: 3 },
      answer: "Temos o Laser Nd:YAG para varizes e vasinhos por R$ 900, sem agulhas."
    },
    {
      message: "Tratamentos mais baratos",
      toolArgs: { maxPrice: 400, limit: 8 },
      answer: "Os mais acessíveis: Depilação Axila R$ 220, Limpeza de Pele R$ 280, Massagem R$ 250."
    },
    {
      message: "Procedimentos para rejuvenescimento",
      toolArgs: { search: "rejuvenescimento", limit: 6 },
      answer:
        "Para rejuvenescimento temos: Botox, Bioestimulador, Microagulhamento PRP, Laser CO2 e IPL."
    },
    {
      message: "Tem criolipólise?",
      toolArgs: { search: "criolipólise", category: "Corporal", limit: 3 },
      answer: "Sim! Criolipólise Abdômen por R$ 1.400 por área, sessão de 45 minutos."
    },
    {
      message: "Qual tratamento para suor excessivo?",
      toolArgs: { search: "hiperidrose suor", limit: 3 },
      answer: "A Toxina Botulínica Corporal trata hiperidrose em axilas, mãos e pés por R$ 1.800."
    },
    {
      message: "Tratamentos faciais até R$ 1500",
      toolArgs: { category: "Facial", maxPrice: 1500, limit: 8 },
      answer:
        "Faciais até R$ 1.500: Limpeza de Pele R$ 280, Peel R$ 650, Microagulhamento R$ 900, Botox R$ 1.200, Preenchimento R$ 1.500."
    },
    {
      message: "O que é HIFU?",
      toolArgs: { search: "HIFU ultrassom", limit: 3 },
      answer:
        "HIFU é o Ultrassom Microfocado para lifting não invasivo de rosto e corpo (R$ 3.500)."
    },
    {
      message: "Ozonioterapia para que serve?",
      toolArgs: { search: "ozonioterapia", limit: 3 },
      answer:
        "A Ozonioterapia Corporal trata celulite, estrias e cicatrizes com ação regenerativa (R$ 480)."
    },
    {
      message: "Todos os tratamentos a laser",
      toolArgs: { category: "Laser", limit: 10 },
      answer:
        "Oferecemos: Laser CO2 Fracionado, IPL, Depilação Axila, Depilação Perna e Laser Nd:YAG para varizes."
    }
  ];

  // Distribuição de horários de pico realista para clínica
  // Pico: seg-sex 9-11h e 14-17h | menor atividade: fins de semana
  const peakSlots: Array<[number, number]> = [
    [1, 9],
    [1, 9],
    [1, 10],
    [1, 10],
    [1, 11],
    [1, 14],
    [1, 14],
    [1, 15],
    [1, 16],
    [1, 17],
    [2, 9],
    [2, 10],
    [2, 10],
    [2, 11],
    [2, 14],
    [2, 15],
    [2, 15],
    [2, 16],
    [2, 17],
    [3, 9],
    [3, 9],
    [3, 10],
    [3, 11],
    [3, 14],
    [3, 14],
    [3, 15],
    [3, 16],
    [3, 17],
    [3, 17],
    [4, 9],
    [4, 10],
    [4, 11],
    [4, 14],
    [4, 15],
    [4, 16],
    [4, 17],
    [5, 9],
    [5, 10],
    [5, 10],
    [5, 11],
    [5, 14],
    [5, 15],
    [5, 16],
    [6, 10],
    [6, 11],
    [6, 14],
    [0, 11],
    [0, 15]
  ];

  const logs = [];
  const todayDow = new Date().getDay();

  // Repete os peakSlots por 12 semanas para gerar volume realista no heatmap
  const totalEntries = peakSlots.length * 12;

  for (let i = 0; i < totalEntries; i++) {
    const conv = conversations[i % conversations.length];
    const [dayOfWeek, hour] = peakSlots[i % peakSlots.length];

    // Calcula quantos dias atrás foi o último dayOfWeek, + semanas adicionais
    const weeksAgo = Math.floor(i / peakSlots.length);
    const offsetToDay = (todayDow - dayOfWeek + 7) % 7;
    const daysBack = offsetToDay + weeksAgo * 7;

    const date = new Date(now - daysBack * DAY);
    date.setHours(hour, Math.floor(Math.random() * 59), 0, 0);

    logs.push({
      companyId: companyId.toString(),
      userId: userId.toString(),
      message: conv.message,
      toolArgs: conv.toolArgs,
      answer: conv.answer,
      provider: "anthropic",
      createdAt: date
    });
  }

  return logs;
}

async function seed() {
  await connectDatabase();

  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    ChatLog.deleteMany({})
  ]);

  const [curitiba, saopaulo] = await Company.create([
    { name: "Clínica Rigatti — Curitiba", slug: "rigatti-curitiba" },
    { name: "Clínica Rigatti — São Paulo", slug: "rigatti-saopaulo" }
  ]);

  const passwordHash = await bcrypt.hash("123456", 10);

  const [adminCwb, , adminSp] = await User.create([
    {
      name: "Dra. Ana Rigatti",
      email: "admin@rigatti.com.br",
      passwordHash,
      role: "admin",
      companyId: curitiba._id
    },
    {
      name: "Dr. Carlos Rigatti",
      email: "admin@rigatti-sp.com.br",
      passwordHash,
      role: "admin",
      companyId: saopaulo._id
    },
    { name: "Cliente Demo", email: "cliente@rigatti.com.br", passwordHash, role: "cliente" }
  ]);

  await Product.create([
    ...demoCatalog.curitiba.map((item) => ({ companyId: curitiba._id, ...item })),
    ...demoCatalog.saopaulo.map((item) => ({ companyId: saopaulo._id, ...item }))
  ]);

  const cwbLogs = buildChatLogs(curitiba._id, adminCwb._id);
  const spLogs = buildChatLogs(saopaulo._id, adminSp._id);

  await ChatLog.insertMany([...cwbLogs, ...spLogs]);

  console.log(
    `Seed finalizado: 2 unidades, 24 tratamentos, ${cwbLogs.length + spLogs.length} logs de chat para o mapa de calor.`
  );
}

seed()
  .catch((error) => {
    console.error("Erro ao rodar seed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
