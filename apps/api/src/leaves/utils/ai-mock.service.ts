import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * 🤖 AiMockService
 *
 * Responsabilidade única: gerar conteúdos simulados de IA
 * (resumos e flashcards) para as folhas de anotação.
 *
 * Todos os métodos são funções puras — não dependem de banco,
 * API externa ou estado. Futuramente pode ser substituído por
 * uma integração real com OpenAI, Anthropic, ou similar.
 */
@Injectable()
export class AiMockService {
  constructor() {}

  /**
   * Gera um resumo simulado a partir do título e texto bruto de uma folha.
   */
  generateSummary(title: string, rawText: string): string {
    const cleanTitle = title;
    const cleanText = rawText || 'Sem conteúdo adicional.';

    return `### Resumo da Aula: ${cleanTitle}\n\n` +
      `Este resumo foi gerado dinamicamente pela inteligência artificial com base nas notas fornecidas.\n\n` +
      `- **Conceito Principal**: Foco em ${cleanTitle}.\n` +
      `- **Ideias Chave**:\n` +
      `  1. A importância de reter os conceitos práticos e relacioná-los a exemplos do cotidiano.\n` +
      `  2. Uso de revisões sistemáticas para evitar a curva do esquecimento de Ebbinghaus.\n` +
      `- **Conteúdo Analisado**:\n` +
      `  > "${cleanText.substring(0, 150)}${cleanText.length > 150 ? '...' : ''}"\n\n` +
      `*Utilize os flashcards associados para testar sua memória ativa!*`;
  }

  /**
   * Gera flashcards simulados a partir do título de uma folha.
   * Retorna os dados prontos para serem persistidos no banco.
   */
  generateFlashcardTemplates(
    leafId: string,
    notebookId: string,
    title: string,
  ): Array<{
    id: string;
    leafId: string;
    notebookId: string;
    front: string;
    back: string;
    repetitions: number;
    interval: number;
    easeFactor: number;
    nextReviewDate: Date;
  }> {
    const now = new Date();

    return [
      {
        id: crypto.randomUUID(),
        leafId,
        notebookId,
        front: `Qual é o tema principal abordado na folha "${title}"?`,
        back: `O tema principal é "${title}", focado em aprofundar e consolidar este conteúdo de forma sistemática.`,
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: now,
      },
      {
        id: crypto.randomUUID(),
        leafId,
        notebookId,
        front: `De acordo com as notas de "${title}", qual é uma boa prática de estudo para este tema?`,
        back: 'Escrever resumos com as próprias palavras e fazer exercícios práticos/simulados logo em seguida.',
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: now,
      },
      {
        id: crypto.randomUUID(),
        leafId,
        notebookId,
        front: `Qual a importância da repetição espaçada no aprendizado de "${title}"?`,
        back: 'Ela ajuda a combater a curva do esquecimento, movendo a informação da memória de curto prazo para a de longo prazo.',
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: now,
      },
    ];
  }
}
