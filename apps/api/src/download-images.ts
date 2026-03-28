/**
 * Baixa imagens dos tratamentos (original 900×600 + thumbnail 400×267 em WebP).
 * Cada tratamento pode ter até 6 imagens. Arquivos já existentes são ignorados.
 * Rodar com: npm run download-images
 */
import { access, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const ORIGINAL_DIR = path.resolve("uploads/products/original");
const THUMB_DIR = path.resolve("uploads/products/thumb");

// IDs com prefixo "picsum:" usam picsum.photos (sempre disponível).
// IDs sem prefixo usam Unsplash CDN direto.
const TREATMENTS: Array<{ slug: string; src: string }> = [
  // ── Toxina Botulínica Facial ─────────────────────────────────────────────
  { slug: "toxina-botulinica-facial", src: "1570172619644-dfd03ed5d881" },
  { slug: "toxina-botulinica-facial-2", src: "picsum:botox-clinic-2" },
  { slug: "toxina-botulinica-facial-3", src: "picsum:botox-clinic-3" },

  // ── Preenchimento Labial ─────────────────────────────────────────────────
  { slug: "preenchimento-labial", src: "1487412720507-e7ab37603c6f" },
  { slug: "preenchimento-labial-2", src: "picsum:lip-filler-2" },
  { slug: "preenchimento-labial-3", src: "picsum:lip-beauty-3" },

  // ── Bioestimulador de Colágeno ───────────────────────────────────────────
  { slug: "bioestimulador-colageno", src: "1616394584738-fc6e612e71b9" },
  { slug: "bioestimulador-colageno-2", src: "picsum:collagen-skin-2" },
  { slug: "bioestimulador-colageno-3", src: "picsum:collagen-skin-3" },

  // ── Harmonização Facial ──────────────────────────────────────────────────
  { slug: "harmonizacao-facial", src: "1512290923902-8a9f81dc236c" },
  { slug: "harmonizacao-facial-2", src: "picsum:facial-harmony-2" },
  { slug: "harmonizacao-facial-3", src: "picsum:facial-harmony-3" },

  // ── Skinbooster Profhilo ─────────────────────────────────────────────────
  { slug: "skinbooster-profhilo", src: "picsum:skinbooster" },
  { slug: "skinbooster-profhilo-2", src: "picsum:skinbooster-2" },
  { slug: "skinbooster-profhilo-3", src: "picsum:hydration-skin-3" },

  // ── Microagulhamento com PRP ─────────────────────────────────────────────
  { slug: "microagulhamento-prp", src: "picsum:microneedling" },
  { slug: "microagulhamento-prp-2", src: "picsum:microneedling-2" },
  { slug: "microagulhamento-prp-3", src: "picsum:prp-skin-3" },

  // ── Peel Químico ─────────────────────────────────────────────────────────
  { slug: "peel-quimico-medio", src: "1527864550417-7fd91fc51a46" },
  { slug: "peel-quimico-medio-2", src: "picsum:chemical-peel-2" },
  { slug: "peel-quimico-medio-3", src: "picsum:skin-exfoliation-3" },

  // ── Limpeza de Pele ──────────────────────────────────────────────────────
  { slug: "limpeza-pele-profunda", src: "1580489944761-15a19d654956" },
  { slug: "limpeza-pele-profunda-2", src: "picsum:facial-cleansing-2" },
  { slug: "limpeza-pele-profunda-3", src: "picsum:spa-facial-3" },

  // ── Fio PDO ──────────────────────────────────────────────────────────────
  { slug: "fio-sustentacao-pdo", src: "1531746790731-6c087fecd65a" },
  { slug: "fio-sustentacao-pdo-2", src: "picsum:thread-lift-2" },
  { slug: "fio-sustentacao-pdo-3", src: "picsum:face-lifting-3" },

  // ── Laser CO2 ────────────────────────────────────────────────────────────
  { slug: "laser-co2-fracionado", src: "1559599101-f09722fb4948" },
  { slug: "laser-co2-fracionado-2", src: "picsum:laser-skin-2" },
  { slug: "laser-co2-fracionado-3", src: "picsum:laser-treatment-3" },

  // ── IPL ──────────────────────────────────────────────────────────────────
  { slug: "ipl-luz-intensa-pulsada", src: "1541701494587-cb58502866ab" },
  { slug: "ipl-luz-intensa-pulsada-2", src: "picsum:ipl-light-2" },
  { slug: "ipl-luz-intensa-pulsada-3", src: "picsum:photorejuvenation-3" },

  // ── Depilação Axila ──────────────────────────────────────────────────────
  { slug: "depilacao-laser-axila", src: "1519415943484-9fa1873496d4" },
  { slug: "depilacao-laser-axila-2", src: "picsum:laser-hair-axila-2" },
  { slug: "depilacao-laser-axila-3", src: "picsum:laser-hair-clinic-3" },

  // ── Lipo Papada ──────────────────────────────────────────────────────────
  { slug: "lipo-papada", src: "1576091160399-112ba8d25d1d" },
  { slug: "lipo-papada-2", src: "picsum:chin-lipo-2" },
  { slug: "lipo-papada-3", src: "picsum:neck-contour-3" },

  // ── Criolipólise ─────────────────────────────────────────────────────────
  { slug: "criolipolise-abdomen", src: "1571019613454-1cb2f99b2d8b" },
  { slug: "criolipolise-abdomen-2", src: "picsum:cryolipolysis-2" },
  { slug: "criolipolise-abdomen-3", src: "picsum:body-slimming-3" },

  // ── Radiofrequência ──────────────────────────────────────────────────────
  { slug: "radiofrequencia-corporal", src: "1544367567-0f2fcb009e0b" },
  { slug: "radiofrequencia-corporal-2", src: "picsum:radiofrequency-2" },
  { slug: "radiofrequencia-corporal-3", src: "picsum:body-tightening-3" },

  // ── HIFU ─────────────────────────────────────────────────────────────────
  { slug: "hifu-ultrassom", src: "1519085360753-af0119f7cbe7" },
  { slug: "hifu-ultrassom-2", src: "picsum:hifu-device-2" },
  { slug: "hifu-ultrassom-3", src: "picsum:ultrasound-lift-3" },

  // ── Massagem Modeladora ──────────────────────────────────────────────────
  { slug: "massagem-modeladora", src: "1544161515-4ab6ce6db874" },
  { slug: "massagem-modeladora-2", src: "picsum:body-massage-2" },
  { slug: "massagem-modeladora-3", src: "picsum:lymphatic-drainage-3" },

  // ── Ozonioterapia ────────────────────────────────────────────────────────
  { slug: "ozonioterapia-corporal", src: "1583454110551-21f2fa2afe61" },
  { slug: "ozonioterapia-corporal-2", src: "picsum:ozone-therapy-2" },
  { slug: "ozonioterapia-corporal-3", src: "picsum:body-treatment-3" },

  // ── Carboxiterapia ───────────────────────────────────────────────────────
  { slug: "carboxiterapia", src: "1594824476967-48c8b964273f" },
  { slug: "carboxiterapia-2", src: "picsum:carboxy-therapy-2" },
  { slug: "carboxiterapia-3", src: "picsum:co2-injection-3" },

  // ── Toxina Corporal ──────────────────────────────────────────────────────
  { slug: "toxina-botulinica-corporal", src: "1515377905703-c4788e51af15" },
  { slug: "toxina-botulinica-corporal-2", src: "picsum:botox-body-2" },
  { slug: "toxina-botulinica-corporal-3", src: "picsum:hyperhidrosis-3" },

  // ── Preenchimento Glúteo ─────────────────────────────────────────────────
  { slug: "preenchimento-gluteo", src: "picsum:gluteo-aesthetics" },
  { slug: "preenchimento-gluteo-2", src: "picsum:gluteal-treatment-2" },
  { slug: "preenchimento-gluteo-3", src: "picsum:body-contouring-3" },

  // ── Depilação Perna ──────────────────────────────────────────────────────
  { slug: "depilacao-laser-perna", src: "1559757148-5c350d0d3c56" },
  { slug: "depilacao-laser-perna-2", src: "picsum:laser-leg-2" },
  { slug: "depilacao-laser-perna-3", src: "picsum:hair-removal-3" },

  // ── Laser Nd:YAG ─────────────────────────────────────────────────────────
  { slug: "laser-ndyag-varizes", src: "1612349317150-e413f6a5b16d" },
  { slug: "laser-ndyag-varizes-2", src: "picsum:vein-laser-2" },
  { slug: "laser-ndyag-varizes-3", src: "picsum:varicose-treatment-3" },

  // ── Consulta ─────────────────────────────────────────────────────────────
  { slug: "consulta-avaliacao", src: "1576091160550-2173dba999ef" },
  { slug: "consulta-avaliacao-2", src: "picsum:consultation-2" },
  { slug: "consulta-avaliacao-3", src: "picsum:aesthetic-consult-3" }
];

async function downloadBuffer(src: string, w: number, h: number): Promise<Buffer> {
  const url = src.startsWith("picsum:")
    ? `https://picsum.photos/seed/${src.slice(7)}/${w}/${h}`
    : `https://images.unsplash.com/photo-${src}?w=${w}&h=${h}&fit=crop&auto=format&q=85`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(ORIGINAL_DIR, { recursive: true });
  await mkdir(THUMB_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;

  for (const { slug, src } of TREATMENTS) {
    const alreadyExists = await access(path.join(ORIGINAL_DIR, `${slug}.webp`))
      .then(() => true)
      .catch(() => false);

    if (alreadyExists) {
      skipped++;
      continue;
    }

    process.stdout.write(`  ⬇  ${slug} ... `);

    try {
      const [origBuf, thumbBuf] = await Promise.all([
        downloadBuffer(src, 900, 600),
        downloadBuffer(src, 400, 267)
      ]);

      await Promise.all([
        sharp(origBuf)
          .resize(900, 600, { fit: "cover" })
          .webp({ quality: 85 })
          .toFile(path.join(ORIGINAL_DIR, `${slug}.webp`)),
        sharp(thumbBuf)
          .resize(400, 267, { fit: "cover" })
          .webp({ quality: 75 })
          .toFile(path.join(THUMB_DIR, `${slug}.webp`))
      ]);

      downloaded++;
      console.log("ok");
    } catch (err) {
      console.log(`ERRO: ${(err as Error).message}`);
    }
  }

  console.log(`\nConcluído: ${downloaded} baixadas, ${skipped} já existiam.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
