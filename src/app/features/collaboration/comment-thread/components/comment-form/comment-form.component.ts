import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../../core/services/user.service';
import { User } from '../../../../../shared/models/user.model';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './comment-form.component.html',
  styleUrl: './comment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentFormComponent {
  @Input() isSubmitting = false;
  @Output() submitComment = new EventEmitter<{ content: string; mentionedUserIds: string[] }>();

  private readonly userService = inject(UserService);

  contentControl = new FormControl('', [Validators.required, Validators.maxLength(2000)]);
  mentionedUsers: { id: string; name: string }[] = [];

  showAutocomplete = signal(false);
  autocompleteUsers = signal<User[]>([]);
  mentionQuery = signal('');
  selectedAutocompleteIndex = signal(0);

  private mentionSearch$ = new Subject<string>();

  constructor() {
    this.mentionSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => query.length > 0 ? this.userService.searchUsers(query) : of([])),
      takeUntilDestroyed()
    ).subscribe(users => {
      this.autocompleteUsers.set(users);
      this.showAutocomplete.set(users.length > 0);
      this.selectedAutocompleteIndex.set(0);
    });
  }

  get charCount(): number {
    return this.contentControl.value?.length || 0;
  }

  get showCharCount(): boolean {
    return this.charCount > 1500;
  }

  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Detect @mention: look backwards from cursor for @
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      this.mentionQuery.set(query);
      this.mentionSearch$.next(query);
    } else {
      this.showAutocomplete.set(false);
    }
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if (!this.showAutocomplete()) return;

    const users = this.autocompleteUsers();
    const idx = this.selectedAutocompleteIndex();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedAutocompleteIndex.set((idx + 1) % users.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedAutocompleteIndex.set(idx > 0 ? idx - 1 : users.length - 1);
    } else if (event.key === 'Enter' && users.length > 0) {
      event.preventDefault();
      this.selectMentionUser(users[idx]);
    } else if (event.key === 'Escape') {
      this.showAutocomplete.set(false);
    }
  }

  selectMentionUser(user: User): void {
    const value = this.contentControl.value || '';
    const mentionRegex = /@\w*$/;
    const newValue = value.replace(mentionRegex, '@' + user.name + ' ');
    this.contentControl.setValue(newValue);

    if (!this.mentionedUsers.find(u => u.id === user.id)) {
      this.mentionedUsers.push({ id: user.id, name: user.name });
    }

    this.showAutocomplete.set(false);
  }

  getUserInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  onSubmit(): void {
    if (this.contentControl.invalid || this.isSubmitting) return;

    const content = (this.contentControl.value || '').trim();
    if (!content) return;

    const mentionedUserIds = this.mentionedUsers
      .filter(u => content.includes('@' + u.name))
      .map(u => u.id);

    this.submitComment.emit({ content, mentionedUserIds });
    this.contentControl.reset('');
    this.mentionedUsers = [];
  }
}
