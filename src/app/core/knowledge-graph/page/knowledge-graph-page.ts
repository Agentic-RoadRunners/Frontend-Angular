import { Component, OnInit, inject, signal } from '@angular/core';
import { KnowledgeGraphService } from '../services/knowledge-graph.service';
import { GraphNode, GraphEdge, GraphMetadata } from '../../../models/knowledge-graph.model';
import { ForceGraph } from '../components/force-graph/force-graph';
import { ChatSidebar } from '../components/chat-sidebar/chat-sidebar';

@Component({
    selector: 'app-knowledge-graph-page',
    standalone: true,
    imports: [ForceGraph, ChatSidebar],
    templateUrl: './knowledge-graph-page.html',
    styleUrl: './knowledge-graph-page.css',
})
export class KnowledgeGraphPage implements OnInit {
    private readonly kgService = inject(KnowledgeGraphService);

    readonly nodes = signal<GraphNode[]>([]);
    readonly edges = signal<GraphEdge[]>([]);
    readonly metadata = signal<GraphMetadata | null>(null);
    readonly selectedNode = signal<GraphNode | null>(null);
    readonly highlightIds = signal<string[]>([]);
    readonly isLoading = signal(true);
    readonly hasError = signal(false);

    ngOnInit(): void {
        this.loadGraph();
    }

    loadGraph(): void {
        this.isLoading.set(true);
        this.hasError.set(false);

        this.kgService.getGraph().subscribe({
            next: (res) => {
                this.nodes.set(res.nodes);
                this.edges.set(res.edges);
                this.metadata.set(res.metadata);
                this.isLoading.set(false);
            },
            error: () => {
                this.hasError.set(true);
                this.isLoading.set(false);
            },
        });
    }

    onNodeClicked(node: GraphNode): void {
        this.selectedNode.set(node);
    }

    onHighlightNodes(ids: string[]): void {
        this.highlightIds.set(ids);
    }
}
