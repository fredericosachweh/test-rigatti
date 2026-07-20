import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./db/connect.js";
import { ChatLog } from "./models/ChatLog.js";
import { Company } from "./models/Company.js";
import { Product } from "./models/Product.js";
import { User } from "./models/User.js";

// ── Imagens ─────────────────────────────────────────────────────────────────
// Fotos de motos servidas por palavra-chave (estáveis via lock). O admin pode
// substituir por fotos reais do estoque a qualquer momento pelo painel.
let imgLock = 100;
function bikeImgs(count: number = 3) {
  return {
    images: Array.from({ length: count }, () => {
      const lock = imgLock++;
      return {
        imageUrl: `https://loremflickr.com/1024/768/motorcycle,superbike/all?lock=${lock}`,
        thumbnailUrl: `https://loremflickr.com/480/360/motorcycle,superbike/all?lock=${lock}`
      };
    })
  };
}

interface Bike {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  engineCc: number;
  color: string;
  price: number;
  category: string;
  description: string;
}

function toProduct(bike: Bike) {
  return {
    name: `${bike.brand} ${bike.model} ${bike.year}`,
    description: bike.description,
    price: bike.price,
    category: bike.category,
    brand: bike.brand,
    model: bike.model,
    year: bike.year,
    mileage: bike.mileage,
    engineCc: bike.engineCc,
    color: bike.color,
    ...bikeImgs(3)
  };
}

// ── Catálogo representativo de motos premium / alta cilindrada ──────────────
const demoCatalog: Record<string, Bike[]> = {
  curitiba: [
    {
      brand: "BMW",
      model: "R 1250 GS",
      year: 2021,
      mileage: 32000,
      engineCc: 1254,
      color: "Cinza",
      price: 89900,
      category: "Big Trail",
      description:
        "A rainha das trail. Motor boxer de 1254cc, pacote de eletrônica completo, malas laterais e revisões em dia. Pronta para viajar o Brasil."
    },
    {
      brand: "Ducati",
      model: "Monster 937",
      year: 2022,
      mileage: 12000,
      engineCc: 937,
      color: "Vermelho",
      price: 68900,
      category: "Naked",
      description:
        "Naked italiana leve e agressiva. Testastretta de 111cv, quickshifter e modos de pilotagem. Único dono, impecável."
    },
    {
      brand: "Kawasaki",
      model: "Z900",
      year: 2020,
      mileage: 18500,
      engineCc: 948,
      color: "Verde",
      price: 45900,
      category: "Naked",
      description:
        "Quatro cilindros equilibrada e cheia de torque. Escapamento esportivo, pneus novos e manutenção com histórico."
    },
    {
      brand: "Harley-Davidson",
      model: "Iron 883",
      year: 2019,
      mileage: 21000,
      engineCc: 883,
      color: "Preto",
      price: 42900,
      category: "Custom",
      description:
        "Sportster clássica com pegada dark. Guidão, banco e ronco Harley de fábrica. Documentação em dia."
    },
    {
      brand: "Yamaha",
      model: "MT-09",
      year: 2021,
      mileage: 15000,
      engineCc: 889,
      color: "Azul",
      price: 52900,
      category: "Naked",
      description:
        "Motor CP3 de três cilindros, resposta imediata e ronco inconfundível. Eletrônica de última geração e visual sci-fi."
    },
    {
      brand: "Honda",
      model: "CB 1000R",
      year: 2020,
      mileage: 22000,
      engineCc: 998,
      color: "Preto",
      price: 54900,
      category: "Naked",
      description:
        "Neo Sports Café com acabamento premium. Quatro cilindros refinado, controle de tração e conforto para o dia a dia."
    },
    {
      brand: "BMW",
      model: "S 1000 RR",
      year: 2021,
      mileage: 9000,
      engineCc: 999,
      color: "Branco",
      price: 115000,
      category: "Esportiva",
      description:
        "Superbike de 205cv com ShiftCam, DTC e suspensão eletrônica. Baixa quilometragem, estado de zero."
    },
    {
      brand: "Triumph",
      model: "Street Triple 765 RS",
      year: 2022,
      mileage: 8000,
      engineCc: 765,
      color: "Cinza",
      price: 62900,
      category: "Naked",
      description:
        "Três cilindros afinado pela experiência da Moto2. Suspensão Öhlins, freios Brembo e quickshifter bidirecional."
    },
    {
      brand: "Kawasaki",
      model: "Ninja 650",
      year: 2021,
      mileage: 14000,
      engineCc: 649,
      color: "Verde",
      price: 39900,
      category: "Esportiva",
      description:
        "Esportiva equilibrada, ótima primeira superbike. Bicilíndrica econômica, posição confortável e ABS."
    },
    {
      brand: "Ducati",
      model: "Panigale V2",
      year: 2021,
      mileage: 7000,
      engineCc: 955,
      color: "Vermelho",
      price: 92900,
      category: "Esportiva",
      description:
        "Superbike com DNA de pista, 155cv, pacote eletrônico completo e o inconfundível vermelho Ducati. Peça de colecionador."
    },
    {
      brand: "Honda",
      model: "Africa Twin 1100",
      year: 2022,
      mileage: 19000,
      engineCc: 1084,
      color: "Prata",
      price: 78900,
      category: "Big Trail",
      description:
        "Aventureira raiz com câmbio DCT opcional, tanque generoso e capacidade off-road de verdade. Preparada para expedições."
    },
    {
      brand: "Harley-Davidson",
      model: "Fat Bob 114",
      year: 2020,
      mileage: 16000,
      engineCc: 1868,
      color: "Preto",
      price: 79900,
      category: "Custom",
      description:
        "Milwaukee-Eight 114 com torque de sobra, pneu traseiro largo e visual muscular. Presença e som de respeito."
    }
  ],
  saopaulo: [
    {
      brand: "BMW",
      model: "F 850 GS",
      year: 2021,
      mileage: 24000,
      engineCc: 853,
      color: "Amarelo",
      price: 62900,
      category: "Trail",
      description:
        "Trail média versátil, leve no off-road e confortável no asfalto. Bicilíndrica de 95cv com pacote de proteção."
    },
    {
      brand: "Ducati",
      model: "Diavel 1260",
      year: 2020,
      mileage: 13000,
      engineCc: 1262,
      color: "Preto",
      price: 98900,
      category: "Power Cruiser",
      description:
        "A muscle bike da Ducati: 159cv, torque brutal e design que para o trânsito. Estado impecável, revisões na concessionária."
    },
    {
      brand: "Kawasaki",
      model: "Versys 650",
      year: 2021,
      mileage: 20000,
      engineCc: 649,
      color: "Cinza",
      price: 44900,
      category: "Trail",
      description:
        "Crossover versátil para cidade e estrada. Bicilíndrica econômica, protetor de motor e malas. Ótimo custo-benefício."
    },
    {
      brand: "Yamaha",
      model: "MT-07",
      year: 2022,
      mileage: 9000,
      engineCc: 689,
      color: "Azul",
      price: 44900,
      category: "Naked",
      description:
        "A naked mais divertida da categoria. Motor CP2 com torque acessível, leve e ágil no dia a dia. Baixa quilometragem."
    },
    {
      brand: "Triumph",
      model: "Bonneville T120",
      year: 2021,
      mileage: 11000,
      engineCc: 1200,
      color: "Verde",
      price: 66900,
      category: "Custom",
      description:
        "Clássica britânica moderna. Bicilíndrica de 1200cc, acabamento cromado e conforto atemporal. Um ícone."
    },
    {
      brand: "Honda",
      model: "CB 650R",
      year: 2021,
      mileage: 12000,
      engineCc: 649,
      color: "Cinza",
      price: 42900,
      category: "Naked",
      description:
        "Quatro cilindros com ronco encantador no estilo Neo Sports Café. Equilibrada, confiável e bonita de qualquer ângulo."
    },
    {
      brand: "BMW",
      model: "R 1250 RT",
      year: 2020,
      mileage: 28000,
      engineCc: 1254,
      color: "Azul",
      price: 84900,
      category: "Touring",
      description:
        "Touring de luxo para engolir quilômetros. Boxer ShiftCam, para-brisa elétrico, malas e conforto de primeira classe."
    },
    {
      brand: "Suzuki",
      model: "GSX-S 1000",
      year: 2021,
      mileage: 15000,
      engineCc: 999,
      color: "Preto",
      price: 52900,
      category: "Naked",
      description:
        "Hyper naked com motor derivado da GSX-R. 150cv, controle de tração e resposta imediata. Muita moto pelo preço."
    },
    {
      brand: "Harley-Davidson",
      model: "Sportster S",
      year: 2022,
      mileage: 6000,
      engineCc: 1252,
      color: "Vermelho",
      price: 79900,
      category: "Custom",
      description:
        "A nova geração Sportster com motor Revolution Max 1250T, 121cv e eletrônica moderna. Radical e baixa quilometragem."
    },
    {
      brand: "KTM",
      model: "390 Duke",
      year: 2022,
      mileage: 8000,
      engineCc: 373,
      color: "Laranja",
      price: 31900,
      category: "Naked",
      description:
        "A naked mais afiada da entrada. Leve, esperta e cheia de personalidade austríaca. Perfeita para a cidade e o corner."
    }
  ]
};

// ── Dados de amostra para o mapa de calor ──────────
// Simula uso realista da loja: mais atividade em dias úteis,
// horários de pico manhã (9-11h) e tarde (14-17h)
function buildChatLogs(companyId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const now = Date.now();
  const DAY = 86_400_000;

  // Perguntas realistas de quem procura moto
  const conversations: Array<{
    message: string;
    toolArgs: Record<string, unknown> | null;
    answer: string;
  }> = [
    {
      message: "Quais motos trail vocês têm?",
      toolArgs: { category: "Trail", limit: 8 },
      answer:
        "Temos ótimas opções de trail: BMW R 1250 GS, Honda Africa Twin 1100, BMW F 850 GS e Kawasaki Versys 650."
    },
    {
      message: "Tem alguma BMW disponível?",
      toolArgs: { brand: "BMW", limit: 6 },
      answer:
        "Sim! Temos BMW R 1250 GS (R$ 89.900), S 1000 RR (R$ 115.000), R 1250 RT (R$ 84.900) e F 850 GS (R$ 62.900)."
    },
    {
      message: "Quanto custa a Ducati Monster?",
      toolArgs: { search: "monster", limit: 3 },
      answer: "A Ducati Monster 937 2022 com 12.000 km está por R$ 68.900. Único dono e impecável."
    },
    {
      message: "Quero uma naked até R$ 50 mil",
      toolArgs: { category: "Naked", maxPrice: 50000, limit: 8 },
      answer:
        "Nessa faixa temos Kawasaki Z900 (R$ 45.900), Yamaha MT-07 (R$ 44.900), Honda CB 650R (R$ 42.900) e KTM 390 Duke (R$ 31.900)."
    },
    {
      message: "Tem Harley custom?",
      toolArgs: { brand: "Harley-Davidson", category: "Custom", limit: 5 },
      answer:
        "Temos a Iron 883 (R$ 42.900), Fat Bob 114 (R$ 79.900) e a nova Sportster S (R$ 79.900)."
    },
    {
      message: "Quais superbikes esportivas vocês oferecem?",
      toolArgs: { category: "Esportiva", limit: 6 },
      answer:
        "Temos BMW S 1000 RR (R$ 115.000), Ducati Panigale V2 (R$ 92.900) e Kawasaki Ninja 650 (R$ 39.900)."
    },
    {
      message: "Motos com menos de 15 mil km",
      toolArgs: { limit: 8 },
      answer:
        "Várias! Panigale V2 (7.000 km), Sportster S (6.000 km), Street Triple RS (8.000 km) e MT-07 (9.000 km), entre outras."
    },
    {
      message: "Tem Kawasaki Z900?",
      toolArgs: { search: "z900", limit: 3 },
      answer: "Temos! Kawasaki Z900 2020, verde, 18.500 km, com escape esportivo por R$ 45.900."
    },
    {
      message: "Motos ano 2022",
      toolArgs: { minYear: 2022, limit: 8 },
      answer:
        "De 2022 temos Ducati Monster 937, Triumph Street Triple RS, Honda Africa Twin, Yamaha MT-07, Sportster S e KTM 390 Duke."
    },
    {
      message: "Quero uma moto para viajar",
      toolArgs: { search: "trail touring viagem", limit: 6 },
      answer:
        "Para estrada indicamos a BMW R 1250 GS, a R 1250 RT (touring) e a Honda Africa Twin 1100. Todas prontas para viajar."
    },
    {
      message: "Qual a moto mais barata?",
      toolArgs: { maxPrice: 40000, limit: 5 },
      answer: "A KTM 390 Duke 2022 por R$ 31.900 e a Kawasaki Ninja 650 por R$ 39.900."
    },
    {
      message: "Tem Yamaha MT?",
      toolArgs: { search: "MT yamaha", brand: "Yamaha", limit: 4 },
      answer:
        "Temos a MT-09 (R$ 52.900) e a MT-07 (R$ 44.900), ambas com o famoso motor CP da Yamaha."
    },
    {
      message: "Motos entre 60 e 90 mil",
      toolArgs: { minPrice: 60000, maxPrice: 90000, limit: 8 },
      answer:
        "Nessa faixa: BMW R 1250 GS (R$ 89.900), Ducati Monster 937 (R$ 68.900), Triumph Bonneville T120 (R$ 66.900) e Fat Bob 114 (R$ 79.900)."
    },
    {
      message: "Tem Triumph?",
      toolArgs: { brand: "Triumph", limit: 4 },
      answer: "Temos a Street Triple 765 RS (R$ 62.900) e a clássica Bonneville T120 (R$ 66.900)."
    },
    {
      message: "Qual a moto com maior cilindrada?",
      toolArgs: { search: "cilindrada custom", limit: 5 },
      answer:
        "A Harley-Davidson Fat Bob com motor Milwaukee-Eight 114 (1868cc) é a maior do estoque, por R$ 79.900."
    },
    {
      message: "Vocês fazem financiamento?",
      toolArgs: null,
      answer:
        "Sim! Fazemos análise de financiamento rápida e simples, além de aceitar sua moto na troca. Fale com a equipe pelo WhatsApp (41) 99975-5741."
    }
  ];

  // Distribuição de horários de pico realista para loja
  // Pico: seg-sáb 9-11h e 14-17h | menor atividade: domingo
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
    { name: "Modena SPO — Curitiba", slug: "modena-curitiba" },
    { name: "Modena SPO — São Paulo", slug: "modena-saopaulo" }
  ]);

  const passwordHash = await bcrypt.hash("123456", 10);

  const [adminCwb, , adminSp] = await User.create([
    {
      name: "Equipe Modena Curitiba",
      email: "admin@modenaspo.com.br",
      passwordHash,
      role: "admin",
      companyId: curitiba._id
    },
    {
      name: "Equipe Modena São Paulo",
      email: "admin@modenaspo-sp.com.br",
      passwordHash,
      role: "admin",
      companyId: saopaulo._id
    },
    { name: "Cliente Demo", email: "cliente@modenaspo.com.br", passwordHash, role: "cliente" }
  ]);

  await Product.create([
    ...demoCatalog.curitiba.map((bike) => ({ companyId: curitiba._id, ...toProduct(bike) })),
    ...demoCatalog.saopaulo.map((bike) => ({ companyId: saopaulo._id, ...toProduct(bike) }))
  ]);

  const cwbLogs = buildChatLogs(curitiba._id, adminCwb._id);
  const spLogs = buildChatLogs(saopaulo._id, adminSp._id);

  await ChatLog.insertMany([...cwbLogs, ...spLogs]);

  const total = demoCatalog.curitiba.length + demoCatalog.saopaulo.length;
  console.log(
    `Seed finalizado: 2 unidades, ${total} motos, ${cwbLogs.length + spLogs.length} logs de chat para o mapa de calor.`
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
