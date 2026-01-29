import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, startWith } from 'rxjs/operators';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-user-picker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './user-picker.html',
  styleUrl: './user-picker.css',
})
export class UserPicker implements OnInit {
  @Input() excludedUserIds: string[] = [];
  @Output() userSelected = new EventEmitter<User>();
  
  private readonly userService = inject(UserService);
  
  searchControl = new FormControl('');
  filteredUsers$!: Observable<User[]>;
  
  ngOnInit(): void {
    this.filteredUsers$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        const searchTerm = typeof query === 'string' ? query : '';
        return this.userService.searchUsers(searchTerm);
      }),
      map(users => this.filterExcludedUsers(users))
    );
  }
  
  onUserSelect(user: User): void {
    this.userSelected.emit(user);
    this.searchControl.setValue('');
  }
  
  displayUserName(user: User | null): string {
    return user ? user.name : '';
  }
  
  private filterExcludedUsers(users: User[]): User[] {
    if (!this.excludedUserIds || this.excludedUserIds.length === 0) {
      return users;
    }
    return users.filter(user => !this.excludedUserIds.includes(user.id));
  }
}

