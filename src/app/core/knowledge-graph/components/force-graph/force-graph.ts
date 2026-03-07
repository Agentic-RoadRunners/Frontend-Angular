import {
    Component,
    ElementRef,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    AfterViewInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import * as d3 from 'd3';
import { GraphNode, GraphEdge } from '../../../../models/knowledge-graph.model';

/** Internal simulation types */
interface SimNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    type: string;
    weight: number;
    properties: Record<string, unknown>;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
    relationship: string;
}

const NODE_COLORS: Record<string, string> = {
    Incident: '#ef4444',
    Category: '#3b82f6',
    Municipality: '#22c55e',
    LocationCluster: '#f97316',
};

const NODE_GLOWS: Record<string, [string, number]> = {
    Incident: ['#ef4444', 0.4],
    Category: ['#3b82f6', 0.4],
    Municipality: ['#22c55e', 0.4],
    LocationCluster: ['#f97316', 0.4],
};

const NODE_INITIALS: Record<string, string> = {
    Incident: 'I',
    Category: 'C',
    Municipality: 'M',
    LocationCluster: 'L',
};

@Component({
    selector: 'app-force-graph',
    standalone: true,
    templateUrl: './force-graph.html',
    styleUrl: './force-graph.css',
})
export class ForceGraph implements AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('graphContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

    @Input() nodes: GraphNode[] = [];
    @Input() edges: GraphEdge[] = [];
    @Input() highlightIds: string[] = [];

    @Output() nodeClicked = new EventEmitter<GraphNode>();

    private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private simulation!: d3.Simulation<SimNode, SimLink>;
    private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;
    private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private graphWidth = 800;
    private graphHeight = 600;
    private currentZoomScale = 1;
    private isolatedIds = new Set<string>();
    private ready = false;

    ngAfterViewInit(): void {
        this.ready = true;
        this.buildGraph();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.ready && (changes['nodes'] || changes['edges'] || changes['highlightIds'])) {
            this.buildGraph();
        }
    }

    ngOnDestroy(): void {
        this.simulation?.stop();
    }

    // ── Public zoom controls ──────────────────────────────────
    zoomIn(): void {
        this.svg?.transition().duration(300).call(this.zoomBehavior.scaleBy, 1.4);
    }

    zoomOut(): void {
        this.svg?.transition().duration(300).call(this.zoomBehavior.scaleBy, 0.7);
    }

    fitToScreen(): void {
        if (!this.svg || !this.g) return;
        const gNode = this.g.node();
        if (!gNode) return;
        const bbox = gNode.getBBox();
        if (bbox.width === 0 || bbox.height === 0) return;
        const padding = 40;
        const scale = Math.min(
            (this.graphWidth - padding * 2) / bbox.width,
            (this.graphHeight - padding * 2) / bbox.height,
            2,
        );
        const tx = this.graphWidth / 2 - (bbox.x + bbox.width / 2) * scale;
        const ty = this.graphHeight / 2 - (bbox.y + bbox.height / 2) * scale;
        this.svg
            .transition()
            .duration(500)
            .call(this.zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    // ── Build graph ───────────────────────────────────────────
    private buildGraph(): void {
        if (!this.nodes.length) return;

        const el = this.container.nativeElement;
        el.querySelectorAll('.graph-tooltip').forEach((e) => e.remove());
        el.innerHTML = '';

        this.graphWidth = el.clientWidth || 800;
        this.graphHeight = el.clientHeight || 600;
        const width = this.graphWidth;
        const height = this.graphHeight;

        // ── Data ──
        const simNodes: SimNode[] = this.nodes.map((n) => ({
            ...n,
            x: width / 2 + (Math.random() - 0.5) * 60,
            y: height / 2 + (Math.random() - 0.5) * 60,
        }));
        const nodeIndex = new Map(simNodes.map((n) => [n.id, n]));

        const simLinks: SimLink[] = this.edges
            .filter((e) => nodeIndex.has(e.source) && nodeIndex.has(e.target))
            .map((e) => ({
                source: e.source,
                target: e.target,
                relationship: e.relationship,
            }));

        // Connection count map (for tooltip)
        const connCount = new Map<string, number>();
        for (const n of simNodes) connCount.set(n.id, 0);
        for (const l of simLinks) {
            const s = typeof l.source === 'string' ? l.source : (l.source as SimNode).id;
            const t = typeof l.target === 'string' ? l.target : (l.target as SimNode).id;
            connCount.set(s, (connCount.get(s) ?? 0) + 1);
            connCount.set(t, (connCount.get(t) ?? 0) + 1);
        }

        // Adjacency map (for hover dimming)
        const adjacency = new Map<string, Set<string>>();
        for (const n of simNodes) adjacency.set(n.id, new Set());
        for (const l of simLinks) {
            const s = typeof l.source === 'string' ? l.source : (l.source as SimNode).id;
            const t = typeof l.target === 'string' ? l.target : (l.target as SimNode).id;
            adjacency.get(s)!.add(t);
            adjacency.get(t)!.add(s);
        }

        // ── Isolated nodes (pinned right-side column) ──
        const isolatedNodes = simNodes.filter((n) => (connCount.get(n.id) ?? 0) === 0);
        this.isolatedIds = new Set(isolatedNodes.map((n) => n.id));
        const isolatedX = width - 60;
        const isolatedStartY = 90;
        isolatedNodes.forEach((node, i) => {
            node.fx = isolatedX;
            node.fy = isolatedStartY + i * 40;
        });

        // ── SVG ──
        this.svg = d3
            .select(el)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('cursor', 'grab');

        const defs = this.svg.append('defs');

        // Glow filters per node type
        for (const [type, [color, opacity]] of Object.entries(NODE_GLOWS)) {
            this.createGlowFilter(defs, `glow-${type}`, color, opacity, 4);
        }
        this.createGlowFilter(defs, 'glow-selected', '#ffffff', 0.5, 6);

        // Arrow markers
        this.createArrowMarker(defs, 'arrow', 'rgba(255,255,255,0.35)');
        this.createArrowMarker(defs, 'arrow-highlight', 'rgba(255,255,255,0.8)');

        // ── Zoom ──
        this.g = this.svg.append('g');
        this.zoomBehavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 5])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
                this.currentZoomScale = event.transform.k;
                this.g.selectAll('.node-label').attr('opacity', event.transform.k > 0.6 ? 1 : 0);
            });
        this.svg.call(this.zoomBehavior);
        this.svg.on('dblclick.zoom', null);

        // ── Simulation ──
        this.simulation = d3
            .forceSimulation<SimNode>(simNodes)
            .force(
                'link',
                d3
                    .forceLink<SimNode, SimLink>(simLinks)
                    .id((d) => d.id)
                    .distance((l) => {
                        const s = l.source as SimNode;
                        const t = l.target as SimNode;
                        const types = new Set([s.type, t.type]);
                        return types.has('Incident') && types.has('Category') ? 80 : 120;
                    }),
            )
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('x', d3.forceX<SimNode>(width / 2).strength(0.05))
            .force('y', d3.forceY<SimNode>(height / 2).strength(0.05))
            .force('collision', d3.forceCollide<SimNode>().radius((d) => this.radius(d) + 15))
            .alphaDecay(0.02);

        // ── Links ──
        const linkG = this.g.append('g').attr('class', 'links');
        const link = linkG
            .selectAll<SVGLineElement, SimLink>('line')
            .data(simLinks)
            .join('line')
            .attr('stroke', 'rgba(255,255,255,0.35)')
            .attr('stroke-width', (l) => {
                const s = l.source as SimNode;
                const t = l.target as SimNode;
                const avg = ((s.weight || 1) + (t.weight || 1)) / 2;
                return Math.max(1.5, Math.min(3, avg * 1.5));
            })
            .attr('marker-end', 'url(#arrow)');

        // ── Isolated node separator & label ──
        if (isolatedNodes.length > 0) {
            const sepX = isolatedX - 35;
            const sepY1 = isolatedStartY - 25;
            const sepY2 = isolatedStartY + (isolatedNodes.length - 1) * 40 + 25;
            this.g.append('line')
                .attr('x1', sepX).attr('y1', sepY1)
                .attr('x2', sepX).attr('y2', sepY2)
                .attr('stroke', 'rgba(255,255,255,0.1)')
                .attr('stroke-width', 1);
            this.g.append('text')
                .attr('x', isolatedX)
                .attr('y', isolatedStartY - 18)
                .attr('text-anchor', 'middle')
                .attr('fill', 'rgba(255,255,255,0.3)')
                .attr('font-size', 10)
                .attr('pointer-events', 'none')
                .text('Unconnected');
        }

        // ── Node groups ──
        const highlightSet = new Set(this.highlightIds);
        const self = this;

        const nodeG = this.g
            .append('g')
            .attr('class', 'nodes')
            .selectAll<SVGGElement, SimNode>('g')
            .data(simNodes)
            .join('g')
            .attr('cursor', 'pointer')
            .on('click', (_event, d) => {
                const original = this.nodes.find((n) => n.id === d.id);
                if (original) this.nodeClicked.emit(original);
            })
            .call(this.dragBehavior())
            .attr('opacity', (d: SimNode) => this.isolatedIds.has(d.id) ? 0.6 : 1);

        // Glow circle (visible on hover)
        nodeG
            .append('circle')
            .attr('class', 'node-glow')
            .attr('r', (d) => this.radius(d) + 4)
            .attr('fill', 'none')
            .attr('stroke', (d) => NODE_COLORS[d.type] ?? '#94a3b8')
            .attr('stroke-width', 0)
            .attr('opacity', 0.6)
            .attr('filter', (d) => `url(#glow-${d.type})`);

        // Main circle
        nodeG
            .append('circle')
            .attr('class', 'node-circle')
            .attr('r', (d) => this.radius(d))
            .attr('fill', (d) => NODE_COLORS[d.type] ?? '#94a3b8')
            .attr('stroke', (d) => (highlightSet.has(d.id) ? '#ffffff' : 'rgba(255,255,255,0.1)'))
            .attr('stroke-width', (d) => (highlightSet.has(d.id) ? 2.5 : 1))
            .attr('filter', (d) => `url(#glow-${d.type})`);

        // Selection ring (for highlighted nodes from chatbot)
        nodeG
            .append('circle')
            .attr('class', 'node-selection')
            .attr('r', (d) => this.radius(d) + 4)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,2')
            .attr('opacity', (d) => (highlightSet.has(d.id) ? 1 : 0))
            .attr('filter', 'url(#glow-selected)');

        // Initial letter inside node
        nodeG
            .append('text')
            .attr('class', 'node-initial')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#ffffff')
            .attr('font-weight', 'bold')
            .attr('font-size', (d) => Math.max(9, this.radius(d) * 0.8))
            .attr('pointer-events', 'none')
            .text((d) => NODE_INITIALS[d.type] ?? '?');

        // Label below node (stroke outline for dark-bg readability)
        nodeG
            .append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', (d) => this.radius(d) + 16)
            .attr('fill', '#cbd5e1')
            .attr('font-size', 11)
            .attr('pointer-events', 'none')
            .attr('stroke', '#0f1117')
            .attr('stroke-width', 3)
            .attr('paint-order', 'stroke')
            .text((d) => (d.label.length > 16 ? d.label.slice(0, 14) + '…' : d.label));

        // ── Rich Tooltip ──
        const tooltip = d3
            .select(el)
            .append('div')
            .attr('class', 'graph-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(15,17,23,0.95)')
            .style('border', '1px solid rgba(255,255,255,0.1)')
            .style('border-radius', '0.625rem')
            .style('box-shadow', '0 8px 32px rgba(0,0,0,0.5)')
            .style('min-width', '160px')
            .style('overflow', 'hidden')
            .style('pointer-events', 'none')
            .style('opacity', '0')
            .style('transition', 'opacity 0.15s ease')
            .style('z-index', '20')
            .style('font-family', 'inherit');

        // ── Hover interactions ──
        nodeG
            .on('mouseenter', function (event, d) {
                const thisId = d.id;
                const neighbors = adjacency.get(thisId) ?? new Set<string>();

                // Scale up hovered node
                const sel = d3.select(this);
                sel.select('.node-circle')
                    .transition()
                    .duration(150)
                    .attr('r', self.radius(d) * 1.15);
                sel.select('.node-glow')
                    .transition()
                    .duration(150)
                    .attr('r', (self.radius(d) + 4) * 1.15)
                    .attr('stroke-width', 3);
                sel.select('.node-initial')
                    .transition()
                    .duration(150)
                    .attr('font-size', Math.max(9, self.radius(d) * 0.8) * 1.15);
                sel.select('.node-selection')
                    .transition()
                    .duration(150)
                    .attr('r', (self.radius(d) + 4) * 1.15);

                // Dim non-connected nodes
                nodeG
                    .transition()
                    .duration(150)
                    .attr('opacity', (n: SimNode) =>
                        n.id === thisId || neighbors.has(n.id) ? 1 : 0.15,
                    );

                // Highlight connected edges, dim others
                link.transition()
                    .duration(150)
                    .attr('stroke', (l: any) => {
                        const sid = typeof l.source === 'string' ? l.source : l.source.id;
                        const tid = typeof l.target === 'string' ? l.target : l.target.id;
                        return sid === thisId || tid === thisId
                            ? 'rgba(255,255,255,0.8)'
                            : 'rgba(255,255,255,0.06)';
                    })
                    .attr('stroke-width', (l: any) => {
                        const sid = typeof l.source === 'string' ? l.source : l.source.id;
                        const tid = typeof l.target === 'string' ? l.target : l.target.id;
                        return sid === thisId || tid === thisId ? 3 : 0.5;
                    })
                    .attr('marker-end', (l: any) => {
                        const sid = typeof l.source === 'string' ? l.source : l.source.id;
                        const tid = typeof l.target === 'string' ? l.target : l.target.id;
                        return sid === thisId || tid === thisId ? 'url(#arrow-highlight)' : '';
                    });

                // Show tooltip card
                const color = NODE_COLORS[d.type] ?? '#94a3b8';
                const links = connCount.get(d.id) ?? 0;
                const rect = el.getBoundingClientRect();
                tooltip
                    .html(
                        '<div style="padding:0.625rem 0.75rem;border-left:3px solid ' + color + '">' +
                        '<div style="font-size:0.625rem;text-transform:uppercase;letter-spacing:0.05em;color:' + color + ';margin-bottom:0.25rem">' + d.type + '</div>' +
                        '<div style="font-size:0.8125rem;font-weight:600;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">' + d.label + '</div>' +
                        '</div>' +
                        '<div style="display:flex;gap:1rem;padding:0.5rem 0.75rem;border-top:1px solid rgba(255,255,255,0.06);font-size:0.6875rem;color:#94a3b8">' +
                        '<span>Weight: <b style="color:#e2e8f0">' + d.weight.toFixed(2) + '</b></span>' +
                        '<span>Links: <b style="color:#e2e8f0">' + links + '</b></span>' +
                        '</div>',
                    )
                    .style('left', (event.clientX - rect.left + 14) + 'px')
                    .style('top', (event.clientY - rect.top - 10) + 'px')
                    .style('opacity', '1');
            })
            .on('mousemove', (event) => {
                const rect = el.getBoundingClientRect();
                tooltip
                    .style('left', (event.clientX - rect.left + 14) + 'px')
                    .style('top', (event.clientY - rect.top - 10) + 'px');
            })
            .on('mouseleave', function (_event, d) {
                // Reset hovered node scale
                const sel = d3.select(this);
                sel.select('.node-circle')
                    .transition()
                    .duration(200)
                    .attr('r', self.radius(d));
                sel.select('.node-glow')
                    .transition()
                    .duration(200)
                    .attr('r', self.radius(d) + 4)
                    .attr('stroke-width', 0);
                sel.select('.node-initial')
                    .transition()
                    .duration(200)
                    .attr('font-size', Math.max(9, self.radius(d) * 0.8));
                sel.select('.node-selection')
                    .transition()
                    .duration(200)
                    .attr('r', self.radius(d) + 4);

                // Reset all nodes opacity (isolated stay at 0.6)
                nodeG.transition().duration(200).attr('opacity', (n: SimNode) =>
                    self.isolatedIds.has(n.id) ? 0.6 : 1,
                );

                // Reset all edges
                link.transition()
                    .duration(200)
                    .attr('stroke', 'rgba(255,255,255,0.35)')
                    .attr('stroke-width', (l: any) => {
                        const s = l.source as SimNode;
                        const t = l.target as SimNode;
                        const avg = ((s.weight || 1) + (t.weight || 1)) / 2;
                        return Math.max(1.5, Math.min(3, avg * 1.5));
                    })
                    .attr('marker-end', 'url(#arrow)');

                // Hide tooltip
                tooltip.style('opacity', '0');
            });

        // ── Tick ──
        this.simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const r = self.radius(d.target as SimNode) + 6;
                    return d.target.x - (dx / dist) * r;
                })
                .attr('y2', (d: any) => {
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const r = self.radius(d.target as SimNode) + 6;
                    return d.target.y - (dy / dist) * r;
                });

            nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        // Auto fit-to-screen when simulation stabilizes
        this.simulation.on('end', () => {
            this.fitToScreen();
        });
    }

    private radius(d: SimNode): number {
        return Math.max(9, Math.min(32, d.weight * 10));
    }

    private createGlowFilter(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        color: string,
        opacity: number,
        stdDeviation: number,
    ): void {
        const filter = defs
            .append('filter')
            .attr('id', id)
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter
            .append('feFlood')
            .attr('flood-color', color)
            .attr('flood-opacity', opacity)
            .attr('result', 'glowColor');
        filter
            .append('feComposite')
            .attr('in', 'glowColor')
            .attr('in2', 'SourceAlpha')
            .attr('operator', 'in')
            .attr('result', 'coloredAlpha');
        filter
            .append('feGaussianBlur')
            .attr('in', 'coloredAlpha')
            .attr('stdDeviation', stdDeviation)
            .attr('result', 'blur');
        const merge = filter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'blur');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    private createArrowMarker(
        defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
        id: string,
        fill: string,
    ): void {
        defs.append('marker')
            .attr('id', id)
            .attr('viewBox', '0 -4 8 8')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-4L8,0L0,4Z')
            .attr('fill', fill);
    }

    private dragBehavior(): any {
        const sim = this.simulation;
        return d3
            .drag<SVGGElement, SimNode>()
            .on('start', (event, d) => {
                if (!event.active) sim.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
                d3.select(event.sourceEvent?.target?.closest('svg')).style('cursor', 'grabbing');
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) sim.alphaTarget(0);
                if (!this.isolatedIds.has(d.id)) {
                    d.fx = null;
                    d.fy = null;
                }
                d3.select(event.sourceEvent?.target?.closest('svg')).style('cursor', 'grab');
            });
    }
}
