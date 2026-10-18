import { Component, computed, input } from '@angular/core';
import { STATUS_LABEL } from '../core/labels';
import { Status } from '../core/models';

/** Status as text plus colour, so meaning never depends on colour alone. */
@Component({
  selector: 'app-status',
  standalone: true,
  template: `<span class="badge" [attr.data-status]="value()">{{ label() }}</span>`,
})
export class StatusBadgeComponent {
  readonly value = input.required<Status>();
  readonly label = computed(() => STATUS_LABEL[this.value()]);
}
