import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

/** Any component that wants the unsaved-changes guard must implement this */
export interface HasUnsavedChanges {
    /** Called by the guard when navigation is about to happen.
     *  Must return true (allow), false (block), or a Promise/Observable thereof. */
    canDeactivate(): boolean | Promise<boolean> | Observable<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
    return component.canDeactivate();
};
