/**
 * AI Mediation Flow Service
 * Implements Udine's core mediation logic using the Express/Reflect technique
 */

export type MediationPhase = 'greeting' | 'names' | 'express' | 'reflect' | 'understand' | 'resolve' | 'heal';
export type UserRole = 'host' | 'participant';

export interface MediationState {
  phase: MediationPhase;
  hostName?: string;
  participantName?: string;
  currentSpeaker?: UserRole;
  turnCount: number;
  sessionStartTime: Date;
  lastActivity: Date;
}

export interface MediationOptions {
  onPhaseChange?: (phase: MediationPhase) => void;
  onUdineSpeak?: (message: string, phase: MediationPhase) => void;
  onUserPrompt?: (prompt: string, targetUser?: UserRole) => void;
  onError?: (error: Error) => void;
}

export class MediationFlowService {
  private state: MediationState;
  private options: MediationOptions;

  constructor(options: MediationOptions = {}) {
    this.options = options;
    this.state = {
      phase: 'greeting',
      turnCount: 0,
      sessionStartTime: new Date(),
      lastActivity: new Date(),
    };
  }

  /**
   * Start the mediation session
   */
  startSession(): void {
    console.log('🤝 Starting mediation session with Udine');
    this.updatePhase('greeting');
    this.deliverGreeting();
  }

  /**
   * Deliver Udine's initial greeting
   */
  private deliverGreeting(): void {
    const greeting = `Hello, and welcome to this conversation space. I'm Udine, your AI mediator. 
    I'm here to help you both communicate effectively and find understanding together. 
    This is a safe space where you can express yourselves openly and work through any differences you may have.
    
    Before we begin, I'd like to know your names. Could the person who created this room please tell me your name first?`;

    this.speakAsUdine(greeting, 'greeting');
    
    // Transition to name collection phase
    setTimeout(() => {
      this.updatePhase('names');
    }, 2000);
  }

  /**
   * Process user speech input
   */
  processUserSpeech(text: string, userRole: UserRole): void {
    console.log(`👤 ${userRole} said: "${text}"`);
    
    this.state.lastActivity = new Date();
    this.state.currentSpeaker = userRole;

    switch (this.state.phase) {
      case 'names':
        this.handleNameCollection(text, userRole);
        break;
      case 'express':
        this.handleExpressPhase(text, userRole);
        break;
      case 'reflect':
        this.handleReflectPhase(text, userRole);
        break;
      case 'understand':
        this.handleUnderstandPhase(text, userRole);
        break;
      case 'resolve':
        this.handleResolvePhase(text, userRole);
        break;
      case 'heal':
        this.handleHealPhase(text, userRole);
        break;
      default:
        console.log('🤖 Udine is listening...');
    }

    this.state.turnCount++;
  }

  /**
   * Handle name collection phase
   */
  private handleNameCollection(text: string, userRole: UserRole): void {
    // Simple name extraction (in real implementation, use NLP)
    const nameMatch = text.match(/(?:my name is|i'm|i am|call me)\s+(\w+)/i);
    const extractedName = nameMatch ? nameMatch[1] : text.split(' ')[0];

    if (userRole === 'host' && !this.state.hostName) {
      this.state.hostName = extractedName;
      this.speakAsUdine(`Thank you, ${extractedName}. Now, could the other person please tell me your name?`, 'names');
    } else if (userRole === 'participant' && !this.state.participantName) {
      this.state.participantName = extractedName;
      this.speakAsUdine(`Thank you, ${extractedName}. Now that I know both of your names, let's begin our conversation.`, 'names');
      
      // Transition to express phase
      setTimeout(() => {
        this.startExpressPhase();
      }, 3000);
    }
  }

  /**
   * Start the Express phase
   */
  private startExpressPhase(): void {
    this.updatePhase('express');
    
    const hostName = this.state.hostName || 'the first person';
    const participantName = this.state.participantName || 'the second person';

    const expressIntro = `${hostName} and ${participantName}, we're now going to use a technique called "Express and Reflect." 
    This helps ensure you both feel heard and understood.
    
    ${hostName}, since you created this room, would you like to start by expressing what's on your mind? 
    Please share your thoughts and feelings openly. ${participantName}, I'll ask you to listen carefully and then reflect back what you heard.`;

    this.speakAsUdine(expressIntro, 'express');
  }

  /**
   * Handle Express phase
   */
  private handleExpressPhase(text: string, userRole: UserRole): void {
    const otherRole = userRole === 'host' ? 'participant' : 'host';
    const speakerName = userRole === 'host' ? this.state.hostName : this.state.participantName;
    const listenerName = userRole === 'host' ? this.state.participantName : this.state.hostName;

    // After someone expresses, move to reflect phase
    this.updatePhase('reflect');
    
    const reflectPrompt = `Thank you for sharing, ${speakerName}. 
    ${listenerName}, now I'd like you to reflect back what you heard. 
    Try to capture not just the words, but also the feelings and concerns that ${speakerName} expressed. 
    Start with something like "What I heard you say was..." or "It sounds like you're feeling..."`;

    this.speakAsUdine(reflectPrompt, 'reflect');
  }

  /**
   * Handle Reflect phase
   */
  private handleReflectPhase(text: string, userRole: UserRole): void {
    const speakerName = userRole === 'host' ? this.state.hostName : this.state.participantName;
    
    const acknowledgment = `Thank you, ${speakerName}, for that reflection. 
    This kind of active listening helps build understanding between you both.`;

    this.speakAsUdine(acknowledgment, 'reflect');

    // Decide next phase based on conversation progress
    if (this.state.turnCount < 6) {
      // Continue with more express/reflect cycles
      setTimeout(() => {
        this.continueExpressReflect();
      }, 2000);
    } else {
      // Move to understanding phase
      setTimeout(() => {
        this.startUnderstandPhase();
      }, 2000);
    }
  }

  /**
   * Continue Express/Reflect cycle
   */
  private continueExpressReflect(): void {
    this.updatePhase('express');
    
    const continuePrompt = `Now let's switch roles. Would the other person like to express their thoughts and feelings? 
    Remember, this is your chance to be heard and understood.`;

    this.speakAsUdine(continuePrompt, 'express');
  }

  /**
   * Start Understanding phase
   */
  private startUnderstandPhase(): void {
    this.updatePhase('understand');
    
    const understandPrompt = `You've both done excellent work expressing yourselves and reflecting what you've heard. 
    Now let's focus on understanding. What common ground do you see? 
    What do you both care about in this situation?`;

    this.speakAsUdine(understandPrompt, 'understand');
  }

  /**
   * Handle Understanding phase
   */
  private handleUnderstandPhase(text: string, userRole: UserRole): void {
    const encouragement = `That's a valuable insight. Understanding each other's perspectives is the foundation for moving forward together.`;
    
    this.speakAsUdine(encouragement, 'understand');

    // Move to resolve phase after some understanding
    if (this.state.turnCount > 8) {
      setTimeout(() => {
        this.startResolvePhase();
      }, 2000);
    }
  }

  /**
   * Start Resolve phase
   */
  private startResolvePhase(): void {
    this.updatePhase('resolve');
    
    const resolvePrompt = `Now that you've shared your perspectives and found some common ground, 
    let's work together on finding a path forward. What solutions or compromises might work for both of you?`;

    this.speakAsUdine(resolvePrompt, 'resolve');
  }

  /**
   * Handle Resolve phase
   */
  private handleResolvePhase(text: string, userRole: UserRole): void {
    const encouragement = `That's a constructive suggestion. Building solutions together shows real progress.`;
    
    this.speakAsUdine(encouragement, 'resolve');

    // Move to healing phase
    if (this.state.turnCount > 12) {
      setTimeout(() => {
        this.startHealPhase();
      }, 2000);
    }
  }

  /**
   * Start Heal phase
   */
  private startHealPhase(): void {
    this.updatePhase('heal');
    
    const healPrompt = `You've both shown courage in having this conversation and working toward understanding. 
    As we wrap up, is there anything you'd like to acknowledge about each other or this process?`;

    this.speakAsUdine(healPrompt, 'heal');
  }

  /**
   * Handle Heal phase
   */
  private handleHealPhase(text: string, userRole: UserRole): void {
    const closing = `Thank you both for your openness and willingness to understand each other. 
    This kind of dialogue builds stronger relationships and deeper understanding. 
    Remember, communication is an ongoing process, and you've taken important steps today.`;

    this.speakAsUdine(closing, 'heal');
  }

  /**
   * Update mediation phase
   */
  private updatePhase(phase: MediationPhase): void {
    this.state.phase = phase;
    this.options.onPhaseChange?.(phase);
    console.log(`🔄 Mediation phase: ${phase}`);
  }

  /**
   * Have Udine speak
   */
  private speakAsUdine(message: string, phase: MediationPhase): void {
    console.log(`🤖 Udine (${phase}): ${message}`);
    this.options.onUdineSpeak?.(message, phase);
  }

  /**
   * Get current mediation state
   */
  getState(): MediationState {
    return { ...this.state };
  }

  /**
   * Reset mediation session
   */
  reset(): void {
    this.state = {
      phase: 'greeting',
      turnCount: 0,
      sessionStartTime: new Date(),
      lastActivity: new Date(),
    };
    console.log('🔄 Mediation session reset');
  }
}

// Singleton instance
let mediationService: MediationFlowService | null = null;

export function getMediationService(options?: MediationOptions): MediationFlowService {
  if (!mediationService) {
    mediationService = new MediationFlowService(options);
  }
  return mediationService;
}

export function resetMediationService(): void {
  if (mediationService) {
    mediationService.reset();
  }
}
