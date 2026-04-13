import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    signal,
    inject,
    OnChanges,
    SimpleChanges,
    AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { KnowledgeGraphService } from '../../services/knowledge-graph.service';
import { ChatMessage, GraphNode } from '../../../../models/knowledge-graph.model';

interface DisplayMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    source?: 'user' | 'node-click';
}

@Component({
    selector: 'app-chat-sidebar',
    standalone: true,
    imports: [FormsModule, DatePipe],
    templateUrl: './chat-sidebar.html',
    styleUrl: './chat-sidebar.css',
})
export class ChatSidebar implements OnChanges, AfterViewChecked {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

    /** When user clicks a node, parent sets this to trigger an explain call */
    @Input() selectedNode: GraphNode | null = null;

    /** Emit highlight IDs so the force graph can pulse nodes */
    @Output() highlightNodes = new EventEmitter<string[]>();

    private readonly kgService = inject(KnowledgeGraphService);

    readonly messages = signal<DisplayMessage[]>([
        { role: 'system', content: 'SafeRoad AI asistanına hoş geldiniz! Bilgi grafiği hakkında sorular sorabilirsiniz.', timestamp: new Date() },
    ]);
    readonly inputText = signal('');
    readonly isLoading = signal(false);

    private conversationHistory: ChatMessage[] = [];
    private shouldScroll = false;
    private readonly threadId: string = (() => {
        const stored = localStorage.getItem('kg_thread_id');
        if (stored) return stored;
        const id = crypto.randomUUID();
        localStorage.setItem('kg_thread_id', id);
        return id;
    })();

    // ── Explain on node selection ─────────────────────────────
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedNode'] && this.selectedNode) {
            this.explainNode(this.selectedNode);
        }
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    private explainNode(node: GraphNode): void {
        this.addMessage('user', `"${node.label}" (${node.type}) düğümünü açıkla`, 'node-click');
        this.isLoading.set(true);

        this.kgService.explainNode(node.id, node.type).subscribe({
            next: (res) => {
                this.addMessage('assistant', res.explanation);
                if (res.highlight_ids?.length) {
                    this.highlightNodes.emit(res.highlight_ids);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.addMessage('assistant', 'Açıklama alınamadı. Lütfen tekrar deneyin.');
                this.isLoading.set(false);
            },
        });
    }

    // ── Chat ──────────────────────────────────────────────────
    sendMessage(): void {
        const text = this.inputText().trim();
        if (!text || this.isLoading()) return;

        this.addMessage('user', text);
        this.inputText.set('');
        this.isLoading.set(true);

        this.conversationHistory.push({ role: 'user', content: text });

        this.kgService.chat(text, this.conversationHistory, this.threadId).subscribe({
            next: (res) => {
                this.addMessage('assistant', res.answer);
                this.conversationHistory.push({ role: 'assistant', content: res.answer });
                if (res.highlight_ids?.length) {
                    this.highlightNodes.emit(res.highlight_ids);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.addMessage('assistant', 'Bir hata oluştu. Lütfen tekrar deneyin.');
                this.isLoading.set(false);
            },
        });
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    updateInput(value: string): void {
        this.inputText.set(value);
    }

    private addMessage(role: DisplayMessage['role'], content: string, source?: DisplayMessage['source']): void {
        this.messages.update((msgs) => [...msgs, { role, content, timestamp: new Date(), source }]);
        this.shouldScroll = true;
    }

    private scrollToBottom(): void {
        const el = this.scrollContainer?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }
}
