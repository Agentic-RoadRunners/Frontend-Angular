import {
  Component,
  input,
  output,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IncidentResponse } from '../../../../models/incident.model';
import { CommentResponse } from '../../../../models/comment.model';
import { CommentService } from '../../../../shared/services/comment.service';
import { VerificationService } from '../../../../shared/services/verification.service';
import { AuthService } from '../../../../auth/auth.service';
import { getCategoryStyle } from '../../../../shared/constants';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-inspect-incident-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspect-incident-modal.html',
  styleUrl: './inspect-incident-modal.css',
})
export class InspectIncidentModal implements OnInit, OnChanges {
  readonly incident = input.required<IncidentResponse>();
  readonly close = output<void>();
  readonly verificationChanged = output<void>();

  private readonly commentService = inject(CommentService);
  private readonly verificationService = inject(VerificationService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  comments = signal<CommentResponse[]>([]);
  newCommentText = '';
  isLoadingComments = signal(false);
  isSubmittingComment = signal(false);
  isVerifying = signal(false);
  isDisputing = signal(false);
  commentError = signal('');

  categoryStyle = signal<{ icon: string; color: string }>({ icon: '', color: '' });

  ngOnInit(): void {
    this.categoryStyle.set(getCategoryStyle(this.incident().categoryId));
    this.loadComments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incident'] && !changes['incident'].firstChange) {
      this.categoryStyle.set(getCategoryStyle(this.incident().categoryId));
      this.loadComments();
    }
  }

  loadComments(): void {
    this.isLoadingComments.set(true);
    this.commentError.set('');
    this.commentService.getComments(this.incident().id).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.isLoadingComments.set(false);
      },
      error: () => {
        this.commentError.set('Yorumlar yüklenemedi.');
        this.isLoadingComments.set(false);
      },
    });
  }

  async onVerify(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const confirmed = await this.confirmDialog.open({
      theme: 'success',
      icon: 'fa-shield-alt',
      title: 'Verify Incident',
      message: 'Are you sure you want to verify this incident?',
      confirmText: 'Verify',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    this.isVerifying.set(true);
    this.verificationService.verify(this.incident().id).subscribe({
      next: () => {
        this.isVerifying.set(false);
        this.verificationChanged.emit();
      },
      error: (err) => {
        this.isVerifying.set(false);
        if (err.status === 401) this.router.navigate(['/login']);
        else {
          this.confirmDialog.open({
            type: 'alert',
            theme: 'danger',
            title: 'Error',
            message: err?.error?.message ?? 'An error occured.',
          });
        }
      },
    });
  }

  async onDispute(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const confirmed = await this.confirmDialog.open({
      theme: 'danger',
      icon: 'fa-flag',
      title: 'Dispute Incident',
      message: 'Are you sure you want to dispute this incident?',
      confirmText: 'Dispute',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    this.isDisputing.set(true);
    this.verificationService.dispute(this.incident().id).subscribe({
      next: () => {
        this.isDisputing.set(false);
        this.verificationChanged.emit();
      },
      error: (err) => {
        this.isDisputing.set(false);
        if (err.status === 401) this.router.navigate(['/login']);
        else {
          this.confirmDialog.open({
            type: 'alert',
            theme: 'danger',
            title: 'Error',
            message: err?.error?.message ?? 'Bir hata oluştu.',
          });
        }
      },
    });
  }

  submitComment(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const text = this.newCommentText.trim();
    if (!text) return;

    this.isSubmittingComment.set(true);
    this.commentService.createComment(this.incident().id, text).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.comments.update((list) => [...list, res.data!]);
        }
        this.newCommentText = '';
        this.isSubmittingComment.set(false);
        this.verificationChanged.emit();
      },
      error: () => {
        this.isSubmittingComment.set(false);
      },
    });
  }

  onCommentKeydown(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.submitComment();
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      theme: 'danger',
      icon: 'fa-trash-alt',
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    this.commentService.deleteComment(this.incident().id, commentId).subscribe({
      next: () => {
        this.comments.update((list) => list.filter((c) => c.id !== commentId));
        this.verificationChanged.emit();
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  get statusColor(): string {
    const map: Record<string, string> = {
      Pending: '#f97316',
      Verified: '#22c55e',
      Disputed: '#ef4444',
      Resolved: '#64748b',
    };
    return map[this.incident().status] ?? '#94a3b8';
  }

  getTimeAgo(dateStr: string): string {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  }

  getInitials(userName?: string): string {
    if (!userName) return '?';
    return userName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  isOwnComment(comment: CommentResponse): boolean {
    const user = this.auth.currentUser();
    return !!user && comment.userId === user.id;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
