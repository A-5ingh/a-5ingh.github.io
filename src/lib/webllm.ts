import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import readmeText from '../../README.md?raw';
import { config } from '../portfolio.config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatPortfolioContext(cfg: typeof config): string {
  if (!cfg) return '';
  let md = `PORTFOLIO PROFILE:\n`;
  md += `- Name: ${cfg.name || 'N/A'}\n`;
  md += `- Professional Title: ${cfg.title || 'N/A'}\n`;
  if (cfg.tagline) md += `- Tagline: ${cfg.tagline}\n`;
  if (cfg.location) md += `- Location: ${cfg.location}\n`;
  if (cfg.email) md += `- Email: ${cfg.email}\n`;
  if (cfg.phone) md += `- Phone: ${cfg.phone}\n`;
  if (cfg.openToWork !== undefined) md += `- Open to Opportunities: ${cfg.openToWork ? 'Yes' : 'No'}\n`;
  
  if (cfg.about) {
    md += `\nABOUT:\n${cfg.about}\n`;
  }
  
  if (cfg.skills && cfg.skills.length > 0) {
    md += `\nSKILLS:\n`;
    cfg.skills.forEach((s: any) => {
      md += `- ${s.category}: ${Array.isArray(s.items) ? s.items.join(', ') : s.items}\n`;
    });
  }
  
  if (cfg.experience && cfg.experience.length > 0) {
    md += `\nEXPERIENCE:\n`;
    cfg.experience.forEach((e: any) => {
      md += `### ${e.role} at ${e.company} (${e.period || ''})\n`;
      md += `Description: ${e.description || ''}\n`;
      if (e.highlights && e.highlights.length > 0) {
        md += `Highlights:\n`;
        e.highlights.forEach((h: string) => {
          md += `- ${h}\n`;
        });
      }
    });
  }
  
  if (cfg.projects && cfg.projects.length > 0) {
    md += `\nPROJECTS:\n`;
    cfg.projects.forEach((p: any) => {
      md += `### Project Name: ${p.name}\n`;
      md += `Description: ${p.description || ''}\n`;
      if (p.tags && p.tags.length > 0) {
        md += `Tags: ${p.tags.join(', ')}\n`;
      }
      if (p.liveUrl) md += `Live URL: ${p.liveUrl}\n`;
      if (p.repoUrl) md += `Repository: ${p.repoUrl}\n`;
      md += `Featured: ${p.featured ? 'Yes' : 'No'}\n`;
    });
  }
  
  if (cfg.education && cfg.education.length > 0) {
    md += `\nEDUCATION:\n`;
    cfg.education.forEach((edu: any) => {
      md += `- ${edu.degree} from ${edu.institution} (${edu.period || ''})\n`;
    });
  }
  
  if (cfg.certifications && cfg.certifications.length > 0) {
    md += `\nCERTIFICATIONS:\n`;
    cfg.certifications.forEach((c: any) => {
      md += `- ${c.title} issued by ${c.issuer} (${c.date || ''})\n`;
    });
  }

  if (cfg.languages && cfg.languages.length > 0) {
    md += `\nLANGUAGES:\n`;
    cfg.languages.forEach((l: any) => {
      md += `- ${l.name} (${l.level})\n`;
    });
  }

  if (cfg.testimonials && cfg.testimonials.length > 0) {
    md += `\nTESTIMONIALS:\n`;
    cfg.testimonials.forEach((t: any) => {
      md += `- "${t.quote.trim()}" — ${t.name}, ${t.title} at ${t.company} (${t.relationship})\n`;
    });
  }
  
  return md;
}

export interface WebLLMStatus {
  status: 'not_loaded' | 'loading' | 'ready' | 'error';
  progress?: number;
  error?: string;
}

class WebLLMService {
  private engine: any = null;
  private status: WebLLMStatus = { status: 'not_loaded' };
  private statusCallbacks: ((status: WebLLMStatus) => void)[] = [];

  // Check if WebGPU is available
  isWebGPUSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  // Subscribe to status updates
  onStatusChange(callback: (status: WebLLMStatus) => void) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  private updateStatus(status: WebLLMStatus) {
    this.status = status;
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  // Initialize the model
  async initialize() {
    if (!this.isWebGPUSupported()) {
      this.updateStatus({
        status: 'error',
        error:
          'WebGPU not supported. Please use a modern browser like Chrome 113+, Safari 26+, or Edge 113+.',
      });
      return;
    }

    if (this.status.status === 'ready') return;

    try {
      this.updateStatus({ status: 'loading', progress: 0 });

      // Create web worker for better UI performance
      const worker = new Worker(
        new URL('./webllm-worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );

      // Use the smallest model: Llama-3.2-1B-Instruct-q4f16_1-MLC
      const appConfig = {
        ...prebuiltAppConfig,
        cacheBackend: 'indexeddb' as const,
      };

      this.engine = await CreateWebWorkerMLCEngine(
        worker,
        'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        {
          appConfig,
          initProgressCallback: (progress) => {
            this.updateStatus({
              status: 'loading',
              progress: Math.round(progress.progress * 100),
            });
          },
        }
      );

      this.updateStatus({ status: 'ready' });
    } catch (error) {
      console.error('WebLLM initialization failed:', error);
      this.updateStatus({
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize AI model',
      });
    }
  }

  // Generate chat response
  async *chat(
    messages: ChatMessage[],
    pageContext: string
  ): AsyncGenerator<string> {
    if (this.status.status !== 'ready' || !this.engine) {
      await this.initialize();
    }

    if (this.status.status !== 'ready' || !this.engine) {
      throw new Error('WebLLM not ready. Please wait for initialization.');
    }

    try {
      const portfolioProfileContext = formatPortfolioContext(config);
      const systemPrompt = `You are the AI Interviewer and personal representative for ${config.name || 'the portfolio owner'}. Your goal is to represent them to recruiters, hiring managers, and visitors.
      
Your guidelines:
- Answer questions on behalf of ${config.name || 'the portfolio owner'} in a professional, polite, and engaging tone.
- Answer questions about their skills, experience, projects, education, certifications, and background using the profile provided below.
- Keep your answers concise, informative, and focused on their professional achievements.
- If asked about unrelated topics (e.g. general search, trivia, math, or tasks unrelated to their work), politely decline and state that you are only here to answer questions about ${config.name || 'the portfolio owner'}'s background and portfolio.
- If you don't know the answer or if it's not in the profile, state that you don't have that information in your profile context, and encourage them to reach out directly using the contact details or contact form on the page.

PORTFOLIO BACKGROUND DATA:
${portfolioProfileContext}

Current active page view / visual context:
${pageContext}`;

      // Convert messages to OpenAI format
      const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
      ];

      // Create streaming completion
      const chunks = await this.engine.chat.completions.create({
        messages: openaiMessages,
        stream: true,
        max_tokens: 300, // Reduced for more focused responses
        temperature: 0.3, // Lower for more consistent, factual responses
        top_p: 0.9,
      });

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Chat generation failed:', error);
      throw error;
    }
  }

  // Get current status
  getStatus(): WebLLMStatus {
    return this.status;
  }

  // Reset/clear the service
  reset() {
    this.engine = null;
    this.status = { status: 'not_loaded' };
  }
}

// Singleton instance
export const webLLMService = new WebLLMService();
