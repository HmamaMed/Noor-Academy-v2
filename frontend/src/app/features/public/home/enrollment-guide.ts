import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../shared/design/icon';

@Component({
  selector: 'app-enrollment-guide',
  imports: [RouterLink, Icon],
  templateUrl: './enrollment-guide.html',
  styleUrl: './enrollment-guide.css',
})
export class EnrollmentGuide {}
