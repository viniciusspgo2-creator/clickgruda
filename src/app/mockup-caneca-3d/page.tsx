import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MockupStudioIllustration } from "@/components/site/illustrations";
import {
  ArrowRight,
  ArrowUpRight,
  Upload,
  RotateCcw,
  Download,
  Layers3,
  Palette,
  Video,
  ShieldCheck,
  Sparkles,
  Camera,
  WandSparkles,
  Instagram,
  Facebook,
  BookOpen,
  CheckCircle2,
  Gift,
  ScanFace,
  Image as PhotoIcon,
} from "lucide-react";
import "./guide.css";
export const metadata: Metadata = {
  title: "Mockup de Caneca 3D online | Click&Gruda",
  description:
    "Crie mockups de canecas 3D para sublimação: envie sua arte, ajuste estampa, cerâmica e iluminação e exporte imagens ou vídeos de até 20 segundos.",
  alternates: { canonical: "/mockup-caneca-3d" },
  openGraph: {
    title: "Mockup de Caneca 3D online | Click&Gruda",
    description:
      "Sua arte na caneca em segundos. Studio 3D para quem trabalha com sublimação.",
    type: "website",
    images: [{ url: "/og/og-default.png" }],
  },
};
const features = [
  {
    icon: RotateCcw,
    title: "Giro 360°",
    description: "Mostre a estampa de todos os ângulos.",
  },
  {
    icon: Palette,
    title: "Cerâmica personalizada",
    description: "Corpo, alça, interior e acabamento.",
  },
  {
    icon: Sparkles,
    title: "Caneca mágica",
    description: "Simule a revelação da estampa pelo calor.",
  },
  {
    icon: Layers3,
    title: "Várias canecas",
    description: "Componha pares, trios e vitrines.",
  },
  {
    icon: PhotoIcon,
    title: "Cenários prontos",
    description: "Fundos para anúncios e catálogos.",
  },
  {
    icon: Video,
    title: "Vídeo HD e 4K",
    description: "Grave até 20 segundos e personalize o giro.",
  },
  {
    icon: ScanFace,
    title: "Fundo transparente",
    description: "Separe a caneca do cenário na exportação.",
  },
  {
    icon: Download,
    title: "Folha de sublimação",
    description: "Prepare a impressão em 300 ou 600 DPI.",
  },
];
const steps = [
  {
    title: "Envie sua arte",
    desc: "Arraste, cole com Ctrl+V ou escolha a estampa do seu computador.",
    tip: "PNG com boa resolução oferece melhor nitidez.",
  },
  {
    title: "Encaixe a estampa",
    desc: "Cubra a caneca ou respeite a área da prensa. Ajuste tamanho e posição.",
    tip: "Confira a área de impressão antes de salvar.",
  },
  {
    title: "Monte a cena",
    desc: "Escolha a cerâmica, as cores, o fundo, a luz e a sombra.",
    tip: "A luz suave funciona bem para catálogos.",
  },
  {
    title: "Salve ou grave",
    desc: "Exporte PNG, JPG, vídeo, GIF, ZIP ou folha de sublimação.",
    tip: "Use formato vertical para Stories e Reels.",
  },
];
const faqs = [
  [
    "Quanto custa o Studio?",
    "O acesso avulso custa R$ 12,90 por 24 horas, com criação de mockups sem limite de quantidade nesse período. Assinantes da Biblioteca Click Gruda têm acesso gratuito. Pagamento e liberação de código são feitos pelo suporte no WhatsApp.",
  ],
  [
    "Posso compartilhar meu código?",
    "O código é pessoal e fica vinculado a um navegador. Um novo login substitui a sessão anterior. Solicite ao suporte se precisar trocar de navegador.",
  ],
  [
    "Preciso instalar algum programa?",
    "Não. O Studio funciona diretamente no navegador compatível com gráficos 3D. O acesso premium é validado com seu código.",
  ],
  [
    "Minha arte fica salva?",
    "Projetos e artes podem ser guardados no navegador, com opção de baixar um arquivo .cgstudio. Guarde uma cópia para maior segurança.",
  ],
  [
    "Quais formatos de arte posso enviar?",
    "PNG, JPG, WebP, SVG e AVIF, conforme o suporte do seu navegador.",
  ],
  [
    "O vídeo sai em qualidade boa para anúncio?",
    "Há exportações em Full HD, 2K e até 4K nos navegadores compatíveis. A nitidez depende também da arte original e do equipamento.",
  ],
  [
    "Funciona no celular?",
    "Sim, em aparelhos com navegador e capacidade gráfica compatíveis. Exportações em 4K são mais exigentes e podem precisar de computador.",
  ],
  [
    "Posso usar mockups em anúncios?",
    "Você pode usar os mockups que criar com artes para as quais tenha direitos de uso, inclusive em apresentações, anúncios e marketplaces.",
  ],
  [
    "O que é a caneca mágica?",
    "É a caneca térmica cuja estampa é revelada ao aquecer. O Studio simula esse efeito na visualização e no vídeo.",
  ],
  [
    "Como imprimo a folha de sublimação?",
    "Use a opção de folha de sublimação, escolha 300 ou 600 DPI e confira as medidas e as configurações da sua impressora e prensa.",
  ],
];
const baseUrl = "https://clickgruda.vercel.app/mockup-caneca-3d";
const structured = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mockup de Caneca 3D Click&Gruda",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: baseUrl,
    description:
      "Editor online de mockups 3D para sublimação de canecas. Acesso premium por código.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([name, answer]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];
const primary = "cg-guide-cta";
export default function GuidePage() {
  return (
    <div className="cg-guide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <main>
        <section className="cg-guide-hero">
          <div className="cg-guide-container cg-guide-hero-grid">
            <div className="cg-guide-hero-copy">
              <span className="cg-eyebrow">
                <span className="cg-live" /> SUA ARTE. SUA CANECA. SEU ESTÚDIO.
              </span>
              <h1>
                Mockup de <span>Caneca 3D</span>
              </h1>
              <p>
                Mande a sua arte e veja a caneca montada na hora — gire a peça,
                encaixe a estampa, troque a cor da cerâmica, salve a imagem ou
                grave o vídeo.
              </p>
              <div className="cg-guide-actions">
                <Link className={primary} href="/mockup-caneca-3d/studio">
                  Abrir o Mockup Studio <ArrowRight size={18} />
                </Link>
                <a className="cg-guide-ghost" href="#como-funciona">
                  Ver como funciona
                </a>
              </div>
              <div className="cg-guide-aux">
                <a
                  href="https://clickgruda.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen size={17} /> Biblioteca de artes{" "}
                  <ArrowUpRight size={15} />
                </a>
                <a
                  href="https://instagram.com/clickgruda.digital"
                  aria-label="Instagram Click&Gruda"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://www.facebook.com/artesparacanecasoficial"
                  aria-label="Facebook Click&Gruda"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook size={18} />
                </a>
              </div>
              <div className="cg-hero-chips">
                <span>
                  <CheckCircle2 size={15} /> 3D em tempo real
                </span>
                <span>
                  <CheckCircle2 size={15} /> Exportação até 4K
                </span>
                <span>
                  <CheckCircle2 size={15} /> Sem instalar nada
                </span>
              </div>
            </div>
            <div className="cg-guide-hero-visual">
              <div className="cg-guide-visual-head">
                <span>
                  <span className="cg-live" /> PRÉVIA DO ESTÚDIO
                </span>
                <span>360°</span>
              </div>
              <MockupStudioIllustration />
              <div className="cg-guide-visual-foot">
                <span>CANECAS PERSONALIZADAS</span>
                <span>•</span>
                <span>REALISMO + CRIATIVIDADE</span>
              </div>
            </div>
          </div>
        </section>
        <section className="cg-guide-for">
          <div className="cg-guide-container cg-for-row">
            <div>
              <span className="cg-section-kicker">FEITO PARA QUEM CRIA</span>
              <h2>Mostre o resultado antes de ligar a prensa.</h2>
            </div>
            <p>
              Para quem trabalha com sublimação de caneca: ateliês, lojas de
              presentes, brindes de empresas e datas especiais. Com o mockup 3D,
              seu cliente vê a caneca com a arte dele antes da produção — e você
              já tem conteúdo para anunciar.
            </p>
          </div>
        </section>
        <section className="cg-guide-section" id="como-funciona">
          <div className="cg-guide-container">
            <div className="cg-section-heading">
              <span className="cg-section-kicker">RÁPIDO DE COMEÇAR</span>
              <h2>Da sua arte ao mockup em 4 passos.</h2>
              <p>Fluxo direto para seu dia a dia de sublimação.</p>
            </div>
            <div className="cg-step-grid">
              {steps.map((s, i) => (
                <article key={s.title} className="cg-step-card">
                  <span className="cg-step-number">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <div className="cg-tip">DICA: {s.tip}</div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="cg-guide-section cg-guide-feature-section">
          <div className="cg-guide-container">
            <div className="cg-section-heading">
              <span className="cg-section-kicker">UM ESTÚDIO COMPLETO</span>
              <h2>Mais que uma imagem. Uma apresentação que vende.</h2>
              <p>
                Os recursos que ajudam você a mostrar o trabalho com mais
                confiança.
              </p>
            </div>
            <div className="cg-feature-grid">
              {features.map((f) => (
                <article className="cg-feature-card" key={f.title}>
                  <div className="cg-feature-icon">
                    <f.icon size={23} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="cg-guide-library">
          <div className="cg-guide-container cg-guide-library-inner">
            <div>
              <span className="cg-section-kicker">INSPIRAÇÃO SEM FIM</span>
              <h2>Biblioteca de artes Click&Gruda</h2>
              <p>
                Milhares de artes selecionadas para sublimação, organizadas por
                categorias e datas sazonais, com novidades toda semana. Escolha
                a estampa e leve para o seu mockup.
              </p>
              <a
                href="https://clickgruda.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={primary}
              >
                Conhecer a biblioteca <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="cg-library-decor">
              <div className="cg-library-card cg-library-a">
                <Gift size={55} />
                <span>PRESENTES</span>
              </div>
              <div className="cg-library-card cg-library-b">
                <Sparkles size={55} />
                <span>DATAS ESPECIAIS</span>
              </div>
              <div className="cg-library-card cg-library-c">
                <WandSparkles size={55} />
                <span>SUA CRIATIVIDADE</span>
              </div>
            </div>
          </div>
        </section>
        <section className="cg-guide-section">
          <div className="cg-guide-container cg-guide-faq">
            <div>
              <span className="cg-section-kicker">DÚVIDAS FREQUENTES</span>
              <h2>Tudo o que você precisa saber.</h2>
              <p>Respostas curtas, antes de você começar.</p>
            </div>
            <div>
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span>+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="cg-guide-final">
          <div className="cg-guide-container">
            <Camera size={38} />
            <h2>Pronto para transformar sua arte em uma caneca 3D?</h2>
            <p>Abra o Studio, envie sua estampa e comece a criar.</p>
            <Link href="/mockup-caneca-3d/studio" className={primary}>
              Abrir o Mockup Studio <ArrowRight size={18} />
            </Link>
            <div className="cg-guide-final-social">
              Siga a Click&Gruda{" "}
              <a
                href="https://instagram.com/clickgruda.digital"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} /> Instagram
              </a>
              <a
                href="https://www.facebook.com/artesparacanecasoficial"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={18} /> Facebook
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
