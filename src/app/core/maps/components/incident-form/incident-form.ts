import { Component, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IncidentCategory, CreateIncidentRequest } from '../../../../models/incident.model';
import { IncidentsService } from '../../../../shared/services/incidents.service';
import { getCategoryStyle, CategoryStyle } from '../../../../shared/constants';

@Component({
  selector: 'app-incident-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './incident-form.html',
  styleUrl: './incident-form.css',
})
export class IncidentForm implements OnInit {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();

  readonly formSubmit = output<CreateIncidentRequest>();
  readonly formCancel = output<void>();

  categories: IncidentCategory[] = [];
  selectedCategory: IncidentCategory | null = null;

  title = '';
  description = '';
  photoPreviews: string[] = [];

  isLoadingCategories = false;

  constructor(private incidentsService: IncidentsService) {}

  ngOnInit(): void {
    this.isLoadingCategories = true;
    this.incidentsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.isLoadingCategories = false;
      },
    });
  }

  getCatStyle(categoryId: number): CategoryStyle {
    return getCategoryStyle(categoryId);
  }

  selectCategory(category: IncidentCategory): void {
    this.selectedCategory = category;
  }

  onFileSelected(event: Event): void {
    const el = event.target as HTMLInputElement;
    if (!el.files) return;

    const files = Array.from(el.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (this.photoPreviews.length >= 5) break;

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    el.value = '';
  }

  removePhoto(index: number): void {
    this.photoPreviews.splice(index, 1);
  }

  get isValid(): boolean {
    return this.selectedCategory !== null && this.description.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid || !this.selectedCategory) return;

    const request: CreateIncidentRequest = {
      categoryId: this.selectedCategory.id,
      title: this.title.trim() || undefined,
      description: this.description.trim(),
      latitude: this.lat(),
      longitude: this.lng(),
    };

    this.formSubmit.emit(request);
  }

  cancel(): void {
    this.formCancel.emit();
  }
}

export type IncidentFormData = CreateIncidentRequest;
