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
import { AuthService } from '../../../../auth/auth.service';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-incident-comments-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-comments-panel.html',
  styleUrl: './incident-comments-panel.css',
})
export class IncidentCommentsPanel implements OnInit, OnChanges {
  readonly incident = input.required<IncidentResponse>();
  readonly close = output<void>();

  private readonly commentService = inject(CommentService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  comments = signal<CommentResponse[]>([]);
  newCommentText = '';
  isLoading = signal(false);
  isSubmitting = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.loadComments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incident'] && !changes['incident'].firstChange) {
      this.loadComments();
    }
  }

  loadComments(): void {
    this.isLoading.set(true);
    this.error.set('');
    this.commentService.getComments(this.incident().id).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Yorumlar yüklenemedi.');
        this.isLoading.set(false);
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

    this.isSubmitting.set(true);
    this.commentService.createComment(this.incident().id, text).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.comments.update((list) => [...list, res.data!]);
        }
        this.newCommentText = '';
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
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
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onClose(): void {
    this.close.emit();
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
}
